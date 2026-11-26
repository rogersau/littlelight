import { useRef, useState, type ComponentRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { getColorPalette } from '../domain/colors.ts';
import { NOISES, SOUND_DURATIONS, type Routine, type Settings, type Stage } from '../domain/schedule.ts';
import { NAP_MINUTES, STAGES, type NapMinutes } from '../domain/session.ts';
import { NOISE_LABELS } from '../hooks/useNoise.ts';
import { Action, Choices, Range, Section, Toggle, styles as controls } from './Controls.tsx';
import { Cue, Icon } from './Illustrations.tsx';
import { CUES, theme } from './theme.ts';
import { formatClockTime } from './ClockPanel.tsx';
import { TimeField } from './TimeField';

const FIELDS = [
  { key: 'bedtime', stage: 'sleep', label: 'Bedtime' },
  { key: 'quiet', stage: 'quiet', label: 'Quiet time' },
  { key: 'rise', stage: 'rise', label: 'Wake-up' },
] as const;

function timeLabel(minutes: number): string {
  if (minutes === 0) return 'Until I stop it';
  if (minutes === 60) return '1 hour';
  if (minutes === 90) return '1½ hours';
  if (minutes === 120) return '2 hours';
  return `${minutes} min`;
}

function RoutineFields({ routine, quiet, weekend, onChange }: {
  routine: Routine; quiet: boolean; weekend?: boolean; onChange: (key: keyof Routine, value: string) => void;
}) {
  return <View style={styles.timeGroup}>{FIELDS.filter(field => field.key !== 'quiet' || quiet).map(field => (
    <TimeField key={field.key} label={`${weekend ? 'Weekend · ' : ''}${CUES[field.stage].color} · ${field.label}`}
      value={routine[field.key]} onChange={value => onChange(field.key, value)} />
  ))}</View>;
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
  const [errors, setErrors] = useState<string[]>([]);
  const [nap, setNap] = useState<NapMinutes>(60);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const palette = getColorPalette(draft.colorIntensity);
  const update = <K extends keyof Settings>(field: K, value: Settings[K]) => {
    setErrors([]);
    updateDraft(previous => ({ ...previous, [field]: value }));
  };
  const updateTime = (routine: 'everyday' | 'weekend', field: keyof Routine, value: string) => {
    setErrors([]);
    updateDraft(previous => ({ ...previous, [routine]: { ...previous[routine], [field]: value } }));
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen"
      supportedOrientations={['portrait', 'portrait-upside-down', 'landscape-left', 'landscape-right']}>
      <SafeAreaProvider>
      <SafeAreaView style={styles.screen} accessibilityViewIsModal>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">Parent settings</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close settings" style={styles.close} onPress={onClose}>
            <Icon name="close" color={theme.sage} />
          </Pressable>
        </View>
        <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => { if (errors.length) scroll.current?.scrollToEnd(); }}>
          {session && <View style={styles.sessionActions}>
            {clockView && <Action label="Back to home" onPress={leaveClock} />}
            <Action label="End night" variant="danger" onPress={endSession} />
          </View>}

          <Section title="Routine times" initiallyExpanded>
            <Text style={controls.help}>Times follow this device’s local clock.</Text>
            <Toggle label="Quiet time before wake-up" value={draft.yellowEnabled} onValueChange={value => update('yellowEnabled', value)} />
            <RoutineFields routine={draft.everyday} quiet={draft.yellowEnabled} onChange={(key, value) => updateTime('everyday', key, value)} />
            <Toggle label="Weekend times" description="Friday and Saturday nights" value={draft.scheduleMode === 'weekend'}
              onValueChange={value => update('scheduleMode', value ? 'weekend' : 'everyday')} />
            {draft.scheduleMode === 'weekend' && <RoutineFields routine={draft.weekend} quiet={draft.yellowEnabled} weekend
              onChange={(key, value) => updateTime('weekend', key, value)} />}
          </Section>

          <Section title="Display">
            <Range label="Color intensity" value={draft.colorIntensity} onValueChange={value => update('colorIntensity', value)} hint="Gentle to vivid" />
            <View style={controls.between}><Text style={controls.help}>Gentle</Text><Text style={controls.help}>Vivid</Text></View>
            <View style={styles.previews}>
              {STAGES.map(stage => <View key={stage} style={[styles.preview, { backgroundColor: CUES[stage].chip }]}>
                <Cue stage={stage} palette={palette} size={42} />
                <Text style={controls.label}>{CUES[stage].color}</Text>
                <Text style={[controls.help, styles.center]}>{CUES[stage].title}</Text>
              </View>)}
            </View>
            <Action label="Use vivid colors" onPress={() => update('colorIntensity', 100)} />
            <Range label="Brightness" min={10} value={draft.brightness} onValueChange={value => update('brightness', value)} />
            <Text style={controls.help}>Dims the clock view without changing device brightness.</Text>
            <Toggle label="Show the time" value={draft.showClock} onValueChange={value => update('showClock', value)} />
            <Toggle label="Show countdown" value={draft.showCountdown} onValueChange={value => update('showCountdown', value)} />
            <Toggle label="Keep the screen awake" description="While a clock session is active and the app is visible" value={draft.keepAwake}
              onValueChange={value => update('keepAwake', value)} />
          </Section>

          <Section title="Sound options">
            <Choices label="Noise type" options={NOISES} value={draft.sound} onChange={value => update('sound', value)} renderLabel={value => NOISE_LABELS[value]} />
            <Choices label="Stop sound after" options={SOUND_DURATIONS} value={draft.soundDuration} onChange={value => update('soundDuration', value)} renderLabel={timeLabel} />
            <Range label="Sound volume" max={50} step={1} value={draft.volume} onValueChange={value => update('volume', value)} />
            <Text style={controls.help}>Start low. A percentage isn’t a sound-level measurement. Playback uses your saved sound settings.</Text>
            <Action label={soundEnabled ? 'Stop sound' : 'Play sound'} icon="sound" onPress={toggleSound} />
            <Text style={controls.help} accessibilityLiveRegion="polite">{soundStatus}</Text>
          </Section>

          <Section title="Naps and temporary colours">
            <Text style={controls.help}>A temporary color lasts until the next scheduled change. A nap lasts until its timer ends, then your saved routine returns.</Text>
            <View style={styles.sessionActions}>
              {STAGES.map(stage => <Pressable accessibilityRole="button" key={stage} onPress={() => startOverride(stage)}
                style={({ pressed }) => [styles.override, pressed && controls.pressed]}>
                <View style={[styles.colorDot, { backgroundColor: palette[CUES[stage].swatch] }]} />
                <Text style={controls.label}>{CUES[stage].title}</Text>
              </Pressable>)}
            </View>
            <Choices label="Nap timer" options={NAP_MINUTES} value={nap} onChange={setNap} renderLabel={timeLabel} />
            <Action label="Start nap" onPress={() => startNap(nap)} />
            {temporary && <>
              <Text style={controls.help}>{temporary.kind === 'nap' ? 'Nap' : 'Temporary color'} ends at {formatClockTime(new Date(temporary.until))}.</Text>
              <Action label="Return to your routine" variant="text" onPress={cancelTemporary} />
            </>}
          </Section>

          <Section title="Device help">
            <Text style={controls.help}>This is a visual routine aid, not an alarm. Leave the clock visible and the device safely powered and ventilated. Locking the device or switching apps can interrupt the clock and sound.</Text>
            <Text style={controls.help}>Check stay-awake and sound on this device before bedtime. Hardware brightness and speaker volume are separate from app settings.</Text>
            <Text style={controls.help}>The installed app works offline and saves your routine on this device. The hold gesture helps prevent casual taps and isn’t a security lock.</Text>
          </Section>

          {errors.length > 0 && <View style={styles.error} accessible accessibilityRole="alert" accessibilityLiveRegion="assertive">
            {errors.map(message => <Text key={message} style={styles.errorText}>{message}</Text>)}
          </View>}
        </ScrollView>
        <View style={styles.footer}>
          {notice && <Text accessibilityLiveRegion="polite" style={controls.help}>{notice}</Text>}
          <Action label="Save settings" variant="primary" icon="check" onPress={() => setErrors(onSave())} />
        </View>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.paper },
  header: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { color: theme.ink, fontFamily: theme.serif, fontSize: 30, flexShrink: 1 },
  close: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.line, alignItems: 'center', justifyContent: 'center' },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: 18, gap: 12 },
  footer: { backgroundColor: theme.paper, borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.line, width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 10, gap: 6 },
  sessionActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeGroup: { borderColor: theme.line, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  previews: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  preview: { flex: 1, minWidth: 68, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 3, alignItems: 'center' },
  center: { textAlign: 'center' },
  override: { minHeight: 44, borderColor: theme.line, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, gap: 6, flexDirection: 'row', alignItems: 'center' },
  colorDot: { width: 9, height: 9, borderRadius: 5 },
  error: { borderRadius: 10, backgroundColor: '#f7e5e0', padding: 12, gap: 6 },
  errorText: { color: '#8c3731', fontSize: 14, lineHeight: 19 },
});
