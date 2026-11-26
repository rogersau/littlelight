import type { CSSProperties } from 'react';
import type { TimeFieldProps } from './TimeField.tsx';
import { theme } from './theme.ts';

export function TimeField({ label, accessibilityLabel = label, dotColor, value, onChange }: TimeFieldProps) {
  return (
    <label style={row}>
      <span style={caption}>
        {dotColor && <span aria-hidden style={{ flexShrink: 0, width: 7, height: 7, borderRadius: '50%', margin: 3,
          backgroundColor: dotColor, boxShadow: `0 0 0 3px ${dotColor}24` }} />}
        {label}
      </span>
      <input type="time" aria-label={accessibilityLabel} required value={value} style={input}
        onChange={event => { if (event.currentTarget.value) onChange(event.currentTarget.value); }} />
    </label>
  );
}

const row: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 51,
  gap: 8, fontFamily: 'system-ui, sans-serif', fontSize: 14, fontWeight: 600, color: theme.ink,
};
const caption: CSSProperties = { display: 'flex', alignItems: 'center', gap: 7 };
const input: CSSProperties = {
  boxSizing: 'border-box', minHeight: 44, padding: '6px 8px', border: `1px solid ${theme.line}`,
  borderRadius: 9, color: theme.accent, backgroundColor: theme.canvas, colorScheme: 'dark', font: 'inherit', fontVariantNumeric: 'tabular-nums',
};
