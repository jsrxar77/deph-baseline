#!/usr/bin/env node
/**
 * ableton-controller.mjs — Bridge tool to inspect devices, set parameters,
 * map macros, and trigger playback/clips in Ableton Live via AbletonMCP (TCP 9877)
 * or Producer Pal (HTTP 3350).
 *
 * Usage:
 *   node tools/sounds/ableton-controller.mjs tracks
 *   node tools/sounds/ableton-controller.mjs inspect <track_index> [device_index]
 *   node tools/sounds/ableton-controller.mjs set <track_index> <device_index> <param_name_or_index> <value>
 *   node tools/sounds/ableton-controller.mjs wrap <track_index> [rack_name]
 *   node tools/sounds/ableton-controller.mjs master-setup
 *   node tools/sounds/ableton-controller.mjs ppal <tool_name> '<json_args>'
 *   node tools/sounds/ableton-controller.mjs fire <track_index> <clip_index>
 *   node tools/sounds/ableton-controller.mjs stop [track_index] [clip_index]
 *   node tools/sounds/ableton-controller.mjs play
 */

import net from 'node:net';

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
          // Keep buffering until full JSON is received
        }
      }
    });

    client.on('error', (err) => {
      client.destroy();
      reject(err);
    });

    client.setTimeout(4000, () => {
      client.destroy();
      reject(new Error('Ableton socket timeout (port 9877)'));
    });
  });
}

async function inspectDevice(trackIndex, deviceIndex = 0) {
  const res = await sendCommand({
    type: 'get_device_parameters',
    params: { track_index: trackIndex, device_index: deviceIndex }
  });

  if (res.status !== 'success') {
    console.error('Error:', res.message || res);
    process.exit(1);
  }

  const dev = res.result.device;
  console.log(`\nDevice [${deviceIndex}] on Track [${trackIndex}]: "${dev.name}" (${dev.class_name})`);
  console.log('='.repeat(70));
  console.log(`Index | Parameter Name       | Current Value   | Range [Min .. Max]`);
  console.log('-'.repeat(70));
  for (const p of dev.parameters) {
    const valStr = typeof p.value === 'number' ? p.value.toFixed(3) : p.value;
    const minStr = typeof p.min === 'number' ? p.min.toFixed(1) : p.min;
    const maxStr = typeof p.max === 'number' ? p.max.toFixed(1) : p.max;
    console.log(
      `${String(p.index).padStart(5)} | ${p.name.padEnd(20)} | ${String(valStr).padStart(15)} | [${minStr} .. ${maxStr}]`
    );
  }
}

async function setParameter(trackIndex, deviceIndex, paramTarget, value) {
  // First fetch parameters to resolve by name if needed
  const res = await sendCommand({
    type: 'get_device_parameters',
    params: { track_index: trackIndex, device_index: deviceIndex }
  });

  if (res.status !== 'success') {
    throw new Error(res.message || 'Could not fetch device');
  }

  const params = res.result.device.parameters;
  let targetIndex = -1;
  let targetName = '';

  if (!isNaN(Number(paramTarget))) {
    targetIndex = Number(paramTarget);
    const found = params.find((p) => p.index === targetIndex);
    targetName = found ? found.name : `Param #${targetIndex}`;
  } else {
    const match = params.find(
      (p) => p.name.toLowerCase() === paramTarget.toLowerCase() || p.name.toLowerCase().includes(paramTarget.toLowerCase())
    );
    if (!match) {
      throw new Error(`Parameter matching "${paramTarget}" not found in device`);
    }
    targetIndex = match.index;
    targetName = match.name;
  }

  const setRes = await sendCommand({
    type: 'set_device_parameter',
    params: {
      track_index: trackIndex,
      device_index: deviceIndex,
      parameter_index: targetIndex,
      value: Number(value)
    }
  });

  if (setRes.status !== 'success') {
    throw new Error(setRes.message || 'Failed to set parameter');
  }

  console.log(`Updated Track [${trackIndex}] Device [${deviceIndex}] -> "${targetName}" (#${targetIndex}) = ${value}`);
  return setRes.result;
}

