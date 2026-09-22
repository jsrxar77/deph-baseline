// Minimal 16-bit PCM WAV writer for an AudioBuffer-like object ({ numberOfChannels, sampleRate,
// length, getChannelData(i) }) — no dependency needed for something this small.
export function audioBufferToWavBuffer(audioBuffer) {
  const numCh = audioBuffer.numberOfChannels;
  const sr = audioBuffer.sampleRate;
  const len = audioBuffer.length;
  const chans = Array.from({ length: numCh }, (_, i) => audioBuffer.getChannelData(i));
  const bytesPerSample = 2;
  const blockAlign = numCh * bytesPerSample;
  const dataSize = len * blockAlign;
  const buf = Buffer.alloc(44 + dataSize);

  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); // PCM fmt chunk size
  buf.writeUInt16LE(1, 20); // PCM format
  buf.writeUInt16LE(numCh, 22);
  buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * blockAlign, 28); // byte rate
  buf.writeUInt16LE(blockAlign, 32);
  buf.writeUInt16LE(16, 34); // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < numCh; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][i]));
      buf.writeInt16LE(Math.round(s < 0 ? s * 32768 : s * 32767), offset);
      offset += 2;
    }
  }
  return buf;
}
