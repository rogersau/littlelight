import { Platform } from 'react-native';
import type { Palette } from '../domain/colors.ts';
import type { Stage } from '../domain/schedule.ts';

export const theme = {
  paper: '#f4f0e8', surface: '#fcfaf5', ink: '#3e4039', muted: '#66685d',
  sage: '#526454', softSage: '#e7ebe0', line: '#deddd2', gold: '#927547',
  serif: Platform.OS === 'ios' ? 'Georgia' : 'serif',
};

export const STAGE_COPY = {
  sleep: { label: 'RED MOON', title: 'Time to sleep', description: 'Snuggle up in bed.', next: 'Sleep time' },
  quiet: { label: 'YELLOW SUNRISE', title: 'Quiet time', description: 'You can play quietly in your room.', next: 'Quiet morning' },
  rise: { label: 'GREEN SUN', title: 'Time to get up', description: 'You can come out and say good morning.', next: 'Time to get up' },
} as const satisfies Record<Stage, { label: string; title: string; description: string; next: string }>;

export const CUES = {
  sleep: { color: 'Red', title: 'Sleep', swatch: '--red', chip: '#f0ded5' },
  quiet: { color: 'Yellow', title: 'Stay cozy', swatch: '--yellow', chip: '#f6edcf' },
  rise: { color: 'Green', title: 'Get up', swatch: '--green', chip: '#e6ecdc' },
} as const satisfies Record<Stage, { color: string; title: string; swatch: keyof Palette; chip: string }>;
