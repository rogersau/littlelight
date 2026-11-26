import { writeFileSync } from 'node:fs';

// Mono PCM. Based on the original Little Light noise filters, with a seeded
// source so regenerating the bundled files produces byte-identical tracks.
const sampleRate = 24_000;
const frames = 8 * sampleRate;
const fade = Math.floor(0.08 * sampleRate);
const warmup = sampleRate;

function makeNoise(type, seed) {
  const samples = new Float32Array(frames + fade);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, brown = 0;
  for (let i = -warmup; i < samples.length; i += 1) {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    const white = (seed >>> 0) / 0x80000000 - 1;
    let sample;
    if (type === 'white') {
      sample = white * 0.38;
    } else if (type === 'brown') {
      brown = (brown + 0.02 * white) / 1.02;
      sample = brown * 2.1;
    } else {
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      sample = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
      b6 = white * 0.115926;
    }
    if (i >= 0) samples[i] = sample;
  }
  // Start on the continuation of the last frame, then crossfade into the
  // beginning. The loop boundary behaves like adjacent frames in the noise.
  for (let i = 0; i < fade; i += 1) {
    const ratio = i / fade;
    samples[i] = samples[frames + i] * (1 - ratio) + samples[i] * ratio;
  }
  return samples.subarray(0, frames);
}

function encodeWave(samples) {
  const dataBytes = samples.length * 2;
  const wave = Buffer.alloc(44 + dataBytes);
  wave.write('RIFF', 0);
  wave.writeUInt32LE(wave.length - 8, 4);
  wave.write('WAVEfmt ', 8);
  wave.writeUInt32LE(16, 16);
  wave.writeUInt16LE(1, 20); // PCM
  wave.writeUInt16LE(1, 22); // mono
  wave.writeUInt32LE(sampleRate, 24);
  wave.writeUInt32LE(sampleRate * 2, 28);
  wave.writeUInt16LE(2, 32);
  wave.writeUInt16LE(16, 34);
  wave.write('data', 36);
  wave.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < samples.length; i += 1) {
    wave.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  }
  return wave;
}

for (const [type, seed] of [['white', 23259], ['pink', 14453917], ['brown', 5549817]]) {
  writeFileSync(new URL(`../assets/sounds/${type}.wav`, import.meta.url), encodeWave(makeNoise(type, seed)));
}
