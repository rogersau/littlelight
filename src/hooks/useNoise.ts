import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, type AudioSource } from 'expo-audio';
import type { Noise, Settings } from '../domain/schedule.ts';
import { deadlineReached, soundDeadline } from '../domain/session.ts';

const SOURCES: Record<Noise, AudioSource> = {
  white: require('../../assets/sounds/white.wav'),
  pink: require('../../assets/sounds/pink.wav'),
  brown: require('../../assets/sounds/brown.wav'),
};

export const NOISE_LABELS: Record<Noise, string> = {
  white: 'White noise',
  pink: 'Pink noise',
  brown: 'Brown noise',
};

type SoundSettings = Pick<Settings, 'sound' | 'volume' | 'soundDuration'>;
type Playback = SoundSettings & { endsAt: number | null };

export function useNoise(now: Date, notify: (message: string) => void) {
  const player = useAudioPlayer(null, { allowsExternalPlayback: false });
  const status = useAudioPlayerStatus(player);
  const [playback, setPlayback] = useState<Playback | null>(null);
  const [starting, setStarting] = useState(false);
  const current = useRef<Playback | null>(null);
  const loaded = useRef<Noise | null>(null);
  const operation = useRef(0);

  const setCurrent = useCallback((value: Playback | null) => {
    current.current = value;
    setPlayback(value);
  }, []);

  const clearSource = useCallback(() => {
    player.pause();
    player.replace(null);
    loaded.current = null;
  }, [player]);

  const stop = useCallback(() => {
    operation.current += 1;
    clearSource();
    setCurrent(null);
    setStarting(false);
  }, [clearSource, setCurrent]);

  const play = useCallback(async () => {
    const requested = ++operation.current;
    setStarting(true);
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'mixWithOthers',
      });
      if (requested !== operation.current || AppState.currentState !== 'active') return;
      const latest = current.current;
      if (!latest) return;
      if (deadlineReached(latest.endsAt, new Date())) {
        stop();
        return;
      }
      player.volume = latest.volume / 100;
      if (loaded.current !== latest.sound || player.currentStatus.error) {
        // Replacing a playing source can queue a native auto-resume callback.
        player.pause();
        player.replace(SOURCES[latest.sound]);
        loaded.current = latest.sound;
      }
      player.loop = true;
      player.play();
    } catch {
      if (requested === operation.current) {
        stop();
        notify('Sound could not start. Try switching it on again.');
      }
    } finally {
      if (requested === operation.current) setStarting(false);
    }
  }, [notify, player, stop]);

  useEffect(() => {
    if (deadlineReached(current.current?.endsAt ?? null, now)) stop();
  }, [now, stop]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        // Cancel a start awaiting native audio configuration and pause a
        // running loop while preserving the original wall-clock deadline.
        operation.current += 1;
        if (current.current) clearSource();
        setStarting(false);
      } else if (deadlineReached(current.current?.endsAt ?? null, new Date())) {
        stop();
      }
    });
    return () => {
      operation.current += 1;
      subscription.remove();
    };
  }, [clearSource, stop]);

  function toggle(settings: SoundSettings) {
    if (current.current) {
      stop();
    } else {
      const { sound, volume, soundDuration } = settings;
      const next = { sound, volume, soundDuration, endsAt: soundDeadline(soundDuration, new Date()) };
      setCurrent(next);
      void play();
    }
  }

  function resume() {
    if (current.current) void play();
  }

  function applySettings(settings: SoundSettings) {
    const previous = current.current;
    if (!previous) return;
    const next = {
      sound: settings.sound,
      volume: settings.volume,
      soundDuration: settings.soundDuration,
      endsAt: settings.soundDuration === previous.soundDuration ? previous.endsAt : soundDeadline(settings.soundDuration, new Date()),
    };
    setCurrent(next);
    player.volume = next.volume / 100;
    // Leave interrupted playback paused until the user explicitly resumes it.
    if (next.sound !== previous.sound && (status.playing || starting)) void play();
  }

  const playing = !!playback && status.playing;
  const loading = !!playback && !playing && !status.error && (starting || status.isBuffering);
  return { playback, playing, loading, failed: !!playback && !!status.error, toggle, resume, stop, applySettings };
}
