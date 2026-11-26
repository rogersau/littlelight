import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import type { Palette } from '../domain/colors.ts';
import type { ScheduleState, Stage } from '../domain/schedule.ts';
import { Action } from './Controls.tsx';
import { formatClockTime } from './ClockPanel.tsx';
import { Cue, Icon } from './Illustrations.tsx';
import { CUES, theme } from './theme.ts';

const ROUTINE_ROWS = [
  { stage: 'sleep', field: 'bedtime', label: 'Bedtime' },
  { stage: 'quiet', field: 'quiet', label: 'Quiet time' },
  { stage: 'rise', field: 'rise', label: 'Wake-up' },
] as const;

export function Home({ wide, clock, session, wake, start, settings, preview, schedule, quiet, stage, palette, sound }: {
  wide: boolean; clock: ReactNode; session: boolean; wake: string; start: () => void; settings: () => void;
  preview?: () => void; schedule: ScheduleState; quiet: boolean; stage: Stage | null; palette: Palette;
  sound: { enabled: boolean; status: string; toggle: () => void; resume?: () => void };
}) {
  const startArea = (
    <View style={styles.startArea}>
      <Action variant="primary" icon="play" label={session ? 'Back to clock' : 'Start clock'} onPress={start} />
      <Text style={styles.note}>{session ? wake : 'Leave this screen open overnight.'}</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={styles.brandSun}><Icon name="sun" color={theme.gold} size={23} /></View>
          <Text style={styles.wordmark}>little light<Text style={styles.gold}>.</Text></Text>
        </View>
        <Action variant="text" label="Settings" onPress={settings} />
      </View>
      <Text style={styles.title} accessibilityRole="header">Sleep &amp; wake clock</Text>
      {!wide && startArea}
      <View style={wide ? styles.wideDashboard : styles.dashboard}>
        <View style={wide ? styles.wideClock : styles.clock}>
          {clock}
          {preview && <Action variant="text" label="Try the colours" icon="arrow" onPress={preview} style={styles.previewLink} />}
        </View>
        <View style={wide ? styles.sidebar : styles.dashboard}>
          {wide && startArea}
          <View style={styles.panel}>
            <View style={styles.between}>
              <Text style={styles.panelTitle} accessibilityRole="header">Daily routine</Text>
              <Text style={styles.scheduleLabel}>{schedule.nightLabel.toUpperCase()}</Text>
            </View>
            {ROUTINE_ROWS.filter(row => row.stage !== 'quiet' || quiet).map(row => {
              const time = schedule.nightSchedule[row.field];
              const [hour, minute] = time.split(':').map(Number);
              const timeLabel = formatClockTime(new Date(2000, 0, 15, hour, minute));
              const selected = row.stage === stage;
              return <View key={row.stage} accessible accessibilityLabel={`${row.label}, ${timeLabel}${selected ? ', current stage' : ''}`}
                style={[styles.routine, selected && styles.currentRoutine]}>
                <View style={[styles.cue, { backgroundColor: CUES[row.stage].chip }]}><Cue stage={row.stage} palette={palette} size={30} /></View>
                <Text style={styles.routineLabel}>{row.label}</Text>
                <Text style={styles.routineTime}>{timeLabel}</Text>
              </View>;
            })}
          </View>
          <View style={[styles.panel, styles.soundPanel]}>
            <View style={styles.between}>
              <View style={styles.soundTitle}>
                <Icon name="sound" color={theme.sage} size={18} />
                <Text style={styles.panelTitle} accessibilityRole="header">Sleep sounds</Text>
              </View>
              <Switch accessibilityLabel="Sleep sounds" value={sound.enabled} onValueChange={sound.toggle}
                trackColor={{ true: '#7b8c74', false: '#c7c8bd' }} ios_backgroundColor="#c7c8bd" />
            </View>
            <Text style={styles.note} accessibilityLiveRegion="polite">{sound.status}</Text>
            {sound.resume && <Action label="Resume sound" onPress={sound.resume} />}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 1200, alignSelf: 'center', paddingHorizontal: 18, paddingBottom: 20, gap: 14 },
  header: { minHeight: 66, paddingVertical: 7, borderBottomWidth: 1, borderColor: theme.line, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 7 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  brandSun: { height: 37, width: 37, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: '#e7dfcb' },
  wordmark: { color: theme.ink, fontSize: 24, fontWeight: '700', letterSpacing: -.8, flexShrink: 1 },
  gold: { color: theme.gold },
  title: { color: theme.ink, fontFamily: theme.serif, fontSize: 32 },
  startArea: { gap: 7 },
  dashboard: { gap: 14 },
  wideDashboard: { flexDirection: 'row', alignItems: 'flex-start', gap: 18 },
  clock: { gap: 4 },
  wideClock: { flex: 1, minWidth: 0, gap: 4 },
  sidebar: { width: 286, gap: 14 },
  previewLink: { alignSelf: 'center' },
  panel: { backgroundColor: theme.surface, borderColor: theme.line, borderWidth: 1, borderRadius: 20, padding: 14, gap: 7 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  panelTitle: { color: theme.ink, fontWeight: '700', fontSize: 16, flexShrink: 1 },
  scheduleLabel: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4, color: theme.sage, backgroundColor: theme.softSage, fontSize: 10, fontWeight: '700', letterSpacing: .5, flexShrink: 1 },
  routine: { minHeight: 48, paddingHorizontal: 6, paddingVertical: 4, alignItems: 'center', flexDirection: 'row', gap: 9, borderRadius: 11 },
  currentRoutine: { backgroundColor: theme.paper },
  cue: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  routineLabel: { color: theme.ink, fontWeight: '600', flex: 1 },
  routineTime: { color: theme.muted, fontWeight: '600', fontVariant: ['tabular-nums'], flexShrink: 1, textAlign: 'right' },
  soundPanel: { backgroundColor: theme.softSage },
  soundTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  note: { color: theme.muted, fontSize: 13, lineHeight: 18 },
});
