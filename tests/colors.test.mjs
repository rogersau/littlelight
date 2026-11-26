import test from 'node:test';
import assert from 'node:assert/strict';
import { getColorPalette, DEFAULT_COLOR_INTENSITY, LEGACY_COLOR_INTENSITY } from '../src/domain/colors.ts';
import { DEFAULT_SETTINGS, validateSettings, normalizeSettings, getScheduleState } from '../src/domain/schedule.ts';
const clone = value => structuredClone(value);
function saturation(hex) {
  const values = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
  return (Math.max(...values) - Math.min(...values)) / Math.max(...values);
}
test('new routines default to a distinct, validated color intensity', () => {
  assert.equal(DEFAULT_SETTINGS.colorIntensity, DEFAULT_COLOR_INTENSITY);
  assert.equal(DEFAULT_COLOR_INTENSITY, 70);
  assert.equal(validateSettings(DEFAULT_SETTINGS).valid, true);
});
test('existing version-1 saves migrate without losing any routine or display choice', () => {
  const previous = { ...clone(DEFAULT_SETTINGS), brightness: 25, showClock: false, sound: 'brown', everyday: { bedtime: '20:15', quiet: '06:45', rise: '07:15' } };
  delete previous.colorIntensity;
  assert.equal(validateSettings(previous).valid, true);
  const migrated = normalizeSettings(previous);
  assert.equal(migrated.colorIntensity, LEGACY_COLOR_INTENSITY);
  assert.deepEqual(migrated, { ...previous, colorIntensity: 0 });
});
test('all slider settings survive JSON storage without changing brightness or timing', () => {
  const date = new Date(2026, 9, 12, 23, 15);
  const baseline = getScheduleState(DEFAULT_SETTINGS, date);
  for (let intensity = 0; intensity <= 100; intensity += 5) {
    const candidate = { ...clone(DEFAULT_SETTINGS), brightness: 35, colorIntensity: intensity };
    assert.equal(validateSettings(candidate).valid, true);
    const restored = normalizeSettings(JSON.parse(JSON.stringify(candidate)));
    assert.deepEqual(restored, candidate);
    assert.equal(restored.brightness, 35);
    assert.deepEqual(getScheduleState(restored, date), baseline);
  }
});
test('invalid explicit intensity is rejected rather than treated as a legacy save', () => {
  for (const intensity of [-1, 101, NaN, Infinity, '70', null, undefined, {}, []]) {
    const candidate = { ...clone(DEFAULT_SETTINGS), colorIntensity: intensity };
    assert.equal(validateSettings(candidate).valid, false, String(intensity));
    assert.deepEqual(normalizeSettings(candidate), clone(DEFAULT_SETTINGS));
  }
});
test('vivid endpoints are strongly saturated and visibly red, yellow, and green', () => {
  const gentle = getColorPalette(0), vivid = getColorPalette(100);
  for (const variable of ['--moon-mid', '--quiet-dark', '--rise-dark', '--red', '--yellow', '--green']) {
    assert.ok(saturation(vivid[variable]) > saturation(gentle[variable]) + .2, variable);
    assert.ok(saturation(vivid[variable]) > .75, variable);
  }
  assert.equal(vivid['--moon-mid'], '#f12c35');
  assert.equal(vivid['--quiet-dark'], '#eacd0c');
  assert.equal(vivid['--rise-dark'], '#13bd49');
});
test('palette clamps only its own input and never changes brightness or text colors', () => {
  assert.deepEqual(getColorPalette(-10), getColorPalette(0));
  assert.deepEqual(getColorPalette(110), getColorPalette(100));
  assert.deepEqual(getColorPalette(NaN), getColorPalette(DEFAULT_COLOR_INTENSITY));
  assert.deepEqual(getColorPalette('100'), getColorPalette(DEFAULT_COLOR_INTENSITY));
  const palette = getColorPalette(50);
  for (const key of Object.keys(palette)) assert.doesNotMatch(key, /brightness|glow|text|foreground|muted/);
  assert.equal(Object.hasOwn(palette, '--clock-fg'), false);
  palette['--red'] = 'changed';
  assert.notEqual(getColorPalette(50)['--red'], 'changed');
});
