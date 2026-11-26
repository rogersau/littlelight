import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import type { Palette } from '../domain/colors.ts';
import type { ScheduleState, Stage } from '../domain/schedule.ts';
import type { NapMinutes } from '../domain/session.ts';
import { Action } from './Controls.tsx';
import { formatClockTime } from './ClockPanel.tsx';
import { Cue, Icon } from './Illustrations.tsx';
import { Lantern } from './Lantern.tsx';
import { CUES, STAGE_COPY, theme } from './theme.ts';

const ROUTINE_ROWS = [
  { stage: 'sleep', field: 'bedtime' },
  { stage: 'quiet', field: 'quiet' },
  { stage: 'rise', field: 'rise' },
] as const;
const QUICK_NAPS = [30, 60, 90] as const satisfies readonly NapMinutes[];

export function Home({ wide, clock, session, wake, start, startNap, settings, schedule, quiet, stage, palette, sound }: {
  wide: boolean; clock: ReactNode; session: boolean; wake: string; start: () => void; startNap: (minutes: NapMinutes) => void;
  settings: () => void; schedule: ScheduleState; quiet: boolean; stage: Stage; palette: Palette;
  sound: { enabled: boolean; status: string; toggle: () => void; resume?: () => void };
}) {
  return (
    <ScrollView contentContainerStyle={[styles.content, wide && styles.wideContent]}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <Lantern stage="quiet" palette={palette} size={48} animated={false} />
          <Text style={styles.wordmark} accessibilityRole="header">little light<Text style={styles.gold}>.</Text></Text>
        </View>
        <Action label="Settings" icon="sliders" onPress={settings} style={styles.settings} />
      </View>

      <View style={[styles.dashboard, wide && styles.wideDashboard]}>
        <View style={[styles.hero, wide && styles.wideHero]}>{clock}</View>
        <View style={[styles.sidebar, wide && styles.wideSidebar]}>
          <View style={[styles.panel, styles.startPanel]}>
            <View style={styles.eyebrowRow}>
              <Icon name="moon" color={theme.accent} size={15} />
              <Text style={styles.eyebrow}>BEDSIDE MODE</Text>
            </View>
            <Action variant="primary" icon="play" label={session ? 'Return to clock' : 'Start bedtime clock'} onPress={start} />
            <Text style={styles.note}>{session ? wake : 'Keep this screen open on the bedside table.'}</Text>
            <View style={styles.naps}>
              <View style={styles.eyebrowRow}>
                <Icon name="clock" color={theme.muted} size={15} />
                <Text style={styles.napLabel}>Quick nap</Text>
              </View>
              <View style={styles.napOptions}>
                {QUICK_NAPS.map(minutes => <Action key={minutes} label={`${minutes}m nap`} onPress={() => startNap(minutes)} style={styles.napButton} />)}
              </View>
            </View>
          </View>

          <View style={styles.panel}>
            <View style={styles.between}>
              <Text style={styles.panelTitle} accessibilityRole="header">Tonight’s routine</Text>
              <Text style={styles.scheduleLabel}>{schedule.nightLabel === 'weekend' ? 'WEEKEND' : 'EVERYDAY'}</Text>
              <Action variant="text" label="Edit" onPress={settings} style={styles.edit} />
            </View>
            <View style={styles.timeline}>
              <View aria-hidden style={styles.timelineLine} />
              {ROUTINE_ROWS.filter(row => row.stage !== 'quiet' || quiet).map(row => {
                const [hour, minute] = schedule.nightSchedule[row.field].split(':').map(Number);
                const timeLabel = formatClockTime(new Date(2000, 0, 15, hour, minute));
                const selected = row.stage === stage;
                const copy = STAGE_COPY[row.stage];
                const tint = palette[`--${row.stage}-accent`];
                return (
                  <View key={row.stage} accessible accessibilityLabel={`${copy.short}, ${copy.toddlerCue}, ${timeLabel}${selected ? ', current stage' : ''}`}
                    style={[styles.routine, selected && { backgroundColor: tint + '0e' }]}>
                    <View style={[styles.cue, { backgroundColor: CUES[row.stage].chip, borderColor: tint + (selected ? 'aa' : '45') },
                      selected && { boxShadow: `0 0 11px ${tint}36` }]}>
                      <Cue stage={row.stage} palette={palette} size={28} />
                    </View>
                    <View style={styles.routineText}>
                      <Text style={styles.routineLabel}>{copy.short}</Text>
                      <Text style={styles.toddlerCue}>{copy.toddlerCue}</Text>
                    </View>
                    <View style={styles.routineEnd}>
                      <Text style={styles.routineTime}>{timeLabel}</Text>
                      {selected && <Text style={[styles.now, { color: tint, backgroundColor: tint + '24' }]}>NOW</Text>}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.panel}>
            <View style={styles.soundRow}>
              <View style={styles.soundIcon}><Icon name="sound" color={theme.accent} size={20} /></View>
              <View style={styles.soundCopy}>
                <Text style={styles.panelTitle} accessibilityRole="header">Sleep sounds</Text>
                <Text style={styles.note} accessibilityLiveRegion="polite">{sound.status}</Text>
              </View>
              <Switch accessibilityLabel="Sleep sounds" value={sound.enabled} onValueChange={sound.toggle}
                trackColor={{ true: theme.accent, false: theme.line }} ios_backgroundColor={theme.line} />
            </View>
            {sound.resume && <Action label="Resume sound" icon="play" onPress={sound.resume} />}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: 15, paddingBottom: 24, gap: 15 },
  wideContent: { paddingHorizontal: 26, paddingBottom: 32, gap: 20 },
  header: { minHeight: 68, paddingVertical: 9, borderBottomWidth: 1, borderColor: theme.line, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  wordmark: { color: theme.ink, fontFamily: theme.serif, fontSize: 29, letterSpacing: -.85, flexShrink: 1 },
  gold: { color: theme.accent },
  settings: { borderRadius: 24 },
  dashboard: { gap: 16 },
  wideDashboard: { flexDirection: 'row', alignItems: 'flex-start', gap: 18 },
  hero: { minWidth: 0 },
  wideHero: { flex: 1.36 },
  sidebar: { gap: 12, minWidth: 0 },
  wideSidebar: { flex: 1, gap: 14 },
  panel: { backgroundColor: theme.surface, borderColor: theme.line, borderWidth: 1, borderRadius: 22, padding: 15, gap: 8 },
  startPanel: { backgroundColor: '#211c24', borderColor: '#43344a', gap: 9 },
  eyebrowRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  eyebrow: { color: theme.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  naps: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.line, marginTop: 3, paddingTop: 9, gap: 7 },
  napLabel: { color: theme.muted, fontSize: 13, fontWeight: '600' },
  napOptions: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  napButton: { borderRadius: 24, flexGrow: 1, paddingHorizontal: 9 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', columnGap: 6 },
  panelTitle: { color: theme.ink, fontWeight: '700', fontSize: 16, flexShrink: 1 },
  scheduleLabel: { marginRight: 'auto', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4,
    color: theme.accent, backgroundColor: theme.accentSoft, fontSize: 9, fontWeight: '800', letterSpacing: .7 },
  edit: { paddingHorizontal: 6, marginRight: -4 },
  timeline: { gap: 2 },
  timelineLine: { position: 'absolute', top: 29, bottom: 29, left: 26, width: 1, backgroundColor: '#5e4e63' },
  routine: { minHeight: 57, borderRadius: 13, paddingVertical: 5, paddingHorizontal: 7,
    alignItems: 'center', flexDirection: 'row', columnGap: 9 },
  cue: { width: 39, height: 39, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  routineText: { flex: 1, gap: 2 },
  routineEnd: { gap: 4, alignItems: 'flex-end', flexShrink: 1 },
  routineLabel: { color: theme.ink, fontSize: 14, fontWeight: '700' },
  toddlerCue: { color: theme.muted, fontSize: 12 },
  routineTime: { color: theme.ink, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'], textAlign: 'right' },
  now: { fontSize: 9, fontWeight: '800', letterSpacing: .8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  soundRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  soundIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: theme.accentSoft, alignItems: 'center', justifyContent: 'center' },
  soundCopy: { flex: 1, gap: 2 },
  note: { color: theme.muted, fontSize: 12, lineHeight: 18 },
});
