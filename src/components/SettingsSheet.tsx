import { useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_COLOR_INTENSITY, getColorPalette, type Palette } from '../domain/colors.ts';
import { NOISES, SOUND_DURATIONS, type Routine, type Settings, type Stage } from '../domain/schedule.ts';
import { NAP_MINUTES, STAGES, type NapMinutes } from '../domain/session.ts';
import { Action, Choices, ColorDot, Dimmer, Range, Section, Toggle, styles as controls } from './Controls.tsx';
import { Cue, Icon, type IconName } from './Illustrations.tsx';
import { CUES, STAGE_COPY, theme } from './theme.ts';
import { formatClockTime } from './ClockPanel.tsx';
import { TimeField } from './TimeField';

const FIELDS = [
  { key: 'bedtime', stage: 'sleep', label: 'Bedtime' },
  { key: 'quiet', stage: 'quiet', label: 'Quiet time' },
  { key: 'rise', stage: 'rise', label: 'Wake-up' },
] as const;
const TABS = ['Routine', 'Light', 'Sound', 'Nap & Now'] as const;
type Tab = typeof TABS[number];
const INTENSITIES = [0, DEFAULT_COLOR_INTENSITY, 100] as const;
const NOISE_CHOICES = { white: 'White', pink: 'Pink', brown: 'Brown' };
const OVERRIDE_LABELS = { sleep: 'Red · Sleep', quiet: 'Yellow · Quiet', rise: 'Green · Get up' };

function timeLabel(minutes: number): string {
  if (minutes === 0) return 'Until I stop it';
  if (minutes === 60) return '1 hour';
  if (minutes === 90) return '1½ hours';
  if (minutes === 120) return '2 hours';
  return `${minutes} min`;
}

function RoutineFields({ routine, quiet, title, palette, onChange }: {
  routine: Routine; quiet: boolean; title: string; palette: Palette; onChange: (key: keyof Routine, value: string) => void;
}) {
  return (
    <View style={styles.timeGroup}>
      <Text style={styles.groupTitle} accessibilityRole="header">{title}</Text>
      {FIELDS.filter(field => field.key !== 'quiet' || quiet).map((field, index) => (
        <View key={field.key} style={index > 0 && styles.rowLine}>
          <TimeField label={`${CUES[field.stage].color} · ${field.label}`} accessibilityLabel={`${title}, ${field.label}`}
            dotColor={palette[`--${field.stage}-accent`]} value={routine[field.key]} onChange={value => onChange(field.key, value)} />
        </View>
      ))}
    </View>
  );
}

function Card({ title, icon, children }: { title: string; icon: IconName; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}><Icon name={icon} color={theme.accent} size={17} /></View>
        <Text style={styles.cardTitle} accessibilityRole="header">{title}</Text>
      </View>
      {children}
    </View>
  );
}

type Props = {
  draft: Settings;
  updateDraft: (update: (previous: Settings) => Settings) => void;
  onClose: () => void;
  onSave: () => string[];
  clockView: boolean;
  session: boolean;
  leaveClock: () => void;
  endSession: () => void;
  temporary: { kind: 'nap' | 'override'; until: number } | null;
  startNap: (minutes: NapMinutes) => void;
  startOverride: (stage: Stage) => void;
  cancelTemporary: () => void;
  soundEnabled: boolean;
  soundStatus: string;
  toggleSound: () => void;
  notice: string | null;
};

