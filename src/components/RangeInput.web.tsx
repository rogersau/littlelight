import type { RangeInputProps } from './RangeInput.tsx';
import { theme } from './theme.ts';

export function RangeInput({ label, value, min, max, step, hint, onValueChange }: RangeInputProps) {
  return <input type="range" aria-label={label} aria-description={hint} aria-valuetext={value + '%'}
    value={value} min={min} max={max} step={step} onChange={event => onValueChange(event.currentTarget.valueAsNumber)}
    style={{ width: '100%', height: 44, margin: 0, accentColor: theme.sage }} />;
}
