import type { CSSProperties } from 'react';
import type { RangeInputProps } from './RangeInput.tsx';
import { theme } from './theme.ts';

const track = 'height:6px;border-radius:999px;background:var(--little-light-track);';
const thumb = `width:20px;height:20px;border-radius:50%;border:1px solid ${theme.accentInk};background:${theme.accent};`;
const sliderStyles = `
  .little-light-range::-webkit-slider-runnable-track { ${track} }
  .little-light-range::-moz-range-track { ${track} }
  .little-light-range::-webkit-slider-thumb { -webkit-appearance:none;appearance:none;margin-top:-7px;${thumb} }
  .little-light-range::-moz-range-thumb { ${thumb} }
  @media (forced-colors: active) { .little-light-range { appearance:auto !important; } }
`;

export function RangeInput({ label, value, min, max, step, hint, onValueChange }: RangeInputProps) {
  const percent = ((value - min) / (max - min)) * 100;
  const style: CSSProperties & { '--little-light-track': string } = {
    width: '100%', height: 44, margin: 0, appearance: 'none', WebkitAppearance: 'none', background: 'transparent', colorScheme: 'dark',
    accentColor: theme.accent, cursor: 'pointer',
    '--little-light-track': `linear-gradient(to right, ${theme.accent} ${percent}%, ${theme.line} ${percent}%)`,
  };
  return <>
    <style>{sliderStyles}</style>
    <input className="little-light-range" type="range" aria-label={label} aria-description={hint} aria-valuetext={value + '%'}
      value={value} min={min} max={max} step={step} onChange={event => onValueChange(event.currentTarget.valueAsNumber)} style={style} />
  </>;
}