export function SettingsSheet({ draft, updateDraft, onClose, onSave, clockView, session, leaveClock, endSession,
  temporary, startNap, startOverride, cancelTemporary, soundEnabled, soundStatus, toggleSound, notice }: Props) {
  const [tab, setTab] = useState<Tab>('Routine');
  const [errors, setErrors] = useState<string[]>([]);
  const [nap, setNap] = useState<NapMinutes>(60);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const palette = useMemo(() => getColorPalette(draft.colorIntensity), [draft.colorIntensity]);

  useEffect(() => {
    if (tab === 'Routine' && errors.length) scroll.current?.scrollTo({ y: 0, animated: false });
  }, [tab, errors]);

  const update = <K extends keyof Settings>(field: K, value: Settings[K]) => {
    setErrors([]);
    updateDraft(previous => ({ ...previous, [field]: value }));
  };
  const updateTime = (routine: 'everyday' | 'weekend', field: keyof Routine, value: string) => {
    setErrors([]);
    updateDraft(previous => ({ ...previous, [routine]: { ...previous[routine], [field]: value } }));
  };
  const changeTab = (next: Tab) => {
    if (next === tab) return;
    setTab(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen"
      supportedOrientations={['portrait', 'portrait-upside-down', 'landscape-left', 'landscape-right']}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.screen} accessibilityViewIsModal>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>LITTLE LIGHT</Text>
              <Text style={styles.title} accessibilityRole="header">Parent settings</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close settings" onPress={onClose}
              style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
              <Icon name="close" color={theme.ink} />
            </Pressable>
          </View>

          <View style={styles.top}>
            {session && <View style={styles.sessionBanner}>
              <Text style={styles.sessionText}>Clock is running</Text>
              <View style={styles.sessionActions}>
                {clockView && <Action label="Back to home" onPress={leaveClock} style={styles.sessionButton} />}
                <Action label="End night" variant="danger" onPress={endSession} style={styles.sessionButton} />
              </View>
            </View>}
            <View style={styles.tabs} accessibilityRole="tablist" accessibilityLabel="Settings sections">
              {TABS.map(option => {
                const selected = tab === option;
                return <Pressable key={option} accessibilityRole="tab" accessibilityState={{ selected }} aria-selected={selected}
                  onPress={() => changeTab(option)}
                  style={({ pressed }) => [styles.tab, selected && styles.tabActive, pressed && styles.pressed]}>
                  <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>{option}</Text>
                </Pressable>;
              })}
            </View>
          </View>

          <ScrollView ref={scroll} style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View role="tabpanel" accessibilityLabel={tab} style={styles.tabContent}>
              {tab === 'Routine' && <>
                {errors.length > 0 && <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.error}>
                  {errors.map(message => <Text key={message} style={styles.errorText}>{message}</Text>)}
                </View>}
                <Card title="Everyday routine" icon="clock">
                  <Toggle label="Quiet time before wake-up" value={draft.yellowEnabled}
                    onValueChange={value => update('yellowEnabled', value)} />
                  <RoutineFields title="Routine times" routine={draft.everyday} quiet={draft.yellowEnabled} palette={palette}
                    onChange={(key, value) => updateTime('everyday', key, value)} />
                </Card>
                <Card title="Weekend schedule" icon="moon">
                  <Toggle label="Friday & Saturday nights" description="Use different times on weekend nights"
                    value={draft.scheduleMode === 'weekend'} onValueChange={value => update('scheduleMode', value ? 'weekend' : 'everyday')} />
                  {draft.scheduleMode === 'weekend' && <RoutineFields title="Weekend times" routine={draft.weekend}
                    quiet={draft.yellowEnabled} palette={palette} onChange={(key, value) => updateTime('weekend', key, value)} />}
                </Card>
                <Text style={styles.helper}>Times follow this device’s local clock.</Text>
              </>}

              {tab === 'Light' && <>
                <Card title="Nursery preview" icon="sparkles">
                  <View style={styles.previews}>
                    {STAGES.map(stage => <View key={stage} style={[styles.preview, {
                      backgroundColor: palette[`--${stage}-bg`], borderColor: palette[`--${stage}-accent`] + '51',
                    }]}>
                      <Cue stage={stage} palette={palette} size={41} />
                      <Dimmer brightness={draft.brightness} />
                      <Text style={[styles.previewColor, { color: palette[`--${stage}-accent`] }]}>{CUES[stage].color}</Text>
                      <Text style={styles.previewTitle}>{STAGE_COPY[stage].short}</Text>
                    </View>)}
                  </View>
                </Card>
                <Card title="Lantern appearance" icon="sliders">
                  <Range label="Color intensity" value={draft.colorIntensity} onValueChange={value => update('colorIntensity', value)}
                    hint="Gentle to vivid" endpoints={['Gentle', 'Vivid']} />
                  <Choices label="Color intensity presets" options={INTENSITIES} showLabel={false} value={draft.colorIntensity}
                    onChange={value => update('colorIntensity', value)} renderLabel={value => value === 0 ? 'Gentle' : value === 100 ? 'Vivid' : 'Balanced'} />
                  <View style={styles.divider} />
                  <Range label="Brightness" min={10} value={draft.brightness} onValueChange={value => update('brightness', value)}
                    endpoints={['10%', '100%']} />
                  <Text style={controls.help}>Dims the clock without changing your device’s brightness.</Text>
                </Card>
                <Card title="Clock display" icon="clock">
                  <Toggle label="Show digital clock" value={draft.showClock} onValueChange={value => update('showClock', value)} />
                  <Toggle label="Show countdown" value={draft.showCountdown} onValueChange={value => update('showCountdown', value)} />
                  <Toggle label="Keep screen awake" description="While a clock session is active and the app is visible"
                    value={draft.keepAwake} onValueChange={value => update('keepAwake', value)} />
                </Card>
              </>}

              {tab === 'Sound' && <Card title="Sleep sounds" icon="sound">
                <Choices label="Noise type" options={NOISES} value={draft.sound} onChange={value => update('sound', value)}
                  renderLabel={value => NOISE_CHOICES[value]} />
                <Choices label="Stop sound after" options={SOUND_DURATIONS} value={draft.soundDuration}
                  onChange={value => update('soundDuration', value)} renderLabel={timeLabel} />
                <View style={styles.divider} />
                <Range label="Sound volume" max={50} step={1} value={draft.volume} onValueChange={value => update('volume', value)} />
                <Text style={controls.help}>Start low. A percentage isn’t a sound-level measurement. Playback uses your saved sound settings.</Text>
                <Action label={soundEnabled ? 'Stop sound' : 'Play sound'} icon="sound" onPress={toggleSound} />
                <Text style={controls.help} accessibilityLiveRegion="polite">{soundStatus}</Text>
              </Card>}

              {tab === 'Nap & Now' && <>
                {temporary && <View style={styles.temporary}>
                  <Text style={styles.temporaryTitle} accessibilityLiveRegion="polite">
                    {temporary.kind === 'nap' ? 'Nap' : 'Temporary color'} ends at {formatClockTime(new Date(temporary.until))}.
                  </Text>
                  <Action label="Return to saved routine" onPress={cancelTemporary} style={styles.temporaryButton} />
                </View>}
                <Card title="Temporary color" icon="sparkles">
                  <Text style={controls.help}>Show a different color until the next scheduled change.</Text>
                  <View style={styles.overrides}>
                    {STAGES.map(stage => {
                      const tint = palette[`--${stage}-accent`];
                      return <Pressable accessibilityRole="button" key={stage} onPress={() => startOverride(stage)}
                        style={({ pressed }) => [styles.override, { backgroundColor: CUES[stage].chip, borderColor: tint + '51' },
                          pressed && controls.pressed]}>
                        <ColorDot color={tint} size={8} />
                        <Text style={[styles.overrideLabel, { color: tint }]}>{OVERRIDE_LABELS[stage]}</Text>
                      </Pressable>;
                    })}
                  </View>
                </Card>
                <Card title="Nap timer" icon="moon">
                  <Text style={controls.help}>The lantern stays red until the nap timer ends, then your saved routine returns.</Text>
                  <Choices label="Nap duration" options={NAP_MINUTES} value={nap} onChange={setNap} renderLabel={timeLabel} />
                  <Action label="Start nap" icon="clock" onPress={() => startNap(nap)} />
                </Card>
                <Section title="Device help & safety">
                  <Text style={controls.help}>This is a visual routine aid, not an alarm. Leave the clock visible and the device safely powered and ventilated. Locking the device or switching apps can interrupt the clock and sound.</Text>
                  <Text style={controls.help}>Check stay-awake and sound on this device before bedtime. Hardware brightness and speaker volume are separate from app settings.</Text>
                  <Text style={controls.help}>The installed app works offline and saves your routine on this device. The hold gesture helps prevent casual taps and isn’t a security lock.</Text>
                </Section>
              </>}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {notice && <Text accessibilityLiveRegion="polite" style={controls.help}>{notice}</Text>}
            <Action label="Save settings" variant="primary" icon="check" onPress={() => {
              const messages = onSave();
              setErrors(messages);
              if (messages.length) setTab('Routine');
            }} />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.canvas },
  header: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 9, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', gap: 10, flexShrink: 0 },
  headerCopy: { gap: 2, flexShrink: 1 },
  eyebrow: { color: theme.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.65 },
  title: { color: theme.ink, fontFamily: theme.serif, fontSize: 35, letterSpacing: -.7 },
  close: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surfaceElevated,
    alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: theme.surfacePressed },
  top: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 4, gap: 8, flexShrink: 0 },
  sessionBanner: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 5,
    borderRadius: 14, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, paddingVertical: 5, paddingHorizontal: 9 },
  sessionText: { color: theme.muted, fontSize: 12, fontWeight: '600' },
  sessionActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  sessionButton: { paddingHorizontal: 8 },
  tabs: { flexDirection: 'row', padding: 4, gap: 3, borderRadius: 17, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface },
  tab: { flex: 1, minWidth: 0, minHeight: 44, paddingHorizontal: 2, paddingVertical: 5, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: theme.surfaceElevated },
  tabLabel: { color: theme.muted, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  tabLabelActive: { color: theme.accent, fontWeight: '800' },
  scroll: { flex: 1 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  tabContent: { gap: 11 },
  card: { borderWidth: 1, borderColor: theme.line, padding: 13, gap: 10, borderRadius: 19, backgroundColor: theme.surface },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.accentSoft },
  cardTitle: { color: theme.ink, fontSize: 17, fontWeight: '700', flexShrink: 1 },
  timeGroup: { backgroundColor: theme.surfaceElevated, borderColor: theme.line, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  groupTitle: { color: theme.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', paddingTop: 7, paddingBottom: 4 },
  rowLine: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.line },
  helper: { color: theme.muted, fontSize: 12, lineHeight: 18, paddingHorizontal: 3 },
  previews: { flexDirection: 'row', gap: 6 },
  preview: { flex: 1, minWidth: 0, borderRadius: 13, overflow: 'hidden', borderWidth: 1,
    paddingVertical: 8, paddingHorizontal: 3, alignItems: 'center', gap: 2 },
  previewColor: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: .65, textAlign: 'center' },
  previewTitle: { color: theme.ink, fontSize: 11, textAlign: 'center' },
  divider: { borderTopWidth: 1, borderColor: theme.line, marginVertical: 3 },
  overrides: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  override: { flexGrow: 1, minHeight: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 6,
    gap: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  overrideLabel: { fontSize: 12, fontWeight: '700', flexShrink: 1 },
  temporary: { borderRadius: 14, borderWidth: 1, borderColor: theme.accent + '50', padding: 10, gap: 5, backgroundColor: theme.accentSoft },
  temporaryTitle: { color: theme.accent, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  temporaryButton: { alignSelf: 'flex-start' },
  footer: { backgroundColor: theme.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.line, width: '100%',
    maxWidth: 680, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 6, flexShrink: 0 },
  error: { borderRadius: 10, borderWidth: 1, borderColor: theme.dangerBorder, backgroundColor: theme.dangerBg, gap: 5, padding: 9 },
  errorText: { color: theme.danger, fontSize: 13, lineHeight: 18 },
});
