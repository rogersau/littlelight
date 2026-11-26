import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, type GestureResponderEvent, type PointerEvent } from 'react-native';
import { Icon } from './Illustrations.tsx';
import { theme } from './theme.ts';

const HOLD_MS = 1500;
const MOVE_LIMIT = 10;
const isWeb = Platform.OS === 'web';

export function HoldLockButton({ accent, openSettings, promptHold }: {
  accent: string; openSettings: () => void; promptHold: () => void;
}) {
  const [progress] = useState(() => new Animated.Value(0));
  const completed = useRef(false);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const useNativeDriver = !isWeb;

  useEffect(() => () => progress.stopAnimation(), [progress]);

  function unlock() {
    if (completed.current) return;
    completed.current = true;
    progress.stopAnimation();
    progress.setValue(0);
    openSettings();
  }

  function begin() {
    completed.current = false;
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: HOLD_MS, easing: Easing.linear, useNativeDriver }).start(({ finished }) => {
      if (isWeb && finished) unlock();
    });
  }

  function goIdle() {
    if (isWeb && !pointer.current) return;
    pointer.current = null;
    progress.stopAnimation();
    if (completed.current) return;
    Animated.timing(progress, { toValue: 0, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver }).start();
  }

  function cancelPointer(event: PointerEvent) {
    if (pointer.current?.id === event.nativeEvent.pointerId) goIdle();
  }

  // Use the same lifecycle for the progress and unlock on web. RNW can cancel
  // its own long press on movement without ending the pressed state.
  const webEvents = isWeb ? {
    onPointerDown({ nativeEvent: { isPrimary, button, pointerId, clientX, clientY } }: PointerEvent) {
      if (!isPrimary || button !== 0 || pointer.current) return;
      pointer.current = { id: pointerId, x: clientX, y: clientY };
      begin();
    },
    onPointerMove({ nativeEvent: { pointerId, clientX, clientY }, currentTarget }: PointerEvent) {
      const start = pointer.current;
      if (!start || start.id !== pointerId) return;
      const bounds = currentTarget instanceof HTMLElement ? currentTarget.getBoundingClientRect() : undefined;
      // A touch pointer can stay captured by the button even outside its bounds.
      if (Math.hypot(clientX - start.x, clientY - start.y) > MOVE_LIMIT
        || (bounds && (clientX < bounds.left || clientX > bounds.right || clientY < bounds.top || clientY > bounds.bottom))) goIdle();
    },
    onPointerUp: cancelPointer,
    onPointerCancel: cancelPointer,
    onPointerLeave: cancelPointer,
    onContextMenu(event: MouseEvent<HTMLButtonElement>) {
      if (pointer.current || completed.current) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
  } : undefined;

  function handlePress(event: GestureResponderEvent) {
    // RNW renders a button whose keyboard and assistive activations send a
    // click with no pointer click count. A physical tap still needs a hold.
    if (isWeb && event.type === 'click' && 'detail' in event && event.detail === 0) {
      completed.current = false;
      unlock();
    } else if (!completed.current) {
      promptHold();
    }
  }

  return (
    <Pressable {...webEvents} accessibilityRole="button" accessibilityLabel="Hold for settings"
      accessibilityHint="Hold for one and a half seconds to open parent settings"
      accessibilityActions={[{ name: 'longpress', label: 'Open parent settings' }]}
      onAccessibilityAction={event => {
        if (event.nativeEvent.actionName === 'longpress') {
          completed.current = false;
          unlock();
        }
      }}
      delayLongPress={HOLD_MS} onPressIn={isWeb ? undefined : begin} onPressOut={goIdle} onBlur={goIdle}
      onLongPress={isWeb ? undefined : unlock} onPress={handlePress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.fill,
        { backgroundColor: accent + '3b', transform: [{ scaleX: progress }] }]} />
      <Icon name="lock" color={theme.ink} size={15} />
      <Text style={styles.label}>Hold for settings</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 44, maxWidth: '60%', paddingHorizontal: 13, paddingVertical: 8, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 7, borderRadius: 24, borderWidth: 1, borderColor: '#fff1de30', backgroundColor: '#100d162c', overflow: 'hidden' },
  pressed: { backgroundColor: '#100d1660' },
  fill: { transformOrigin: 'left center' },
  label: { color: theme.ink, fontSize: 12, fontWeight: '600', flexShrink: 1, userSelect: 'none' },
});
