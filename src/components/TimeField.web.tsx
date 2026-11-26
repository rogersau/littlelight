import type { CSSProperties } from 'react';
import type { TimeFieldProps } from './TimeField.tsx';
import { theme } from './theme.ts';

export function TimeField({ label, value, onChange }: TimeFieldProps) {
  return (
    <label style={row}>
      <span>{label}</span>
      <input type="time" required value={value} style={input}
        onChange={event => { if (event.currentTarget.value) onChange(event.currentTarget.value); }} />
    </label>
  );
}

const row: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 46,
  gap: 10, fontFamily: 'system-ui, sans-serif', fontSize: 14, fontWeight: 600, color: theme.ink,
};
const input: CSSProperties = {
  boxSizing: 'border-box', minHeight: 44, padding: '6px 8px', border: `1px solid ${theme.line}`,
  borderRadius: 8, color: theme.sage, backgroundColor: theme.softSage, font: 'inherit',
};
