import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { ColorDot, styles as controls } from './Controls.tsx';
import { theme } from './theme.ts';

export type TimeFieldProps = { label: string; accessibilityLabel?: string; dotColor?: string; value: string; onChange: (value: string) => void };

export function TimeField({ label, accessibilityLabel = label, dotColor, value, onChange }: TimeFieldProps) {
  const [hours, minutes] = value.split(':').map(Number);
  // Use a fixed, ordinary local day so editing isn't affected by today's DST shift.
  const date = new Date(2000, 0, 15, hours, minutes);
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const update = (next: Date) => onChange(`${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`);
  return (
    <View style={styles.timeRow}>
      <View style={styles.timeLabel} aria-hidden>
        {dotColor && <ColorDot color={dotColor} size={7} />}
        <Text style={controls.label}>{label}</Text>
      </View>
      {Platform.OS === 'android' ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`${accessibilityLabel}, ${time}`}
          style={({ pressed }) => [styles.timeButton, pressed && styles.pressed]}
          onPress={() => DateTimePickerAndroid.open({ value: date, mode: 'time', onValueChange: (_, next) => update(next) })}>
          <Text style={styles.timeText}>{time}</Text>
        </Pressable>
      ) : (
        <DateTimePicker accessibilityLabel={accessibilityLabel} value={date} mode="time" display="compact" themeVariant="dark" accentColor={theme.accent}
          onValueChange={(_, next) => update(next)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 51, gap: 8 },
  timeLabel: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
  timeButton: { minHeight: 44, minWidth: 80, justifyContent: 'center', alignItems: 'center', borderRadius: 9, paddingHorizontal: 8,
    backgroundColor: theme.canvas, borderWidth: 1, borderColor: theme.line },
  pressed: { backgroundColor: theme.surfacePressed },
  timeText: { color: theme.accent, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
