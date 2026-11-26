import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Palette } from '../domain/colors.ts';
import type { Stage } from '../domain/schedule.ts';
import { Icon, Scene } from './Illustrations.tsx';
import { STAGE_COPY, theme } from './theme.ts';

const TEXT = '#f8eade';
const MUTED = '#e0d2c5';
const STARS = [[10, 25], [15, 38], [25, 24], [16, 58], [9, 78], [31, 46], [67, 18], [78, 33], [86, 59], [87, 77], [94, 19]] as const;

export function formatClockTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

const Stars = memo(function Stars() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} importantForAccessibility="no-hide-descendants">
      {STARS.map(([left, top], i) => <View key={left} style={[styles.star, { left: `${left}%`, top: `${top}%`, opacity: i % 2 === 0 ? .38 : .24 }]} />)}
    </View>
  );
});

type SessionControls = { openSettings: () => void; promptHold: () => void; wake: string; sound: string; resumeSound?: () => void };
type PreviewControls = { next: () => void; dismiss: () => void };

export function ClockPanel({ stage, now, palette, intensity, brightness, artworkSize, horizontal, showClock, next, countdown, caption, session, preview }: {
  stage: Stage; now: Date; palette: Palette; intensity: number; brightness: number; artworkSize: number; horizontal?: boolean;
  showClock: boolean; next: string; countdown: string | null; caption: string; session?: SessionControls; preview?: PreviewControls;
}) {
  const accent = palette[`--${stage}-accent`];
  const copy = STAGE_COPY[stage];
  const parts = showClock ? new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).formatToParts(now) : [];
  const time = parts.filter(part => part.type !== 'dayPeriod').map(part => part.value).join('').trim();
  const period = parts.find(part => part.type === 'dayPeriod')?.value;

  return (
    <View style={[styles.panel, session && styles.session, { backgroundColor: palette[`--${stage}-bg`] }]}>
      <Stars />
      <View style={styles.top}>
        <View style={styles.badge}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <Text style={[styles.badgeText, { color: accent }]}>{copy.label}</Text>
        </View>
        {session ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Hold for settings"
            accessibilityHint="Hold for one and a half seconds to open parent settings"
            accessibilityActions={[{ name: 'longpress', label: 'Open parent settings' }]}
            onAccessibilityAction={event => { if (event.nativeEvent.actionName === 'longpress') session.openSettings(); }}
            delayLongPress={1500} onLongPress={session.openSettings} onPress={session.promptHold}
            style={({ pressed }) => [styles.gate, pressed && styles.gatePressed]}>
            <Icon name="lock" color={TEXT} size={16} />
            <Text style={styles.gateText}>Hold for settings</Text>
          </Pressable>
        ) : <Text style={styles.date}>{now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</Text>}
      </View>

      <View style={[styles.body, horizontal && styles.horizontal]}>
        <Scene stage={stage} size={artworkSize} accent={accent} intensity={intensity} />
        <View style={[styles.copy, horizontal && styles.horizontalCopy]}>
          <Text style={[styles.title, session && styles.sessionTitle]} accessibilityRole="header">{copy.title}</Text>
          <Text style={styles.description}>{copy.description}</Text>
          {showClock && <View style={styles.timeBox} accessible accessibilityLabel={formatClockTime(now)}>
            <Text style={[styles.time, session && styles.sessionTime]}>{time}</Text>
            {period && <Text style={styles.period}>{period}</Text>}
          </View>}
          <Text style={styles.next}>{next}</Text>
          {countdown && <Text style={[styles.next, { color: accent }]}>{countdown}</Text>}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.caption}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <Text style={styles.footerText}>{caption}</Text>
        </View>
        {preview && <View style={styles.footerActions}>
          <ClockAction label="Next colour" onPress={preview.next} />
          <ClockAction label="Done" onPress={preview.dismiss} />
        </View>}
      </View>
      {session && <View style={styles.sessionStatus}>
        <Text style={styles.footerText} accessibilityLiveRegion="polite">{session.wake}</Text>
        <Text style={styles.footerText}>{session.sound}</Text>
        {session.resumeSound && <ClockAction label="Resume sound" onPress={session.resumeSound} />}
      </View>}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: (100 - brightness) / 200 }]} />
    </View>
  );
}

function ClockAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.clockAction, pressed && styles.gatePressed]}>
      <Text style={styles.gateText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { flexGrow: 1, borderRadius: 24, overflow: 'hidden', paddingHorizontal: 18, paddingVertical: 13 },
  session: { borderRadius: 0 },
  star: { position: 'absolute', width: 3, height: 3, borderRadius: 2, backgroundColor: '#e8d2ab' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, minHeight: 44 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 7, borderWidth: 1, borderColor: '#ffffff24', borderRadius: 24, flexShrink: 1 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1, flexShrink: 1 },
  dot: { height: 5, width: 5, borderRadius: 3 },
  date: { fontSize: 12, color: MUTED, flexShrink: 1, textAlign: 'right' },
  gate: { minHeight: 44, maxWidth: '58%', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: '#ffffff35', borderRadius: 22 },
  gatePressed: { backgroundColor: '#ffffff25' },
  gateText: { fontSize: 12, fontWeight: '600', color: TEXT, flexShrink: 1 },
  body: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 15 },
  horizontal: { flexDirection: 'row', gap: 20 },
  copy: { gap: 7, flexShrink: 1, maxWidth: 430, alignItems: 'center' },
  horizontalCopy: { alignItems: 'flex-start' },
  title: { color: TEXT, fontSize: 32, fontFamily: theme.serif, textAlign: 'center' },
  sessionTitle: { fontSize: 36 },
  description: { color: MUTED, fontSize: 14, textAlign: 'center' },
  timeBox: { marginTop: 5, flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  time: { fontSize: 40, fontWeight: '300', color: TEXT, fontVariant: ['tabular-nums'], flexShrink: 1 },
  sessionTime: { fontSize: 51 },
  period: { fontSize: 13, fontWeight: '600', color: MUTED },
  next: { color: MUTED, fontSize: 13, textAlign: 'center' },
  footer: { minHeight: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 5 },
  caption: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  footerText: { color: MUTED, fontSize: 12, flexShrink: 1 },
  footerActions: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  clockAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 12 },
  sessionStatus: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#ffffff45', marginTop: 5, paddingTop: 9, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
});
