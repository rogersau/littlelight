import { DEFAULT_COLOR_INTENSITY, LEGACY_COLOR_INTENSITY } from './colors.ts';

export type Stage = 'sleep' | 'quiet' | 'rise';
export type Noise = 'white' | 'pink' | 'brown';
export type SoundDuration = 0 | 15 | 30 | 60 | 120;
export type Routine = { bedtime: string; quiet: string; rise: string };

export type Settings = {
  version: 1;
  scheduleMode: 'everyday' | 'weekend';
  everyday: Routine;
  weekend: Routine;
  yellowEnabled: boolean;
  brightness: number;
  colorIntensity: number;
  showClock: boolean;
  showCountdown: boolean;
  sound: Noise;
  volume: number;
  soundDuration: SoundDuration;
  keepAwake: boolean;
};

type SavedSettings = Omit<Settings, 'colorIntensity'> & { colorIntensity?: number };
type Routines = Pick<Settings, 'scheduleMode' | 'everyday' | 'weekend'>;
type NightLabel = 'every day' | 'weeknight' | 'weekend';
type Night = { bed: Date; quiet: Date | null; rise: Date; schedule: Routine; label: NightLabel };
export type ScheduleState = {
  stage: Stage;
  nextTransition: Date;
  nextStage: Stage;
  activeBedtime: Date | null;
  nightSchedule: Routine;
  nightLabel: NightLabel;
  transitionKey: string;
};

/**
 * The clock's settings and local-calendar scheduler. No storage or browser APIs
 * are used here, so these rules can also be tested outside the app.
 */
export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  version: 1,
  scheduleMode: 'everyday',
  everyday: Object.freeze({ bedtime: '19:30', quiet: '06:30', rise: '07:00' }),
  weekend: Object.freeze({ bedtime: '20:00', quiet: '07:00', rise: '07:30' }),
  yellowEnabled: true,
  brightness: 60,
  colorIntensity: DEFAULT_COLOR_INTENSITY,
  showClock: true,
  showCountdown: false,
  sound: 'pink',
  volume: 12,
  soundDuration: 60,
  keepAwake: true,
});

const MINUTES_PER_DAY = 24 * 60;
const MAX_NIGHT_MINUTES = 18 * 60;
const MIN_DAY_MINUTES = 6 * 60;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const BOOLEAN_FIELDS = ['yellowEnabled', 'showClock', 'showCountdown', 'keepAwake'] as const;
const SCHEDULE_FIELDS = ['bedtime', 'quiet', 'rise'] as const;
export const NOISES = ['white', 'pink', 'brown'] as const;
export const SOUND_DURATIONS = [15, 30, 60, 120, 0] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isTime(value: unknown): value is string {
  return typeof value === 'string' && TIME_PATTERN.test(value);
}

function inRange(value: unknown, low: number, high: number): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= low && value <= high;
}

function minutes(time: string): number {
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
}

