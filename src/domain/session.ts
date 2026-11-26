import type { ScheduleState, SoundDuration, Stage } from './schedule.ts';

export const STAGES = ['sleep', 'quiet', 'rise'] as const satisfies readonly Stage[];
export const NAP_MINUTES = [30, 45, 60, 90, 120] as const;
export type NapMinutes = typeof NAP_MINUTES[number];

export type TemporaryColor = { kind: 'override' | 'nap'; stage: Stage; until: number };

export function startNap(minutes: NapMinutes, now: Date): TemporaryColor {
  return { kind: 'nap', stage: 'sleep', until: now.getTime() + minutes * 60_000 };
}

export function startOverride(stage: Stage, schedule: ScheduleState): TemporaryColor {
  return { kind: 'override', stage, until: schedule.nextTransition.getTime() };
}

export function deadlineReached(deadline: number | null, now: Date): boolean {
  return deadline !== null && now.getTime() >= deadline;
}

export function soundDeadline(minutes: SoundDuration, now: Date): number | null {
  return minutes === 0 ? null : now.getTime() + minutes * 60_000;
}

export function clockState(schedule: ScheduleState, temporary: TemporaryColor | null, preview: Stage | null, now: Date) {
  const active = temporary && !deadlineReached(temporary.until, now) ? temporary : null;
  return {
    stage: preview ?? active?.stage ?? schedule.stage,
    temporary: active,
    nextAt: active ? new Date(active.until) : schedule.nextTransition,
  };
}

export function nextPreview(stage: Stage): Stage {
  return STAGES[(STAGES.indexOf(stage) + 1) % STAGES.length];
}

export function countdownText(now: Date, nextAt: Date): string {
  const minutes = Math.max(1, Math.ceil((nextAt.getTime() - now.getTime()) / 60_000));
  return `${minutes >= 60 ? `${Math.floor(minutes / 60)}h ` : ''}${minutes % 60}m`;
}
