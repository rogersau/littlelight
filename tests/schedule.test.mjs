import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS, validateSettings, normalizeSettings, getScheduleState, formatTime } from '../src/domain/schedule.ts';

const originalTimezone = process.env.TZ;
process.env.TZ = 'UTC';
test.after(() => {
  if (originalTimezone === undefined) delete process.env.TZ;
  else process.env.TZ = originalTimezone;
});

const settings = (overrides = {}) => ({ ...structuredClone(DEFAULT_SETTINGS), ...overrides });
const at = (year, month, day, hour, minute = 0, second = 0) => new Date(year, month - 1, day, hour, minute, second);
const utcStamp = (date) => date.toISOString();

test('default settings are valid, frozen, and match the app contract', () => {
  assert.deepEqual(validateSettings(DEFAULT_SETTINGS), { valid: true, errors: [] });
  assert.equal(DEFAULT_SETTINGS.version, 1);
  assert.equal(DEFAULT_SETTINGS.sound, 'pink');
  assert.equal(DEFAULT_SETTINGS.volume, 12);
  assert.ok(Object.isFrozen(DEFAULT_SETTINGS));
  assert.ok(Object.isFrozen(DEFAULT_SETTINGS.everyday));
});

test('evening bedtime starts sleep and persists across midnight', () => {
  const before = getScheduleState(DEFAULT_SETTINGS, at(2026, 10, 12, 19, 29, 59));
  assert.equal(before.stage, 'rise');
  assert.equal(before.nextStage, 'sleep');
  assert.equal(utcStamp(before.nextTransition), '2026-10-12T19:30:00.000Z');
  assert.equal(before.activeBedtime, null);

  const evening = getScheduleState(DEFAULT_SETTINGS, at(2026, 10, 12, 19, 30));
  const afterMidnight = getScheduleState(DEFAULT_SETTINGS, at(2026, 10, 13, 2));
  assert.equal(evening.stage, 'sleep');
  assert.equal(evening.nextStage, 'quiet');
  assert.equal(utcStamp(evening.nextTransition), '2026-10-13T06:30:00.000Z');
  assert.equal(utcStamp(afterMidnight.activeBedtime), '2026-10-12T19:30:00.000Z');
  assert.equal(afterMidnight.transitionKey, evening.transitionKey);
});

test('exact quiet and rise times advance the stage immediately', () => {
  const beforeQuiet = getScheduleState(DEFAULT_SETTINGS, at(2026, 10, 13, 6, 29, 59));
  const quiet = getScheduleState(DEFAULT_SETTINGS, at(2026, 10, 13, 6, 30));
  const rise = getScheduleState(DEFAULT_SETTINGS, at(2026, 10, 13, 7));
  const noon = getScheduleState(DEFAULT_SETTINGS, at(2026, 10, 13, 12));
  assert.equal(beforeQuiet.stage, 'sleep');
  assert.equal(quiet.stage, 'quiet');
  assert.equal(quiet.nextStage, 'rise');
  assert.equal(utcStamp(quiet.nextTransition), '2026-10-13T07:00:00.000Z');
  assert.equal(rise.stage, 'rise');
  assert.equal(rise.nextStage, 'sleep');
  assert.equal(utcStamp(rise.nextTransition), '2026-10-13T19:30:00.000Z');
  assert.equal(rise.transitionKey, noon.transitionKey);
  assert.notEqual(quiet.transitionKey, beforeQuiet.transitionKey);
  assert.notEqual(rise.transitionKey, quiet.transitionKey);
});