function forwardMinutes(from: number, to: number): number {
  return (to - from + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

function labelForDay(mode: Settings['scheduleMode'], weekday: number): NightLabel {
  return mode === 'everyday' ? 'every day' : weekday === 5 || weekday === 6 ? 'weekend' : 'weeknight';
}

function scheduleForDay(settings: Routines, weekday: number): Routine {
  // The chosen schedule belongs to the bedtime date. Friday and Saturday
  // bedtimes lead into Saturday and Sunday mornings, respectively.
  return labelForDay(settings.scheduleMode, weekday) === 'weekend' ? settings.weekend : settings.everyday;
}

function validateSchedule(schedule: unknown, name: string, yellowEnabled: boolean, errors: string[], active = true): schedule is Routine {
  if (!isRecord(schedule)) {
    errors.push(`${name} schedule is missing or invalid.`);
    return false;
  }

  const { bedtime, quiet, rise } = schedule;
  if (!isTime(bedtime) || !isTime(quiet) || !isTime(rise)) {
    for (const field of SCHEDULE_FIELDS) {
      if (!isTime(schedule[field])) errors.push(`${name} ${field} must be a time in HH:MM format.`);
    }
    return false;
  }
  // Dormant weekend fields remain structurally safe to save, but must not
  // block everyday-mode edits with a sequencing error the user cannot see.
  if (!active) return true;

  const bed = minutes(bedtime);
  const nightLength = forwardMinutes(bed, minutes(rise));
  if (nightLength === 0 || nightLength > MAX_NIGHT_MINUTES) {
    errors.push(`${name} wake-up must be after bedtime, within 18 hours, leaving at least 6 daytime hours.`);
  }
  if (yellowEnabled) {
    const quietOffset = forwardMinutes(bed, minutes(quiet));
    if (quietOffset === 0 || quietOffset >= nightLength) {
      errors.push(`${name} quiet time must fall strictly between bedtime and wake-up.`);
    }
  }
  return true;
}

/** Validate a complete settings candidate without changing it. */
export function validateSettings(value: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { valid: false, errors: ['Settings must be an object.'] };
  }
  if (value.version !== 1) errors.push('Settings version is not supported.');
  if (value.scheduleMode !== 'everyday' && value.scheduleMode !== 'weekend') {
    errors.push('Choose an everyday or weekend schedule.');
  }
  for (const field of BOOLEAN_FIELDS) {
    if (typeof value[field] !== 'boolean') errors.push(`${field} must be true or false.`);
  }
  if (!inRange(value.brightness, 10, 100)) {
    errors.push('Brightness must be between 10 and 100.');
  }
  // Version 1 saves created before this control have no colorIntensity field.
  // Accept that legacy shape, preserving its gentle palette during migration.
  if (Object.prototype.hasOwnProperty.call(value, 'colorIntensity') && !inRange(value.colorIntensity, 0, 100)) {
    errors.push('Color intensity must be between 0 and 100.');
  }
  if (!inRange(value.volume, 0, 50)) {
    errors.push('Volume must be between 0 and 50.');
  }
  if (!NOISES.some(noise => noise === value.sound)) {
    errors.push('Choose white, pink, or brown noise.');
  }
  if (!SOUND_DURATIONS.some(duration => duration === value.soundDuration)) {
    errors.push('Sound duration must be continuous, 15, 30, 60, or 120 minutes.');
  }

  const { everyday, weekend, scheduleMode, yellowEnabled } = value;
  const everydayTimesValid = validateSchedule(everyday, 'Everyday', yellowEnabled === true, errors);
  const weekendTimesValid = validateSchedule(weekend, 'Weekend', yellowEnabled === true, errors, scheduleMode === 'weekend');

  if (scheduleMode === 'weekend' && everydayTimesValid && weekendTimesValid) {
    const routines = { scheduleMode, everyday, weekend } satisfies Routines;
    // Check handoffs as well as each schedule in isolation. For example, an
    // early Friday bedtime must still leave six hours after Friday's wake-up.
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const current = scheduleForDay(routines, weekday);
      const next = scheduleForDay(routines, (weekday + 1) % 7);
      const bedtime = minutes(current.bedtime);
      const riseOffset = forwardMinutes(bedtime, minutes(current.rise));
      const gap = MINUTES_PER_DAY + minutes(next.bedtime) - bedtime - riseOffset;
      if (gap < MIN_DAY_MINUTES) {
        errors.push('Weekday and weekend schedules must leave at least 6 daytime hours between nights.');
        break;
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Recover a saved settings object. Corrupt, incomplete, or newer-version data
 * resets as one unit, while unknown keys on an otherwise valid object are
 * discarded. Returned objects never share mutable state with the defaults.
 */
function isValidSettings(value: unknown): value is SavedSettings {
  return validateSettings(value).valid;
}

function copyRoutine({ bedtime, quiet, rise }: Routine): Routine {
  return { bedtime, quiet, rise };
}

export function normalizeSettings(value: unknown): Settings {
  const saved = isValidSettings(value) ? value : DEFAULT_SETTINGS;
  return {
    version: 1,
    scheduleMode: saved.scheduleMode,
    everyday: copyRoutine(saved.everyday),
    weekend: copyRoutine(saved.weekend),
    yellowEnabled: saved.yellowEnabled,
    brightness: saved.brightness,
    colorIntensity: saved.colorIntensity ?? LEGACY_COLOR_INTENSITY,
    showClock: saved.showClock,
    showCountdown: saved.showCountdown,
    sound: saved.sound,
    volume: saved.volume,
    soundDuration: saved.soundDuration,
    keepAwake: saved.keepAwake,
  };
}

function localEvent(anchor: Date, time: string, dayOffset = 0): Date {
  const totalMinutes = minutes(time);
  // Construct wall-clock times from local calendar fields. Never add 24 hours:
  // a local day may contain 23 or 25 hours at a daylight-saving transition.
  // Date follows the JS convention: skipped times move forward by the
  // DST gap, and repeated times select their first occurrence.
  return new Date(
    anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + dayOffset,
    Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0,
  );
}

function buildNight(settings: Settings, anchor: Date): Night | null {
  const schedule = scheduleForDay(settings, anchor.getDay());
  const bedtimeMinutes = minutes(schedule.bedtime);
  const nightLength = forwardMinutes(bedtimeMinutes, minutes(schedule.rise));
  const bed = localEvent(anchor, schedule.bedtime);
  const rise = localEvent(anchor, schedule.rise, Math.floor((bedtimeMinutes + nightLength) / MINUTES_PER_DAY));

  // A DST jump can consume a very short configured night. Do not emit a
  // bedtime after its wake-up, which would otherwise leave the clock red.
  if (rise <= bed) return null;

  let quiet = null;
  if (settings.yellowEnabled) {
    const quietOffset = forwardMinutes(bedtimeMinutes, minutes(schedule.quiet));
    const candidate = localEvent(anchor, schedule.quiet, Math.floor((bedtimeMinutes + quietOffset) / MINUTES_PER_DAY));
    // A skipped hour may move quiet time onto or beyond wake-up; a repeated
    // hour may alter ordering too. Keep only an actual intermediate event.
    if (candidate > bed && candidate < rise) quiet = candidate;
  }
  return { bed, quiet, rise, schedule, label: labelForDay(settings.scheduleMode, anchor.getDay()) };
}

/**
 * Return the current color stage and its next automatic transition. During
 * daytime, nightSchedule describes the next night and activeBedtime is null.
 * transitionKey is stable until the current stage's actual start changes.
 */
export function getScheduleState(settings: unknown, date = new Date()): ScheduleState {
  const now = new Date(date.getTime());
  if (Number.isNaN(now.getTime())) throw new RangeError('A valid date is required.');
  const safeSettings = normalizeSettings(settings);
  const nights: Night[] = [];
  for (let offset = -8; offset <= 8; offset += 1) {
    const anchor = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 12, 0, 0, 0);
    const night = buildNight(safeSettings, anchor);
    if (night) nights.push(night);
  }
  nights.sort((a, b) => a.bed.getTime() - b.bed.getTime());

  const active = nights.find((night) => now >= night.bed && now < night.rise);
  if (active) {
    const quietStart = active.quiet && now >= active.quiet ? active.quiet : null;
    const stage = quietStart ? 'quiet' : 'sleep';
    const nextQuiet = quietStart ? null : active.quiet;
    return {
      stage,
      nextTransition: new Date((nextQuiet ?? active.rise).getTime()),
      nextStage: nextQuiet ? 'quiet' : 'rise',
      activeBedtime: new Date(active.bed.getTime()),
      nightSchedule: { ...active.schedule },
      nightLabel: active.label,
      transitionKey: `${stage}:${(quietStart ?? active.bed).getTime()}`,
    };
  }

  const nextNight = nights.find((night) => night.bed > now);
  const previousNight = nights.filter((night) => night.rise <= now).sort((a, b) => b.rise.getTime() - a.rise.getTime())[0];
  // The 17-day window always includes a prior and next normal nightly event
  // for supported schedules, even when one night is consumed by a DST gap.
  if (!nextNight || !previousNight) throw new RangeError('Date is outside the supported calendar range.');
  return {
    stage: 'rise',
    nextTransition: new Date(nextNight.bed.getTime()),
    nextStage: 'sleep',
    activeBedtime: null,
    nightSchedule: { ...nextNight.schedule },
    nightLabel: nextNight.label,
    transitionKey: `rise:${previousNight.rise.getTime()}`,
  };
}

/** Render a 24-hour setting as a locale-appropriate wall-clock time. */
export function formatTime(time: unknown, locale = 'en-US'): string {
  if (!isTime(time)) return '';
  const totalMinutes = minutes(time);
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(
    new Date(2000, 0, 1, Math.floor(totalMinutes / 60), totalMinutes % 60),
  );
}
