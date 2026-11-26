import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS, getScheduleState } from '../src/domain/schedule.ts';
import { clockState, countdownText, deadlineReached, nextPreview, soundDeadline, startNap, startOverride } from '../src/domain/session.ts';

const at = (hour, minute = 0, second = 0) => new Date(2026, 5, 9, hour, minute, second);
const clock = (now, temporary = null, preview = null) => clockState(getScheduleState(DEFAULT_SETTINGS, now), temporary, preview, now);

test('temporary color ends at the exact next routine transition', () => {
  const override = startOverride('quiet', getScheduleState(DEFAULT_SETTINGS, at(18)));
  assert.equal(override.until, at(19, 30).getTime());
  assert.equal(clock(at(19, 29, 59), override).stage, 'quiet');
  assert.equal(clock(at(19, 30), override).stage, 'sleep');
  assert.equal(clock(at(19, 30), override).temporary, null);
});

test('nap crosses a scheduled transition and returns to the current phase at its deadline', () => {
  const nap = startNap(60, at(6, 15));
  const during = clock(at(7, 5), nap);
  assert.equal(during.stage, 'sleep');
  assert.equal(during.nextAt.getTime(), at(7, 15).getTime());
  assert.equal(clock(at(7, 15), nap).stage, 'rise');
  assert.equal(clock(at(12), nap).nextAt.getTime(), at(19, 30).getTime());
});

test('preview cycles through all three stages without mutating a nap', () => {
  const nap = startNap(90, at(12));
  assert.equal(nextPreview('sleep'), 'quiet');
  assert.equal(nextPreview('quiet'), 'rise');
  assert.equal(nextPreview('rise'), 'sleep');
  assert.equal(clock(at(12), nap, 'quiet').stage, 'quiet');
  assert.equal(clock(at(12), nap).stage, 'sleep');
});

test('sound deadline expires immediately when the app returns late, with a separate unlimited mode', () => {
  const endsAt = soundDeadline(30, at(13));
  assert.equal(deadlineReached(endsAt, at(13, 29, 59)), false);
  assert.equal(deadlineReached(endsAt, at(13, 30)), true);
  assert.equal(deadlineReached(endsAt, at(21)), true);
  assert.equal(deadlineReached(soundDeadline(0, at(13)), at(21)), false);
});

test('countdown rounds up to the next minute and includes hours', () => {
  assert.equal(countdownText(at(13, 15, 59), at(14, 30)), '1h 15m');
  assert.equal(countdownText(at(14, 29, 59), at(14, 30)), '1m');
});