test('weekend mode uses Friday/Saturday bedtime dates, not the current weekday', () => {
  const config = settings({ scheduleMode: 'weekend' });
  // Friday morning is still Thursday night's everyday schedule.
  const fridayMorning = getScheduleState(config, at(2026, 10, 16, 6, 45));
  assert.equal(fridayMorning.stage, 'quiet');
  assert.equal(fridayMorning.nightSchedule.bedtime, '19:30');
  assert.equal(utcStamp(fridayMorning.nextTransition), '2026-10-16T07:00:00.000Z');
  const fridayEvening = getScheduleState(config, at(2026, 10, 16, 19, 45));
  assert.equal(fridayEvening.stage, 'rise');
  assert.equal(utcStamp(fridayEvening.nextTransition), '2026-10-16T20:00:00.000Z');
  for (const day of [17, 18]) {
    const morning = getScheduleState(config, at(2026, 10, day, 6, 45));
    assert.equal(morning.stage, 'sleep');
    assert.equal(morning.nightSchedule.rise, '07:30');
    assert.equal(utcStamp(morning.nextTransition), `2026-10-${day}T07:00:00.000Z`);
  }
  const sundayEvening = getScheduleState(config, at(2026, 10, 18, 19, 30));
  assert.equal(sundayEvening.stage, 'sleep');
  assert.equal(sundayEvening.nightSchedule.bedtime, '19:30');
  assert.equal(utcStamp(sundayEvening.nextTransition), '2026-10-19T06:30:00.000Z');
});

test('everyday mode ignores the weekend template on weekend nights', () => {
  const state = getScheduleState(DEFAULT_SETTINGS, at(2026, 10, 17, 7, 15));
  assert.equal(state.stage, 'rise');
  assert.equal(state.nightSchedule.bedtime, '19:30');
});

test('routine labels follow the bedtime date even when both sets of times are identical', () => {
  const config = settings({ scheduleMode: 'weekend', weekend: { ...DEFAULT_SETTINGS.everyday } });
  assert.equal(getScheduleState(config, at(2026, 10, 16, 5)).nightLabel, 'weeknight');
  assert.equal(getScheduleState(config, at(2026, 10, 16, 12)).nightLabel, 'weekend');
  assert.equal(getScheduleState(config, at(2026, 10, 17, 5)).nightLabel, 'weekend');
  assert.equal(getScheduleState(config, at(2026, 10, 18, 12)).nightLabel, 'weeknight');
});

test('dormant weekend sequencing does not block everyday settings after yellow is enabled', () => {
  const saved = settings({
    scheduleMode: 'weekend',
    yellowEnabled: false,
    weekend: { bedtime: '20:00', quiet: '12:00', rise: '07:30' },
  });
  assert.equal(validateSettings(saved).valid, true);
  const everyday = { ...saved, scheduleMode: 'everyday', yellowEnabled: true };
  assert.deepEqual(validateSettings(everyday), { valid: true, errors: [] });
  assert.deepEqual(normalizeSettings(everyday), everyday);
  assert.equal(getScheduleState(everyday, at(2026, 10, 17, 6, 45)).stage, 'quiet');
  assert.equal(validateSettings({ ...everyday, scheduleMode: 'weekend' }).valid, false);
});

test('dormant weekend requires valid structure and times but not logical sequencing', () => {
  for (const weekend of [
    { bedtime: '20:00', quiet: '20:00', rise: '20:00' },
    { bedtime: '20:00', quiet: '18:00', rise: '15:00' },
  ]) {
    assert.equal(validateSettings(settings({ weekend })).valid, true);
    assert.equal(validateSettings(settings({ weekend, scheduleMode: 'weekend' })).valid, false);
  }
  for (const weekend of [null, {}, { bedtime: '20:00', quiet: '25:00', rise: '07:30' }]) {
    assert.equal(validateSettings(settings({ weekend })).valid, false);
  }
});

test('yellow off skips quiet and permits an inactive quiet time outside the night', () => {
  const config = settings({ yellowEnabled: false, everyday: { bedtime: '19:30', quiet: '12:00', rise: '07:00' } });
  assert.equal(validateSettings(config).valid, true);
  const state = getScheduleState(config, at(2026, 10, 13, 6, 45));
  assert.equal(state.stage, 'sleep');
  assert.equal(state.nextStage, 'rise');
  assert.equal(utcStamp(state.nextTransition), '2026-10-13T07:00:00.000Z');
  assert.equal(getScheduleState(config, at(2026, 10, 13, 7)).stage, 'rise');
});

