import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, type IconName } from './Illustrations.tsx';
import { RangeInput } from './RangeInput';
import { theme } from './theme.ts';

export function Action({ label, onPress, icon, variant = 'secondary', style, disabled }: {
  label: string; onPress: () => void; icon?: IconName; variant?: 'primary' | 'secondary' | 'text' | 'danger';
  style?: StyleProp<ViewStyle>; disabled?: boolean;
}) {
  const color = variant === 'primary' ? theme.accentInk : variant === 'danger' ? theme.danger : theme.accent;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.action, variant === 'primary' && styles.primary, variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger, style, (pressed || disabled) && styles.pressed]}>
      {icon && <Icon name={icon} color={color} size={17} />}
      <Text style={[styles.actionText, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function ColorDot({ color, size = 7 }: { color: string; size?: number }) {
  const halo = size + 6;
  return <View aria-hidden style={{ width: halo, height: halo, borderRadius: halo / 2, backgroundColor: color + '24',
    alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
  </View>;
}

export function Dimmer({ brightness }: { brightness: number }) {
  return <View pointerEvents="none" aria-hidden style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: ((100 - brightness) / 100) * .65 }]} />;
}

export function Toggle({ label, description, value, onValueChange }: {
  label: string; description?: string; value: boolean; onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggle}>
      <View style={styles.toggleCopy}>
        <Text style={styles.label} accessible={false}>{label}</Text>
        {description && <Text style={styles.help} accessible={false}>{description}</Text>}
      </View>
      <Switch accessibilityLabel={label} accessibilityHint={description} value={value} onValueChange={onValueChange}
        trackColor={{ true: theme.accent, false: theme.line }} ios_backgroundColor={theme.line} />
    </View>
  );
}

export function Range({ label, value, onValueChange, min = 0, max = 100, step = 5, hint, endpoints }: {
  label: string; value: number; onValueChange: (value: number) => void; min?: number; max?: number; step?: number; hint?: string;
  endpoints?: readonly [string, string];
}) {
  return (
    <View style={styles.range}>
      <View style={styles.between}><Text style={styles.label}>{label}</Text><Text style={styles.rangeValue}>{value}%</Text></View>
      <RangeInput label={label} hint={hint} value={value} min={min} max={max} step={step} onValueChange={onValueChange} />
      {endpoints && <View style={styles.between}>{endpoints.map(endpoint => <Text key={endpoint} style={styles.help}>{endpoint}</Text>)}</View>}
    </View>
  );
}

export function Choices<T extends string | number>({ label, options, value, onChange, renderLabel, showLabel = true }: {
  label: string; options: readonly T[]; value: T; onChange: (value: T) => void; renderLabel: (value: T) => string; showLabel?: boolean;
}) {
  return (
    <View style={styles.choices}>
      {showLabel && <Text style={styles.label}>{label}</Text>}
      <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map(option => {
          const checked = option === value;
          return (
            <Pressable key={option} onPress={() => onChange(option)} accessibilityRole="radio" accessibilityState={{ checked }} aria-checked={checked}
              style={({ pressed }) => [styles.chip, checked && styles.chipSelected, pressed && styles.pressed]}>
              <Text style={[styles.chipText, checked && styles.chipTextSelected]}>{renderLabel(option)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Section({ title, initiallyExpanded = false, children }: {
  title: string; initiallyExpanded?: boolean; children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  return (
    <View style={styles.section}>
      <Pressable style={({ pressed }) => [styles.sectionHeader, pressed && styles.pressed]}
        accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(previous => !previous)}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={expanded && styles.rotated}><Icon name="chevron" color={theme.muted} size={18} /></View>
      </Pressable>
      {expanded && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

export const styles = StyleSheet.create({
  action: { minWidth: 44, minHeight: 44, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 14, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8 },
  primary: { backgroundColor: theme.accent, minHeight: 52 },
  secondary: { borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surfaceElevated },
  danger: { borderWidth: 1, borderColor: theme.dangerBorder, backgroundColor: theme.dangerBg },
  actionText: { fontSize: 14, fontWeight: '700', flexShrink: 1, textAlign: 'center' },
  pressed: { opacity: .65 },
  toggle: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  toggleCopy: { flex: 1, gap: 2 },
  label: { color: theme.ink, fontSize: 14, fontWeight: '600', flexShrink: 1 },
  help: { color: theme.muted, fontSize: 13, lineHeight: 19 },
  range: { gap: 2 },
  rangeValue: { color: theme.accent, fontVariant: ['tabular-nums'], fontSize: 13, fontWeight: '700' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  choices: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { minHeight: 44, paddingHorizontal: 13, paddingVertical: 9, justifyContent: 'center', borderRadius: 24, borderWidth: 1,
    borderColor: theme.line, backgroundColor: theme.surfaceElevated },
  chipSelected: { backgroundColor: theme.accentSoft, borderColor: theme.accent + '70' },
  chipText: { color: theme.muted, fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: theme.accent },
  section: { borderWidth: 1, borderColor: theme.line, borderRadius: 16, backgroundColor: theme.surface },
  sectionHeader: { minHeight: 52, paddingHorizontal: 15, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionTitle: { color: theme.ink, fontWeight: '700', fontSize: 16, flexShrink: 1 },
  sectionBody: { paddingHorizontal: 15, paddingBottom: 16, gap: 13 },
  rotated: { transform: [{ rotate: '180deg' }] },
});
