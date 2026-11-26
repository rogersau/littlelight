import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { styles as controls } from './Controls.tsx';
import { theme } from './theme.ts';

export type TimeFieldProps = { label: string; value: string; onChange: (value: string) => void };

export function TimeField({ label, value, onChange }: TimeFieldProps) {
  const [hours, minutes] = value.split(':').map(Number);
  // Use a fixed, ordinary local day so editing isn't affected by today's DST shift.
  const date = new Date(2000, 0, 15, hours, minutes);
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const update = (next: Date) => onChange(`${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`);
  return (
    <View style={styles.timeRow}>
      <Text style={controls.label} accessible={false}>{label}</Text>
      {Platform.OS === 'android' ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`${label}, ${time}`} style={styles.timeButton}
          onPress={() => DateTimePickerAndroid.open({ value: date, mode: 'time', onValueChange: (_, next) => update(next) })}>
          <Text style={styles.timeText}>{time}</Text>
        </Pressable>
      ) : (
        <DateTimePicker accessibilityLabel={label} value={date} mode="time" display="compact" themeVariant="light"
          onValueChange={(_, next) => update(next)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 46, gap: 10 },
  timeButton: { minHeight: 44, minWidth: 76, justifyContent: 'center', alignItems: 'center', borderRadius: 8, paddingHorizontal: 8, backgroundColor: theme.softSage },
  timeText: { color: theme.sage, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