test('same-date night and a quiet period before midnight use local calendar dates', () => {
  const morningConfig = settings({ everyday: { bedtime: '01:00', quiet: '07:00', rise: '08:00' } });
  const morning = getScheduleState(morningConfig, at(2026, 10, 12, 4));
  assert.equal(morning.stage, 'sleep');
  assert.equal(utcStamp(morning.activeBedtime), '2026-10-12T01:00:00.000Z');
  assert.equal(utcStamp(morning.nextTransition), '2026-10-12T07:00:00.000Z');
  const eveningConfig = settings({ everyday: { bedtime: '17:00', quiet: '23:00', rise: '05:00' } });
  const evening = getScheduleState(eveningConfig, at(2026, 10, 12, 23, 30));
  assert.equal(evening.stage, 'quiet');
  assert.equal(utcStamp(evening.nextTransition), '2026-10-13T05:00:00.000Z');
});

test('leap day, month end, and year end roll over correctly', () => {
  for (const [input, expected] of [
    [at(2028, 2, 28, 23), '2028-02-29T06:30:00.000Z'],
    [at(2028, 2, 29, 23), '2028-03-01T06:30:00.000Z'],
    [at(2026, 12, 31, 23), '2027-01-01T06:30:00.000Z'],
  ]) {
    assert.equal(utcStamp(getScheduleState(DEFAULT_SETTINGS, input).nextTransition), expected);
  }
});

test('corrupt storage candidates reset completely and do not share mutable defaults', () => {
  const corrupt = [null, undefined, false, 'saved', [], {}, { version: 1 }, settings({ version: 2 }), settings({ brightness: NaN }), settings({ volume: Infinity }), settings({ sound: 'ocean' }), settings({ soundDuration: 45 })];
  for (const candidate of corrupt) {
    assert.equal(validateSettings(candidate).valid, false);
    assert.deepEqual(normalizeSettings(candidate), DEFAULT_SETTINGS);
  }
  const recovered = normalizeSettings(null);
  recovered.everyday.bedtime = '21:00';
  assert.equal(DEFAULT_SETTINGS.everyday.bedtime, '19:30');
  assert.equal(normalizeSettings(null).everyday.bedtime, '19:30');
});

test('valid settings are cloned and unrecognized keys are dropped', () => {
  const candidate = settings({ brightness: 35, obsolete: 'ignore', everyday: { bedtime: '20:15', quiet: '06:45', rise: '07:15', extra: 'ignore' } });
  const normalized = normalizeSettings(candidate);
  assert.equal(normalized.brightness, 35);
  assert.equal(normalized.everyday.bedtime, '20:15');
  assert.ok(!('obsolete' in normalized));
  assert.ok(!('extra' in normalized.everyday));
  normalized.everyday.rise = '08:00';
  assert.equal(candidate.everyday.rise, '07:15');
});

test('strict HH:MM validation rejects invalid times and nonboolean flags', () => {
  for (const time of ['7:00', '24:00', '12:60', '07:0', '07:00:00', '', null, 700, ' 07:00', '07:00\n']) {
    const candidate = settings({ everyday: { ...DEFAULT_SETTINGS.everyday, rise: time } });
    assert.equal(validateSettings(candidate).valid, false, `should reject ${JSON.stringify(time)}`);
  }
  for (const key of ['yellowEnabled', 'showClock', 'showCountdown', 'keepAwake']) {
    assert.equal(validateSettings(settings({ [key]: 'false' })).valid, false);
  }
  for (const brightness of [9, 101, '60']) assert.equal(validateSettings(settings({ brightness })).valid, false);
  for (const volume of [-1, 51, '12']) assert.equal(validateSettings(settings({ volume })).valid, false);
  for (const soundDuration of [0, 15, 30, 60, 120]) assert.equal(validateSettings(settings({ soundDuration })).valid, true);
});

