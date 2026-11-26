import { normalizeSettings, validateSettings, type Settings } from './schedule.ts';

export const SETTINGS_KEY = 'little-light.settings.v1';

export function decodeSettings(raw: string | null): { settings: Settings; warning: string | null } {
  if (raw === null) return { settings: normalizeSettings(null), warning: null };

  try {
    const value: unknown = JSON.parse(raw);
    if (validateSettings(value).valid) return { settings: normalizeSettings(value), warning: null };
  } catch {
    // A damaged saved routine resets as one unit, just like an invalid version.
  }
  return {
    settings: normalizeSettings(null),
    warning: 'Your saved routine could not be read. Starting with the default times.',
  };
}
