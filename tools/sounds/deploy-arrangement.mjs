#!/usr/bin/env node
/**
 * deploy-arrangement.mjs — Deploys a full Strudel composition's MIDI tracks
 * into Ableton Live's Arrangement View with locators and tempo sync.
 *
 * Usage:
 *   node tools/sounds/deploy-arrangement.mjs <file.strudel> --cycles N [--names a,b,c] [--locators "Name:cycles,Name:cycles,..."]
 *
 * --locators takes the piece's own arc (same name/cycles pairs as its yaml's `arc:` list), e.g. for
 * Gnosis: --locators "Pleroma:120,Descent:150,Density:180,Grounding:150,Transfiguration:120"
 */

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import net from 'node:net';
import { evalStrudel } from './eval-strudel.mjs';
import { buildTracks, bpmFromCps } from './midi-map.mjs';

function parseArgs(argv) {
  const a = { file: undefined, cycles: undefined, names: [], locators: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--cycles') a.cycles = Number(argv[++i]);
    else if (argv[i] === '--names') a.names = argv[++i].split(',');
    else if (argv[i] === '--locators') {
      a.locators = argv[++i].split(',').map((pair) => {
        const [name, cycles] = pair.split(':');
        return { name, cycles: Number(cycles) };
      });
    }
    else if (!a.file) a.file = argv[i];
  }
  return a;
}

const args = parseArgs(process.argv.slice(2));
if (!args.file || !args.cycles) {
  console.error('Usage: node tools/sounds/deploy-arrangement.mjs <file.strudel> --cycles N [--names a,b,c] [--locators "Name:cycles,..."]');
  process.exit(1);
}

const HOST = '127.0.0.1';
const PORT = 9877;

function sendCommand(cmd) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let dataBuffer = '';

    client.connect(PORT, HOST, () => {
      client.write(JSON.stringify(cmd) + '\n');
    });

    client.on('data', (chunk) => {
      dataBuffer += chunk.toString('utf8');
      if (dataBuffer.includes('\n') || dataBuffer.endsWith('}')) {
        try {
          const parsed = JSON.parse(dataBuffer.trim());
          client.destroy();
          resolve(parsed);
        } catch {
          // keep buffering
        }
      }
    });

    client.on('error', (err) => {
      client.destroy();
      reject(err);
    });

    client.setTimeout(6000, () => {
      client.destroy();
      reject(new Error(`Ableton socket timeout on command ${cmd.type}`));
    });
  });
}

async function main() {
  console.log(`Parsing Strudel piece: ${args.file} (${args.cycles} cycles)...`);
  const code = readFileSync(args.file, 'utf8');
  const { pattern, cps, core } = await evalStrudel(code);
  const bpm = bpmFromCps(cps);
  const totalBeats = args.cycles * 4;

  const haps = pattern.queryArc(0, args.cycles).filter((h) => h.hasOnset());
  const { tracks } = buildTracks(haps, {
    noteToMidi: core.noteToMidi,
    names: args.names.length ? args.names : undefined,
  });

  console.log(`BPM: ${bpm}, Total beats: ${totalBeats} (${args.cycles} bars = ${(totalBeats / (bpm / 60) / 60).toFixed(1)} mins)`);
  console.log(`Tracks to deploy: ${tracks.length}`);

  // 1. Sync Tempo
  await sendCommand({ type: 'set_tempo', params: { tempo: bpm } });
  console.log(`Tempo synchronized to ${bpm} BPM`);

  // 2. Deploy each track
  for (let i = 0; i < tracks.length; i++) {
    const t = tracks[i];
    const trackIndex = (t.channel !== undefined) ? t.channel : (t.slotIndex !== undefined ? t.slotIndex : i);
    console.log(`\nDeploying Track ${trackIndex} [${t.name}] (${t.notes.length} notes)...`);

    // Create session clip of total length (beats)
    await sendCommand({
      type: 'create_clip',
      params: { track_index: trackIndex, clip_index: 0, length: totalBeats }
    });

    // Clear any existing notes
    await sendCommand({
      type: 'clear_notes_from_clip',
      params: { track_index: trackIndex, clip_index: 0 }
    });

    // Convert notes to beats with ambient calibration (soft pianissimo touch, never harsh v127)
    const notesPayload = t.notes.map((n) => ({
      pitch: n.pitch,
      start_time: +(n.begin * 4).toFixed(4),
      duration: +Math.max(0.1, (n.end - n.begin) * 4).toFixed(4),
      velocity: Math.max(25, Math.min(65, Math.round(28 + (n.velocity / 127) * 32))),
      mute: false
    }));

    // Add notes in chunks of 300 to avoid socket buffer limits
    const CHUNK_SIZE = 300;
    for (let c = 0; c < notesPayload.length; c += CHUNK_SIZE) {
      const chunk = notesPayload.slice(c, c + CHUNK_SIZE);
      await sendCommand({
        type: 'add_notes_to_clip',
        params: { track_index: trackIndex, clip_index: 0, notes: chunk }
      });
    }

    // Set clip name
    await sendCommand({
      type: 'set_clip_name',
      params: { track_index: trackIndex, clip_index: 0, name: t.name }
    });

    // Duplicate session clip to arrangement at 0.0 beats
    const dupRes = await sendCommand({
      type: 'duplicate_session_clip_to_arrangement',
      params: { track_index: trackIndex, clip_index: 0, destination_time: 0.0 }
    });
    console.log(`  -> Duplicated to Arrangement: ${dupRes.status}`);

    // Set arrangement clip name
    await sendCommand({
      type: 'set_arrangement_clip_name',
      params: { track_index: trackIndex, clip_index: 0, name: t.name }
    });
  }

  // 3. Create locators from the piece's own arc (--locators), if given
  if (args.locators.length) {
    console.log('\nCreating section locators...');
    let cursor = 0;
    const locators = args.locators.map((section, i) => {
      const beat = cursor * 4;
      cursor += section.cycles;
      return { name: `${i + 1}. ${section.name}`, beat };
    });
    locators.push({ name: 'End', beat: totalBeats });

    for (const loc of locators) {
      try {
        await sendCommand({
          type: 'create_locator',
          params: { name: loc.name, time_val: loc.beat }
        });
        console.log(`  Locator [${loc.name}] placed at beat ${loc.beat}`);
      } catch (e) {
        console.warn(`  Could not place locator [${loc.name}]: ${e.message}`);
      }
    }
  }

  // 4. Reset View & Transport
  await sendCommand({ type: 'switch_to_arrangement_view', params: {} });
  await sendCommand({ type: 'set_current_song_time', params: { time_val: 0.0 } });
  console.log('\nSwitched to Arrangement View at 0:00. Deployment Complete!');
}

main().catch((err) => {
  console.error('Fatal Deployment Error:', err);
  process.exit(1);
});
