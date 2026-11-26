import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ClockPanel, formatClockTime } from './components/ClockPanel.tsx';
import { Home } from './components/Home.tsx';
import { SettingsSheet } from './components/SettingsSheet.tsx';
import { STAGE_COPY, theme } from './components/theme.ts';
import { getColorPalette } from './domain/colors.ts';
import { DEFAULT_SETTINGS, getScheduleState, normalizeSettings, validateSettings, type Settings, type Stage } from './domain/schedule.ts';
import { clockState, countdownText, deadlineReached, nextPreview, startNap, startOverride, type NapMinutes, type TemporaryColor } from './domain/session.ts';
import { decodeSettings, SETTINGS_KEY } from './domain/settings-storage.ts';
import { useDeviceClock, useScreenAwake } from './hooks/useDeviceClock.ts';
import { NOISE_LABELS, useNoise } from './hooks/useNoise.ts';

export default function App() {
  return <SafeAreaProvider initialMetrics={initialWindowMetrics}><LittleLight /></SafeAreaProvider>;
}

function LittleLight() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [draft, setDraft] = useState<Settings | null>(null);
  const [session, setSession] = useState(false);
  const [clockView, setClockView] = useState(false);
  const [preview, setPreview] = useState<Stage | null>(null);
  const [temporary, setTemporary] = useState<TemporaryColor | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const notify = useCallback((text: string) => {
    clearTimeout(noticeTimer.current);
    setNotice(text);
    noticeTimer.current = setTimeout(() => setNotice(null), 5_500);
  }, []);

  const { now, appState } = useDeviceClock();
  const options = settings ?? DEFAULT_SETTINGS;
  const wake = useScreenAwake(session, options.keepAwake, appState === 'active');
  const sound = useNoise(now, notify);
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    let cancelled = false;
    void AsyncStorage.getItem(SETTINGS_KEY).then(raw => {
      if (cancelled) return;
      const result = decodeSettings(raw);
      setSettings(result.settings);
      if (result.warning) notify(result.warning);
    }).catch(() => {
      if (cancelled) return;
      setSettings(normalizeSettings(null));
      notify('Saved settings are unavailable. You can still use Little Light for this visit.');
    });
    return () => { cancelled = true; clearTimeout(noticeTimer.current); };
  }, [notify]);

  const promptHold = useCallback(() => notify('Hold for a moment to open parent settings.'), [notify]);
  useEffect(() => {
    if (!clockView || draft) return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => { promptHold(); return true; });
    return () => back.remove();
  }, [clockView, draft, promptHold]);

  useEffect(() => {
    if (temporary && deadlineReached(temporary.until, now)) setTemporary(null);
  }, [now, temporary]);

  const intensity = draft?.colorIntensity ?? options.colorIntensity;
  const palette = useMemo(() => getColorPalette(intensity), [intensity]);
  const schedule = useMemo(() => getScheduleState(options, now), [options, now]);
  const current = clockState(schedule, temporary, preview, now);

  function openSettings() {
    setNotice(null);
    setDraft(normalizeSettings(options));
  }

  function save(): string[] {
    if (!draft) return [];
    const result = validateSettings(draft);
    if (!result.valid) return result.errors;
    const next = normalizeSettings(draft);
    setDraft(null);
    setSettings(next);
    setPreview(null);
    setTemporary(null);
    sound.applySettings(next);
    void AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).then(
      () => notify('Settings saved.'),
      () => notify('Applied for this visit, but the device could not save your settings.'),
    );
    return [];
  }

  function startClock() {
    setPreview(null);
    setSession(true);
    setClockView(true);
  }

  function endSession() {
    setSession(false);
    setClockView(false);
    setPreview(null);
    setTemporary(null);
    setDraft(null);
    sound.stop();
    notify('Night ended.');
  }

  function beginTemporary(value: TemporaryColor, message: string) {
    setTemporary(value);
    setDraft(null);
    startClock();
    notify(message);
  }

  if (!settings) return (
    <SafeAreaView style={styles.loading}>
      <StatusBar style="dark" />
      <ActivityIndicator accessibilityLabel="Loading Little Light" color={theme.sage} />
    </SafeAreaView>
  );

  const soundStatus = sound.playback
    ? `${NOISE_LABELS[sound.playback.sound]} · ${sound.playing ? 'on' : sound.failed ? 'could not play' : sound.loading ? 'starting…' : 'paused'}`
    : `${NOISE_LABELS[settings.sound]} · off`;
  const soundTimer = sound.playback?.endsAt != null ? ` · ends ${formatClockTime(new Date(sound.playback.endsAt))}` : '';
  const resumeSound = sound.playback && !sound.playing && !sound.loading ? sound.resume : undefined;
  const toggleSound = () => sound.toggle(settings);
  const wide = width >= 820;
  const horizontal = clockView && width > height && width >= 560 && height < 600;
  const artworkSize = clockView
    ? Math.floor(Math.min(350, width * .72, height * (horizontal ? .55 : .40)))
    : Math.floor(Math.min(265, width * .58));
  const caption = preview ? 'Color preview' : current.temporary?.kind === 'nap' ? 'A little nap in progress' : current.temporary ? 'A temporary little light' : 'On schedule';
  const nextLabel = current.temporary ? current.temporary.kind === 'nap' ? 'Nap ends' : 'Your routine returns' : STAGE_COPY[schedule.nextStage].next;
  const next = preview ? 'Just a preview of this little light' : `${nextLabel} at ${formatClockTime(current.nextAt)}`;
  const countdown = settings.showCountdown && !preview
    ? `${countdownText(now, current.nextAt)} to ${current.temporary ? 'your routine' : 'the next color'}` : null;
  const clock = <ClockPanel stage={current.stage} now={now} palette={palette} intensity={intensity} brightness={settings.brightness}
    artworkSize={artworkSize} horizontal={horizontal} showClock={settings.showClock} next={next} countdown={countdown} caption={caption}
    session={clockView ? { openSettings, promptHold, wake, sound: soundStatus + soundTimer, resumeSound } : undefined}
    preview={preview ? { next: () => setPreview(previous => previous ? nextPreview(previous) : null), dismiss: () => setPreview(null) } : undefined} />;

  return (
    <SafeAreaView style={[styles.screen, clockView && { backgroundColor: palette[`--${current.stage}-bg`] }]}>
      <StatusBar style={clockView && !draft ? 'light' : 'dark'} hidden={clockView && !draft} />
      {clockView ? <ScrollView contentContainerStyle={styles.session} bounces={false}>{clock}</ScrollView> : (
        <Home wide={wide} clock={clock} session={session} wake={wake} start={startClock} settings={openSettings}
          preview={preview ? undefined : () => setPreview('sleep')} schedule={schedule} quiet={settings.yellowEnabled}
          stage={preview ? null : current.stage} palette={palette}
          sound={{ enabled: !!sound.playback, status: soundStatus + soundTimer, toggle: toggleSound, resume: resumeSound }} />
      )}
      {notice && !draft && <View style={styles.notice}>
        <Text style={styles.noticeText} accessibilityLiveRegion="polite">{notice}</Text>
      </View>}
      {draft && <SettingsSheet draft={draft} updateDraft={update => setDraft(previous => previous ? update(previous) : null)}
        onClose={() => setDraft(null)} onSave={save} clockView={clockView} session={session}
        leaveClock={() => { setClockView(false); setDraft(null); }} endSession={endSession}
        temporary={current.temporary}
        startNap={(minutes: NapMinutes) => beginTemporary(startNap(minutes, new Date()), `A ${minutes}-minute nap has started. Your saved routine resumes afterward.`)}
        startOverride={stage => beginTemporary(startOverride(stage, getScheduleState(settings, new Date())), 'Temporary color set until the next scheduled change.')}
        cancelTemporary={() => { setTemporary(null); notify('Back to your saved routine.'); }}
        soundEnabled={!!sound.playback} soundStatus={soundStatus + soundTimer} toggleSound={toggleSound} notice={notice} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.paper },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.paper },
  session: { flexGrow: 1 },
  notice: { alignSelf: 'center', maxWidth: 520, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: theme.sage },
  noticeText: { fontSize: 13, lineHeight: 18, color: theme.surface, textAlign: 'center' },
});