async function main() {
  const [action, ...args] = process.argv.slice(2);

  if (!action) {
    console.log(`
Usage:
  node ableton-controller.mjs inspect <track_index> [device_index]
  node ableton-controller.mjs set <track_index> <device_index> <param_name_or_index> <value>
  node ableton-controller.mjs fire <track_index> <clip_index>
  node ableton-controller.mjs stop [track_index] [clip_index]
  node ableton-controller.mjs play
`);
    process.exit(0);
  }

  try {
    if (action === 'tracks') {
      const snap = await sendCommand({
        type: 'get_session_snapshot',
        params: { include_notes: false, include_params: false }
      });
      if (snap.status === 'success' && snap.result) {
        console.log(`\nAbleton Live Session [Tempo: ${snap.result.tempo} BPM, Tracks: ${snap.result.tracks.length}]`);
        console.log('='.repeat(70));
        snap.result.tracks.forEach((t, i) => {
          const devList = (t.devices || []).map(d => `${d.name} (${d.class_name})`).join(' -> ') || 'Empty';
          console.log(`Track ${String(i).padStart(2)} | ${t.name.padEnd(45)} | ${devList}`);
        });
        const masterDevs = (snap.result.master_track?.devices || []).map(d => `${d.name} (${d.class_name})`).join(' -> ') || 'Empty';
        console.log(`Master   | Master Track                                  | ${masterDevs}`);
        console.log('='.repeat(70));
      }
    } else if (action === 'inspect') {
      const trackIdx = parseInt(args[0] || '0', 10);
      const devIdx = parseInt(args[1] || '0', 10);
      await inspectDevice(trackIdx, devIdx);
    } else if (action === 'set') {
      const trackIdx = parseInt(args[0], 10);
      const devIdx = parseInt(args[1], 10);
      const param = args[2];
      const val = parseFloat(args[3]);
      await setParameter(trackIdx, devIdx, param, val);
    } else if (action === 'fire') {
      const trackIdx = parseInt(args[0], 10);
      const clipIdx = parseInt(args[1], 10);
      const res = await sendCommand({
        type: 'fire_clip',
        params: { track_index: trackIdx, clip_index: clipIdx }
      });
      console.log('Fired clip:', res);
    } else if (action === 'stop') {
      if (args[0] !== undefined) {
        const trackIdx = parseInt(args[0], 10);
        const clipIdx = parseInt(args[1] || '0', 10);
        const res = await sendCommand({
          type: 'stop_clip',
          params: { track_index: trackIdx, clip_index: clipIdx }
        });
        console.log('Stopped clip:', res);
      } else {
        const res = await sendCommand({ type: 'stop_playback' });
        console.log('Stopped playback:', res);
      }
    } else if (action === 'play') {
      const res = await sendCommand({ type: 'start_playback' });
      console.log('Started playback:', res);
    } else if (action === 'wrap') {
      const trackIdx = parseInt(args[0] || '0', 10);
      const name = args[1] || `Track ${trackIdx} Rack`;
      const response = await fetch('http://localhost:3350/api/tools/ppal-update-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `t${trackIdx}/d0`,
          wrapInRack: true,
          name: name
        })
      });
      const data = await response.json();
      console.log(`Wrapped Track [${trackIdx}] in Instrument Rack:`, data);
    } else if (action === 'master-setup') {
      console.log('Provisioning Master Chain on mt via Producer Pal...');
      // 1. EQ Eight
      await fetch('http://localhost:3350/api/tools/ppal-create-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'mt/d+', device: 'EQ Eight' })
      });
      // 2. Glue Compressor
      await fetch('http://localhost:3350/api/tools/ppal-create-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'mt/d+', device: 'Glue Compressor' })
      });
      // 3. Limiter
      await fetch('http://localhost:3350/api/tools/ppal-create-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'mt/d+', device: 'Limiter' })
      });

      // Configure EQ Eight
      await fetch('http://localhost:3350/api/tools/ppal-update-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'mt/d0',
          params: [
            { name: '1 Filter Type A', value: 'High Pass 48dB' },
            { name: '1 Frequency A', value: '25 Hz' },
            { name: '2 Frequency A', value: '320 Hz' },
            { name: '2 Gain A', value: '-1.2 dB' },
            { name: '2 Q A', value: '0.8' },
            { name: '4 Frequency A', value: '11500 Hz' },
            { name: '4 Gain A', value: '0.8 dB' }
          ]
        })
      });

      // Configure Glue Compressor
      await fetch('http://localhost:3350/api/tools/ppal-update-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'mt/d1',
          params: [
            { name: 'Ratio', value: '2' },
            { name: 'Attack', value: '30' },
            { name: 'Release', value: 'A' },
            { name: 'Output', value: '0.5' }
          ]
        })
      });

      // Configure Limiter
      await fetch('http://localhost:3350/api/tools/ppal-update-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'mt/d2',
          params: [
            { name: 'Ceiling', value: '-1.0 dB' },
            { name: 'Auto', value: 'On' },
            { name: 'Mode', value: 'True Peak' },
            { name: 'Lookahead', value: '6 ms' }
          ]
        })
      });

      console.log('Master Chain provisioned & calibrated: EQ Eight (25Hz HP) -> Glue Compressor (2:1 Auto) -> Limiter (-1.0 dBTP)');
    } else if (action === 'ppal') {
      const toolName = args[0];
      const toolArgs = args[1] ? JSON.parse(args[1]) : {};
      const response = await fetch(`http://localhost:3350/api/tools/${toolName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toolArgs)
      });
      const data = await response.json();
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error(`Unknown action: ${action}`);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
