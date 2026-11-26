import { memo, useId, type ReactNode } from 'react';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { Palette } from '../domain/colors.ts';
import type { Stage } from '../domain/schedule.ts';

export const STAGE_GRADIENTS = {
  sleep: [[0, '--moon-light'], [.56, '--moon-mid'], [1, '--moon-dark']],
  quiet: [[0, '--quiet-light'], [1, '--quiet-dark']],
  rise: [[0, '--rise-light'], [1, '--rise-dark']],
} as const satisfies Record<Stage, readonly (readonly [number, keyof Palette])[]>;

export function useSvgId(prefix: string) {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

export const Cue = memo(function Cue({ stage, palette, size = 38 }: { stage: Stage; palette: Palette; size?: number }) {
  const id = useSvgId('cue');
  const fill = `url(#${id})`;
  return (
    <Svg width={size} height={size} viewBox="35 15 270 270" accessible={false} fill="none">
      <Defs>
        <RadialGradient id={id} cx="30%" cy="25%" r="85%">
          {STAGE_GRADIENTS[stage].map(([offset, color]) => <Stop key={color} offset={offset} stopColor={palette[color]} />)}
        </RadialGradient>
      </Defs>
      {stage === 'sleep' && <G>
        <Path d="M215 49c-15 22-22 55-12 81 15 39 51 61 90 56-19 46-64 72-112 63-61-11-99-68-88-129 10-48 49-84 96-90 10-1 18 0 26 2Z" fill={fill} />
        <Path d="M126 156q10 13 22 1m22 17q11 11 22-2m-49 12q7 9 14 1" stroke={palette['--moon-ink']} strokeWidth={5} strokeLinecap="round" />
        <Ellipse cx={123} cy={176} rx={10} ry={6} fill={palette['--moon-cheek']} opacity={.5} />
        <Ellipse cx={191} cy={191} rx={10} ry={6} fill={palette['--moon-cheek']} opacity={.5} />
      </G>}
      {stage === 'quiet' && <G>
        <Path d="M84 188c0-50 38-90 88-90s88 40 88 90" fill={fill} />
        <Path d="M63 193h218" stroke={palette['--quiet-rays']} strokeWidth={7} strokeLinecap="round" />
        <Path d="M142 157q9-10 18 0m26 0q9-10 18 0m-39 16q8 6 16 0" stroke={palette['--quiet-ink']} strokeWidth={5} strokeLinecap="round" />
        <Path d="M172 65V45M112 82 99 65m132 0-13 17M67 137l-19-7m235 7 19-7" stroke={palette['--quiet-rays']} strokeWidth={5} strokeLinecap="round" />
      </G>}
      {stage === 'rise' && <G>
        <Path d="M170 27v20m0 207v20M47 150h20m207 0h20M83 63l14 14m146 146 14 14M83 237l14-14M243 77l14-14" stroke={palette['--rise-rays']} strokeWidth={9} strokeLinecap="round" />
        <Circle cx={170} cy={150} r={88} fill={fill} />
        <Path d="M132 143q9-13 18 0m41 0q9-13 18 0" stroke={palette['--rise-ink']} strokeWidth={5} strokeLinecap="round" />
        <Path d="M151 166q20 23 39 0" fill={palette['--rise-ink']} />
        <Path d="M159 172h22" stroke="#e7efcd" strokeWidth={5} strokeLinecap="round" />
      </G>}
    </Svg>
  );
});

export type IconName = 'sun' | 'moon' | 'lock' | 'play' | 'sound' | 'close' | 'arrow' | 'check' | 'chevron' | 'sliders' | 'clock' | 'sparkles';

const icons: Record<IconName, ReactNode> = {
  sun: <><Circle cx={12} cy={12} r={4} /><Path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
  moon: <Path d="M20.7 14.5A8.8 8.8 0 0 1 9.5 3.3a9 9 0 1 0 11.2 11.2Z" />,
  lock: <><Rect x={5} y={10} width={14} height={11} rx={3} /><Path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>,
  play: <Path d="m9 5 11 7-11 7Z" />,
  sound: <Path d="M3 9h4l5-4v14l-5-4H3Zm13 0a4.5 4.5 0 0 1 0 6m3-9a9 9 0 0 1 0 12" />,
  close: <Path d="m6 6 12 12M6 18 18 6" />,
  arrow: <Path d="M4 12h16m-6-6 6 6-6 6" />,
  check: <Path d="m5 12 4 4L19 6" />,
  chevron: <Path d="m6 9 6 6 6-6" />,
  sliders: <><Path d="M4 6h4m4 0h8M4 12h10m4 0h2M4 18h4m4 0h8" /><Circle cx={10} cy={6} r={2} /><Circle cx={16} cy={12} r={2} /><Circle cx={10} cy={18} r={2} /></>,
  clock: <><Circle cx={12} cy={12} r={9} /><Path d="M12 7v5l3 2" /></>,
  sparkles: <><Path d="M10 3l1.9 5.1L17 10l-5.1 1.9L10 17l-1.9-5.1L3 10l5.1-1.9L10 3Z" /><Path d="M19 13v7m-3.5-3.5h7m-18 1v4m-2-2h4" /></>,
};

export function Icon({ name, color, size = 21 }: { name: IconName; color: string; size?: number }) {
  return <Svg accessible={false} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">{icons[name]}</Svg>;
}
