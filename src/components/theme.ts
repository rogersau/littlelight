import { Platform } from 'react-native';
import type { Palette } from '../domain/colors.ts';
import type { Stage } from '../domain/schedule.ts';

export const theme = {
  canvas: '#141218',
  surface: '#1e1b24',
  surfaceElevated: '#272330',
  surfacePressed: '#322d3d',
  ink: '#f7efe6',
  muted: '#b4a99e',
  subtle: '#867c74',
  line: '#332e3d',
  accent: '#f0c47a',
  accentInk: '#1b1610',
  accentSoft: '#2e261d',
  danger: '#e57368',
  dangerBg: '#361f22',
  dangerBorder: '#5e3136',
  serif: Platform.OS === 'ios' ? 'Georgia' : 'serif',
};

export const STAGE_COPY = {
  sleep: { label: 'RED · SLEEP', short: 'Sleep', toddlerCue: 'Stay in bed', title: 'Time to sleep', description: 'Snuggle up and rest.', next: 'Sleep time' },
  quiet: { label: 'YELLOW · QUIET', short: 'Quiet time', toddlerCue: 'Play quietly', title: 'Quiet time', description: 'You can play quietly in your room.', next: 'Quiet time' },
  rise: { label: 'GREEN · GET UP', short: 'Wake up', toddlerCue: 'Okay to get up', title: 'Time to get up!', description: 'Good morning! You can come out now.', next: 'Time to get up' },
} as const satisfies Record<Stage, { label: string; short: string; toddlerCue: string; title: string; description: string; next: string }>;

export const CUES = {
  sleep: { color: 'Red', title: 'Sleep', swatch: '--red', chip: '#321c1f' },
  quiet: { color: 'Yellow', title: 'Stay cozy', swatch: '--yellow', chip: '#332b18' },
  rise: { color: 'Green', title: 'Get up', swatch: '--green', chip: '#1b2e22' },
} as const satisfies Record<Stage, { color: string; title: string; swatch: keyof Palette; chip: string }>;
