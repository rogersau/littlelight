import { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { Palette } from '../domain/colors.ts';
import type { Stage } from '../domain/schedule.ts';
import { STAGES } from '../domain/session.ts';
import { ColorDot, Dimmer } from './Controls.tsx';
import { HoldLockButton } from './HoldLockButton.tsx';
import { Icon, useSvgId, type IconName } from './Illustrations.tsx';
import { Lantern } from './Lantern.tsx';
import { CUES, STAGE_COPY, theme } from './theme.ts';

const MOTES = [[9, 22], [19, 37], [11, 62], [7, 78], [28, 20], [32, 77], [70, 16], [78, 27], [90, 48], [85, 71], [94, 83]] as const;
const stageIcon: Record<Stage, IconName> = { sleep: 'moon', quiet: 'sun', rise: 'sparkles' };
const dusk = '#110d163d';
const glassBorder = '#fff1de28';

export function formatClockTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

const Atmosphere = memo(function Atmosphere({ stage, accent, horizontal }: {
  stage: Stage; accent: string; horizontal?: boolean;
}) {
  const id = useSvgId('clock-wash');
  return (
    <View aria-hidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 1000 600" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id={id} cx={horizontal ? '34%' : '50%'} cy={horizontal ? '50%' : '39%'} r="60%">
            <Stop offset={0} stopColor={accent} stopOpacity={.22} />
            <Stop offset={.42} stopColor={accent} stopOpacity={.095} />
            <Stop offset={1} stopColor="#100d19" stopOpacity={.52} />
          </RadialGradient>
        </Defs>
        <Rect width={1000} height={600} fill={`url(#${id})`} />
      </Svg>
      {MOTES.map(([left, top], i) => <View key={left} style={[styles.mote, { left: `${left}%`, top: `${top}%`,
        opacity: i % 3 === 0 ? .54 : .32 }]}>
        {stage !== 'quiet' && i % (stage === 'rise' ? 3 : 4) === 0
          ? <Icon name="sparkles" color={accent} size={i % 2 === 0 ? 10 : 8} />
          : <View style={[styles.moteDot, { backgroundColor: accent }, stage === 'quiet' && i % 2 === 0 && styles.dawnDot]} />}
      </View>)}
    </View>
  );
});

type SessionControls = {
  openSettings: () => void; promptHold: () => void; wake: string; sound: string; resumeSound?: () => void; notice: string | null;
};
type PreviewControls = { selected: Stage | null; select: (stage: Stage) => void; next: () => void; dismiss: () => void };

export function ClockPanel({ stage, now, palette, brightness, artworkSize, animated, horizontal, showClock, next, countdown, caption, session, preview }: {
  stage: Stage; now: Date; palette: Palette; brightness: number; artworkSize: number; animated?: boolean; horizontal?: boolean;
  showClock: boolean; next: string; countdown: string | null; caption: string; session?: SessionControls; preview?: PreviewControls;
}) {
  const accent = palette[`--${stage}-accent`];
  const copy = STAGE_COPY[stage];
  const parts = showClock ? new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).formatToParts(now) : [];
  const time = parts.filter(part => part.type !== 'dayPeriod').map(part => part.value).join('').trim();
  const period = parts.find(part => part.type === 'dayPeriod')?.value;
  const large = artworkSize >= 275;
  const colorStyle = { backgroundColor: palette[`--${stage}-bg`] };

  const content = <>
    <View style={styles.top}>
      <View style={styles.badge}>
        <ColorDot color={accent} size={6} />
        <Text style={[styles.badgeText, { color: accent }]}>{copy.label}</Text>
      </View>
      {session
        ? <HoldLockButton accent={accent} openSettings={session.openSettings} promptHold={session.promptHold} />
        : <Text style={styles.date}>{now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</Text>}
    </View>

    <View style={[styles.body, session && styles.sessionBody, horizontal && styles.horizontal]}>
      <Lantern stage={stage} palette={palette} size={artworkSize} animated={animated} />
      <View style={[styles.copy, horizontal && styles.horizontalCopy]}>
        <Text accessibilityRole="header" style={[styles.title, large && styles.largeTitle, session && styles.sessionTitle,
          session && large && styles.largeSessionTitle, horizontal && styles.left]}>{copy.title}</Text>
        <Text style={[styles.description, session && styles.sessionDescription, horizontal && styles.left]}>{copy.description}</Text>
        {showClock && <View style={styles.timeBox} accessible accessibilityLabel={formatClockTime(now)}>
          <Text style={[styles.time, session && styles.sessionTime, session && large && styles.largeSessionTime]}>{time}</Text>
          {period && <Text style={styles.period}>{period}</Text>}
        </View>}
        <View style={[styles.nextBox, horizontal && styles.nextLeft]}>
          <Icon name={preview?.selected ? stageIcon[stage] : 'clock'} color={accent} size={14} />
          <Text style={styles.next}>{next}</Text>
          {countdown && <Text style={[styles.countdown, { color: accent }]}>· {countdown}</Text>}
        </View>
      </View>
    </View>

    {session && <View style={styles.sessionFooter}>
      {session.notice && <Text style={styles.notice} accessibilityLiveRegion="polite">{session.notice}</Text>}
      <View style={styles.whisper}>
        <View style={styles.whisperCaption}><ColorDot color={accent} size={5} /><Text style={styles.footerText}>{caption}</Text></View>
        <Text style={styles.footerText} accessibilityLiveRegion="polite">{session.wake}</Text>
        <Text style={styles.footerText}>{session.sound}</Text>
        {session.resumeSound && <Pressable accessibilityRole="button" onPress={session.resumeSound}
          style={({ pressed }) => [styles.resume, pressed && styles.glassPressed]}>
          <Icon name="sound" color={theme.ink} size={14} />
          <Text style={styles.resumeText}>Resume sound</Text>
        </Pressable>}
      </View>
    </View>}
  </>;

  if (session) return (
    <View style={[styles.session, colorStyle]}>
      <Atmosphere stage={stage} accent={accent} horizontal={horizontal} />
      <ScrollView style={styles.session} contentContainerStyle={styles.sessionScroll} bounces={false}>
        <SafeAreaView style={styles.sessionInner}>{content}</SafeAreaView>
      </ScrollView>
      <Dimmer brightness={brightness} />
    </View>
  );

  return (
    <View style={styles.preview}>
      <View style={[styles.card, colorStyle, { borderColor: accent + '56' }]}>
        <Atmosphere stage={stage} accent={accent} />
        <View style={styles.cardInner}>{content}</View>
        <Dimmer brightness={brightness} />
      </View>
      {preview && <View style={styles.previewBar}>
        <Text style={styles.previewLabel}>Try colors</Text>
        <View style={styles.stages} accessibilityRole="radiogroup" accessibilityLabel="Preview colors">
          {STAGES.map(option => {
            const selected = preview.selected === option;
            const tint = palette[`--${option}-accent`];
            return <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: selected }} aria-checked={selected}
              onPress={() => preview.select(option)} style={({ pressed }) => [styles.stageButton, selected && {
                backgroundColor: CUES[option].chip, borderColor: tint + '83',
              }, pressed && styles.glassPressed]}>
              <ColorDot color={palette[CUES[option].swatch]} size={6} />
              <Text style={[styles.stageButtonText, selected && { color: tint }]}>{CUES[option].color}</Text>
            </Pressable>;
          })}
        </View>
        {preview.selected && <View style={styles.previewActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Next preview color" onPress={preview.next}
            style={({ pressed }) => [styles.step, pressed && styles.glassPressed]}><Icon name="arrow" color={theme.muted} size={16} /></Pressable>
          <Pressable accessibilityRole="button" onPress={preview.dismiss}
            style={({ pressed }) => [styles.done, pressed && styles.glassPressed]}><Text style={styles.doneText}>Done</Text></Pressable>
        </View>}
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { gap: 10 },
  card: { borderRadius: 28, overflow: 'hidden', borderWidth: 1 },
  cardInner: { paddingHorizontal: 17, paddingTop: 13, paddingBottom: 10 },
  session: { flex: 1 },
  sessionScroll: { flexGrow: 1 },
  sessionInner: { width: '100%', maxWidth: 1220, alignSelf: 'center', flexGrow: 1, paddingHorizontal: 18, paddingVertical: 10 },
  mote: { position: 'absolute' },
  moteDot: { width: 2, height: 2, borderRadius: 2 },
  dawnDot: { width: 4, height: 2 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, minHeight: 44 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, minHeight: 31,
    borderWidth: 1, borderColor: glassBorder, borderRadius: 24, backgroundColor: dusk, flexShrink: 1 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.35, flexShrink: 1 },
  date: { fontSize: 12, color: theme.ink, opacity: .78, flexShrink: 1, textAlign: 'right' },
  body: { alignItems: 'center', justifyContent: 'center', paddingTop: 2, paddingBottom: 15, gap: 0 },
  sessionBody: { flexGrow: 1, paddingVertical: 12, gap: 2 },
  horizontal: { flexDirection: 'row', paddingVertical: 5, gap: 18 },
  copy: { gap: 5, flexShrink: 1, maxWidth: 460, alignItems: 'center', minWidth: 0 },
  horizontalCopy: { alignItems: 'flex-start' },
  left: { textAlign: 'left' },
  title: { color: theme.ink, fontSize: 34, letterSpacing: -.6, fontFamily: theme.serif, textAlign: 'center' },
  largeTitle: { fontSize: 41 },
  sessionTitle: { fontSize: 41 },
  largeSessionTitle: { fontSize: 54 },
  description: { color: theme.ink, opacity: .85, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  sessionDescription: { fontSize: 16, lineHeight: 22 },
  timeBox: { marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  time: { fontSize: 43, fontWeight: '300', color: theme.ink, fontVariant: ['tabular-nums'], letterSpacing: -1.8, flexShrink: 1 },
  sessionTime: { fontSize: 55 },
  largeSessionTime: { fontSize: 66 },
  period: { paddingVertical: 4, paddingHorizontal: 7, borderRadius: 6, backgroundColor: '#fff1de17', fontSize: 10,
    fontWeight: '700', color: theme.ink, textTransform: 'uppercase', letterSpacing: .7 },
  nextBox: { alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 19, borderWidth: 1, borderColor: glassBorder, paddingVertical: 7, paddingHorizontal: 10, marginTop: 8, backgroundColor: dusk },
  nextLeft: { alignSelf: 'flex-start', justifyContent: 'flex-start' },
  next: { color: theme.ink, opacity: .86, fontSize: 12, flexShrink: 1 },
  countdown: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  sessionFooter: { gap: 6 },
  notice: { color: theme.ink, backgroundColor: '#100d1690', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    alignSelf: 'center', fontSize: 13, textAlign: 'center' },
  whisper: { minHeight: 34, borderTopWidth: StyleSheet.hairlineWidth, borderColor: glassBorder, paddingTop: 7,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', columnGap: 14, rowGap: 4 },
  whisperCaption: { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 1 },
  footerText: { color: theme.ink, opacity: .72, fontSize: 11, flexShrink: 1 },
  resume: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44, paddingHorizontal: 11,
    borderRadius: 22, borderWidth: 1, borderColor: glassBorder, backgroundColor: dusk },
  resumeText: { color: theme.ink, fontSize: 12, fontWeight: '700' },
  glassPressed: { backgroundColor: theme.surfacePressed },
  previewBar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: 9, rowGap: 5 },
  previewLabel: { color: theme.muted, fontSize: 12, fontWeight: '600' },
  stages: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, flexShrink: 1 },
  stageButton: { minHeight: 44, paddingHorizontal: 9, borderRadius: 22, borderWidth: 1, borderColor: theme.line,
    alignItems: 'center', flexDirection: 'row', gap: 4, backgroundColor: theme.surface },
  stageButtonText: { color: theme.ink, fontWeight: '700', fontSize: 12 },
  previewActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  step: { minWidth: 44, minHeight: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  done: { minHeight: 44, paddingHorizontal: 12, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.accentSoft },
  doneText: { color: theme.accent, fontSize: 12, fontWeight: '800' },
});
