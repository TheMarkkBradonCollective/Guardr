/**
 * Generates a short two-tone roger beep (Motorola-style walkie chirp) as WAV.
 * Run: node scripts/generate-walkie-chirp.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../public/sounds');
const outPath = join(outDir, 'walkie-chirp.wav');

const sampleRate = 44100;

function envelope(t, start, duration) {
  const x = (t - start) / duration;
  if (x < 0 || x > 1) return 0;
  return Math.sin(Math.PI * x);
}

function sampleAt(t) {
  const gain = 0.42;
  const tone1 = envelope(t, 0, 0.07) * Math.sin(2 * Math.PI * 2130 * t);
  const tone2 = envelope(t, 0.105, 0.09) * Math.sin(2 * Math.PI * 1850 * (t - 0.105));
  return gain * (tone1 + tone2);
}

const totalSeconds = 0.22;
const numSamples = Math.floor(sampleRate * totalSeconds);
const pcm = new Int16Array(numSamples);

for (let i = 0; i < numSamples; i += 1) {
  const t = i / sampleRate;
  const v = Math.max(-1, Math.min(1, sampleAt(t)));
  pcm[i] = Math.round(v * 32767);
}

const dataSize = pcm.length * 2;
const buffer = Buffer.alloc(44 + dataSize);
let o = 0;

function writeStr(s) {
  buffer.write(s, o);
  o += s.length;
}
function writeU32(v) {
  buffer.writeUInt32LE(v, o);
  o += 4;
}
function writeU16(v) {
  buffer.writeUInt16LE(v, o);
  o += 2;
}

writeStr('RIFF');
writeU32(36 + dataSize);
writeStr('WAVE');
writeStr('fmt ');
writeU32(16);
writeU16(1);
writeU16(1);
writeU32(sampleRate);
writeU32(sampleRate * 2);
writeU16(2);
writeU16(16);
writeStr('data');
writeU32(dataSize);

for (let i = 0; i < pcm.length; i += 1) {
  buffer.writeInt16LE(pcm[i], o);
  o += 2;
}

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, buffer);
console.log(`Wrote ${outPath} (${buffer.length} bytes)`);