test('night is positive, at most 18 hours, with quiet strictly inside it', () => {
  for (const everyday of [
    { bedtime: '19:30', quiet: '06:30', rise: '19:30' },
    { bedtime: '19:30', quiet: '06:30', rise: '14:00' },
    { bedtime: '19:30', quiet: '19:30', rise: '07:00' },
    { bedtime: '19:30', quiet: '07:00', rise: '07:00' },
    { bedtime: '19:30', quiet: '08:00', rise: '07:00' },
  ]) assert.equal(validateSettings(settings({ everyday })).valid, false);
  assert.equal(validateSettings(settings({ everyday: { bedtime: '18:00', quiet: '11:00', rise: '12:00' } })).valid, true);
  assert.equal(validateSettings(settings({ everyday: { bedtime: '23:59', quiet: '00:00', rise: '00:01' } })).valid, true);
});

test('weekly handoffs preserve at least six daytime hours', () => {
  const candidate = settings({
    scheduleMode: 'weekend',
    everyday: { bedtime: '22:00', quiet: '15:00', rise: '16:00' },
    weekend: { bedtime: '18:00', quiet: '11:00', rise: '12:00' },
  });
  assert.equal(validateSettings(candidate).valid, false);
  assert.match(validateSettings(candidate).errors.join(' '), /between nights/);
  assert.equal(validateSettings({ ...candidate, scheduleMode: 'everyday' }).valid, true);
});

test('returned dates and schedule cannot mutate subsequent results', () => {
  const now = at(2026, 10, 12, 23);
  const first = getScheduleState(DEFAULT_SETTINGS, now);
  first.activeBedtime.setFullYear(1999);
  first.nextTransition.setFullYear(1999);
  first.nightSchedule.rise = '15:00';
  const second = getScheduleState(DEFAULT_SETTINGS, now);
  assert.equal(second.activeBedtime.getFullYear(), 2026);
  assert.equal(second.nextTransition.getFullYear(), 2026);
  assert.equal(second.nightSchedule.rise, '07:00');
  assert.equal(now.getFullYear(), 2026);
});

test('invalid date is rejected and invalid settings safely use defaults', () => {
  assert.throws(() => getScheduleState(DEFAULT_SETTINGS, new Date(NaN)), RangeError);
  assert.equal(getScheduleState({ version: 99 }, at(2026, 10, 12, 23)).stage, 'sleep');
});

test('formatTime formats valid times and rejects malformed input', () => {
  assert.equal(formatTime('19:30', 'en-US'), '7:30 PM');
  assert.equal(formatTime('07:00', 'en-GB'), '7:00');
  assert.equal(formatTime('25:00'), '');
});

test('US spring DST preserves local times and weekend bedtime anchoring', () => {
  process.env.TZ = 'America/New_York';
  try {
    const config = settings({ scheduleMode: 'weekend' });
    const state = getScheduleState(config, at(2026, 3, 8, 3, 30));
    assert.equal(state.stage, 'sleep');
    assert.equal(utcStamp(state.activeBedtime), '2026-03-08T01:00:00.000Z');
    assert.equal(utcStamp(state.nextTransition), '2026-03-08T11:00:00.000Z');
    assert.equal(state.nextTransition.getHours(), 7);
    assert.equal(state.nextTransition.getDate(), 8);
    const daytime = getScheduleState(config, at(2026, 3, 8, 12));
    assert.equal(daytime.nextTransition.getHours(), 19);
    assert.equal(daytime.nextTransition.getMinutes(), 30);
    assert.equal(daytime.nextTransition.getDate(), 8);
  } finally {
    process.env.TZ = 'UTC';
  }
});

