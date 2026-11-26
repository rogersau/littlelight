import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS } from '../src/domain/schedule.ts';
import { decodeSettings } from '../src/domain/settings-storage.ts';

test('fresh devices use the default settings without reporting corruption', () => {
  const { settings, warning } = decodeSettings(null);
  assert.deepEqual(settings, DEFAULT_SETTINGS);
  assert.notEqual(settings.everyday, DEFAULT_SETTINGS.everyday);
  assert.equal(warning, null);
});

test('malformed, invalid and incompatible saves safely fall back to the full defaults', () => {
  for (const raw of ['{', 'null', 'false', JSON.stringify({ ...DEFAULT_SETTINGS, version: 99 })]) {
    const { settings, warning } = decodeSettings(raw);
    assert.deepEqual(settings, DEFAULT_SETTINGS);
    assert.match(warning, /could not be read/);
  }
});

test('valid version-one saves retain all settings and clear unknown fields', () => {
  const { colorIntensity, ...legacy } = DEFAULT_SETTINGS;
  const { settings, warning } = decodeSettings(JSON.stringify({ ...legacy, showCountdown: true, extra: 'ignored' }));
  assert.deepEqual(settings, { ...legacy, showCountdown: true, colorIntensity: 0 });
  assert.equal(warning, null);
});
