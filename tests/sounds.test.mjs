import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NOISES } from '../src/domain/schedule.ts';

test('all three bundled noise loops are distinct, eight-second, non-silent mono PCM tracks', () => {
  const tracks = NOISES.map(type => readFileSync(new URL(`../assets/sounds/${type}.wav`, import.meta.url)));
  for (const wav of tracks) {
    assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
    assert.equal(wav.toString('ascii', 8, 16), 'WAVEfmt ');
    assert.equal(wav.readUInt16LE(20), 1);
    assert.equal(wav.readUInt16LE(22), 1);
    assert.equal(wav.readUInt16LE(34), 16);
    assert.equal(wav.readUInt32LE(40), wav.length - 44);
    assert.equal((wav.length - 44) / (2 * wav.readUInt32LE(24)), 8);
    assert.ok(wav.subarray(44).some(byte => byte !== 0));
  }
  assert.equal(new Set(tracks.map(wav => wav.subarray(44, 512).toString('hex'))).size, 3);
});