test('US spring nonexistent quiet time shifts forward, or is skipped on collision', () => {
  process.env.TZ = 'America/New_York';
  try {
    const shiftedConfig = settings({ everyday: { bedtime: '20:00', quiet: '02:30', rise: '04:00' } });
    const shifted = getScheduleState(shiftedConfig, at(2026, 3, 8, 3, 10));
    assert.equal(shifted.stage, 'sleep');
    assert.equal(shifted.nextTransition.getHours(), 3);
    assert.equal(shifted.nextTransition.getMinutes(), 30);
    assert.equal(getScheduleState(shiftedConfig, at(2026, 3, 8, 3, 30)).stage, 'quiet');

    for (const rise of ['03:15', '03:30']) {
      const collisionConfig = settings({ everyday: { bedtime: '20:00', quiet: '02:30', rise } });
      assert.equal(validateSettings(collisionConfig).valid, true);
      const state = getScheduleState(collisionConfig, at(2026, 3, 8, 3));
      assert.equal(state.stage, 'sleep');
      assert.equal(state.nextStage, 'rise');
      assert.equal(getScheduleState(collisionConfig, at(2026, 3, 8, 3, Number(rise.slice(3)))).stage, 'rise');
    }
  } finally {
    process.env.TZ = 'UTC';
  }
});

test('US spring DST-consumed short night cannot start after its wake-up', () => {
  process.env.TZ = 'America/New_York';
  try {
    const config = settings({ yellowEnabled: false, everyday: { bedtime: '02:30', quiet: '02:45', rise: '03:15' } });
    assert.equal(validateSettings(config).valid, true);
    const state = getScheduleState(config, at(2026, 3, 8, 3, 40));
    assert.equal(state.stage, 'rise');
    assert.equal(state.nextTransition.getDate(), 9);
    assert.equal(state.nextTransition.getHours(), 2);
    assert.equal(state.nextTransition.getMinutes(), 30);
  } finally {
    process.env.TZ = 'UTC';
  }
});

test('US fall repeated quiet time chooses first occurrence and never reverts', () => {
  process.env.TZ = 'America/New_York';
  try {
    const config = settings({ everyday: { bedtime: '20:00', quiet: '01:30', rise: '03:00' } });
    const before = getScheduleState(config, new Date('2026-11-01T05:29:59Z'));
    const first = getScheduleState(config, new Date('2026-11-01T05:30:00Z'));
    const second = getScheduleState(config, new Date('2026-11-01T06:10:00Z'));
    assert.equal(before.stage, 'sleep');
    assert.equal(utcStamp(before.nextTransition), '2026-11-01T05:30:00.000Z');
    assert.equal(first.stage, 'quiet');
    assert.equal(second.stage, 'quiet');
    assert.equal(first.transitionKey, second.transitionKey);
    assert.equal(utcStamp(first.nextTransition), '2026-11-01T08:00:00.000Z');
    assert.equal(getScheduleState(config, new Date('2026-11-01T08:00:00Z')).stage, 'rise');
  } finally {
    process.env.TZ = 'UTC';
  }
});

test('US fall repeated bedtime chooses earliest occurrence and occurs once', () => {
  process.env.TZ = 'America/New_York';
  try {
    const config = settings({ everyday: { bedtime: '01:30', quiet: '06:30', rise: '07:00' } });
    const first = getScheduleState(config, new Date('2026-11-01T05:30:00Z'));
    const repeated = getScheduleState(config, new Date('2026-11-01T06:15:00Z'));
    assert.equal(first.stage, 'sleep');
    assert.equal(repeated.stage, 'sleep');
    assert.equal(utcStamp(first.activeBedtime), '2026-11-01T05:30:00.000Z');
    assert.equal(first.transitionKey, repeated.transitionKey);
  } finally {
    process.env.TZ = 'UTC';
  }
});

test('DST tests restore UTC for later consumers', () => {
  assert.equal(process.env.TZ, 'UTC');
  assert.equal(at(2026, 10, 12, 12).getTimezoneOffset(), 0);
});
