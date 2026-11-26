import Slider from '@react-native-community/slider';
import { StyleSheet } from 'react-native';
import { theme } from './theme.ts';

export type RangeInputProps = {
  label: string; value: number; min: number; max: number; step: number; hint?: string;
  onValueChange: (value: number) => void;
};

export function RangeInput({ label, value, min, max, step, hint, onValueChange }: RangeInputProps) {
  return <Slider accessibilityLabel={label} accessibilityHint={hint} value={value}
    minimumValue={min} maximumValue={max} step={step} onValueChange={onValueChange}
    minimumTrackTintColor={theme.accent} maximumTrackTintColor={theme.line} thumbTintColor={theme.accent} style={styles.slider} />;
}

const styles = StyleSheet.create({ slider: { width: '100%', height: 44 } });
