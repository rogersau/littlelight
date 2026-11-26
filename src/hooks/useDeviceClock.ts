import { useEffect, useId, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake, isAvailableAsync } from 'expo-keep-awake';

export function useDeviceClock() {
  const [reading, setReading] = useState(() => ({
    now: new Date(),
    appState: AppState.currentState,
  }));

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const update = (appState: typeof AppState.currentState) => {
      clearInterval(timer);
      setReading({ now: new Date(), appState });
      if (appState === 'active') {
        timer = setInterval(() => setReading({ now: new Date(), appState }), 1_000);
      }
    };
    const subscription = AppState.addEventListener('change', update);
    update(AppState.currentState);
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  return reading;
}

export function useScreenAwake(session: boolean, enabled: boolean, foreground: boolean): string {
  const id = useId();
  const generation = useRef(0);
  const wanted = session && enabled && foreground;
  const [status, setStatus] = useState<'requesting' | 'awake' | 'unavailable'>('requesting');

  useEffect(() => {
    if (!wanted) return;
    let cancelled = false;
    let acquired = false;
    const tag = `little-light-${id}-${++generation.current}`;
    const release = () => { void deactivateKeepAwake(tag).catch(() => {}); };
    setStatus('requesting');

    async function acquire() {
      try {
        if (!(await isAvailableAsync())) throw new Error('Stay-awake is unavailable');
        if (cancelled) return;
        await activateKeepAwakeAsync(tag);
        if (cancelled) {
          release();
        } else {
          acquired = true;
          setStatus('awake');
        }
      } catch {
        if (!cancelled) setStatus('unavailable');
      }
    }

    // A late result releases only its own request, never a newer activation.
    void acquire();
    return () => {
      cancelled = true;
      if (acquired) release();
    };
  }, [id, wanted]);

  if (!session) return 'Screen stay-awake is off';
  if (!enabled) return 'Stay-awake disabled';
  if (!foreground) return 'Stay-awake paused in background';
  if (status === 'awake') return 'Screen staying awake';
  if (status === 'unavailable') return 'Stay-awake unavailable · check Auto-Lock';
  return 'Requesting screen stay-awake…';
}
