import { memo, useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Line, Path, RadialGradient, Stop } from 'react-native-svg';
import type { Palette } from '../domain/colors.ts';
import type { Stage } from '../domain/schedule.ts';
import { STAGE_GRADIENTS, useSvgId } from './Illustrations.tsx';

type SceneProps = { palette: Palette; fill: string; horizon: string; accent: string };

function Twinkle({ x, y, size, color, opacity = 1 }: { x: number; y: number; size: number; color: string; opacity?: number }) {
  return <G transform={`translate(${x} ${y}) scale(${size / 10})`} opacity={opacity}>
    <Path d="M0-10Q1.5-1.5 8 0 1.5 1.5 0 10-1.5 1.5-8 0-1.5-1.5 0-10Z" fill={color} />
  </G>;
}

function Sleep({ palette, fill, horizon, accent }: SceneProps) {
  const ink = palette['--moon-ink'];
  const cheek = palette['--moon-cheek'];
  return <>
    <Twinkle x={221} y={105} size={14} color={cheek} opacity={.9} />
    <Twinkle x={249} y={149} size={8} color={palette['--moon-light']} />
    <Twinkle x={90} y={82} size={7} color={accent} opacity={.65} />
    <Twinkle x={63} y={198} size={5} color={accent} opacity={.75} />
    <Circle cx={191} cy={130} r={1.6} fill={cheek} opacity={.65} />
    <Circle cx={210} cy={151} r={2} fill={accent} opacity={.45} />
    <Circle cx={246} cy={85} r={1.8} fill={accent} opacity={.62} />
    <Path d="M74 226Q86 207 107 215c9-20 31-23 46-9 10-11 31-10 42 2q26-11 43 9c18-3 29 6 33 17-26 9-145 19-197-8Z" fill={horizon} opacity={.62} />
    <Path d="M184 65C139 55 90 79 73 124c-20 54 10 105 60 119 49 14 96-10 114-52-35 15-78-3-93-38-14-34 1-69 30-88Z"
      fill={fill} stroke={cheek} strokeOpacity={.53} strokeWidth={1.25} />
    <Path d="M82 130c13-34 43-54 73-57M177 216c17 2 35-3 50-15" fill="none" stroke={cheek} strokeWidth={2.1} strokeLinecap="round" opacity={.48} />
    <Circle cx={105} cy={124} r={5.1} fill={palette['--moon-dark']} opacity={.3} />
    <Circle cx={113} cy={105} r={2.2} fill={palette['--moon-dark']} opacity={.26} />
    <Circle cx={190} cy={219} r={3.4} fill={palette['--moon-dark']} opacity={.34} />
    <Ellipse cx={93} cy={171} rx={11} ry={5.7} fill={cheek} opacity={.82} transform="rotate(13 93 171)" />
    <Ellipse cx={153} cy={193} rx={11} ry={5.7} fill={cheek} opacity={.82} transform="rotate(15 153 193)" />
    <Path d="M92 151q6 12 18 6m22 9q7 12 19 7m-36 9q4 8 11 5" fill="none" stroke={ink} strokeWidth={3.8} strokeLinecap="round" />
    <Path d="m98 157-3 3m43 13-3 3" stroke={ink} opacity={.75} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M63 238c8-11 19-14 32-9 8-15 28-17 39-6 15-18 39-18 55-2 16-8 32-3 40 8 14-3 29 1 34 11-54 17-145 19-200-2Z" fill={horizon} />
    <Path d="M65 237c8-10 18-13 30-8 8-15 28-17 39-6 15-18 39-18 55-2 16-8 32-3 40 8 13-3 26 0 32 9"
      fill="none" stroke={accent} strokeOpacity={.35} strokeWidth={1.5} strokeLinecap="round" />
    <Path d="M100 246q18 4 37 4m60-9q12 1 24-3" fill="none" stroke={cheek} strokeOpacity={.22} strokeWidth={1.5} strokeLinecap="round" />
    <Path d="M181 145l8-2-6 10 8-2m7-22 10-3-7 12 10-3" fill="none" stroke={cheek} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={.7} />
  </>;
}

function Quiet({ palette, fill, horizon, accent }: SceneProps) {
  const ink = palette['--quiet-ink'];
  const light = palette['--quiet-light'];
  return <>
    <Twinkle x={84} y={104} size={7} color={light} opacity={.7} />
    <Twinkle x={226} y={89} size={10} color={light} opacity={.8} />
    <Circle cx={252} cy={132} r={2.2} fill={accent} opacity={.65} />
    <Circle cx={68} cy={147} r={2.1} fill={light} opacity={.62} />
    <Circle cx={112} cy={67} r={1.6} fill={accent} opacity={.55} />
    <Path d="M107 146a64 64 0 0 1 105 0" fill="none" stroke={accent} strokeWidth={13} opacity={.13} />
    <Path d="M160 84V64m-37 28-8-15m82 15 8-15M94 115l-13-10m145 10 13-10M78 155l-12-4m176 4 12-4M76 184H62m182 0h14"
      fill="none" stroke={palette['--quiet-rays']} strokeWidth={4.5} strokeLinecap="round" />
    <Path d="M87 187a73 73 0 1 1 146 0v23H87Z" fill={fill} stroke={light} strokeOpacity={.55} strokeWidth={1.3} />
    <Path d="M98 153c16-29 45-40 69-40" fill="none" stroke="#fff0c5" strokeWidth={2} strokeLinecap="round" opacity={.55} />
    <Path d="M124 161q7-10 15 0m41 0q7-10 15 0m-48 11q13 15 27 0" fill="none" stroke={ink} strokeWidth={3.5} strokeLinecap="round" />
    <Ellipse cx={121} cy={174} rx={8} ry={4.3} fill={palette['--quiet-dark']} opacity={.75} />
    <Ellipse cx={199} cy={174} rx={8} ry={4.3} fill={palette['--quiet-dark']} opacity={.75} />
    <Path d="M55 207c20-7 27-18 49-18 20 0 31 13 47 13 20 0 30-13 48-13 23 0 30 11 66 17-6 15-35 36-57 48-47 19-111 10-153-47Z" fill={horizon} />
    <Path d="M55 207c20-7 27-18 49-18 20 0 31 13 47 13 20 0 30-13 48-13 23 0 30 11 66 17" fill="none" stroke={accent} strokeWidth={1.7} strokeLinecap="round" opacity={.8} />
    <Path d="M74 224q23-10 50-3 20 6 40 4 29-3 48-8 16-4 30 2M109 244q24-7 49-2t51-5" fill="none" stroke={light} strokeWidth={1.5} strokeLinecap="round" opacity={.3} />
  </>;
}

const MORNING_RAYS = Array.from({ length: 12 }, (_, i) => {
  const angle = i * Math.PI / 6 - Math.PI / 2;
  const from = 85;
  const to = i % 2 === 0 ? 108 : 98;
  return { x1: 160 + from * Math.cos(angle), y1: 158 + from * Math.sin(angle),
    x2: 160 + to * Math.cos(angle), y2: 158 + to * Math.sin(angle), long: to === 108 };
});

const ease = Easing.inOut(Easing.sin);
// Ease each half of a single 4.5-second timing so the loop can stay on the native driver.
const breathe = (progress: number) => progress < .5 ? ease(progress * 2) / 2 : .5 + ease(progress * 2 - 1) / 2;

function Rise({ palette, fill, accent }: SceneProps) {
  const light = palette['--rise-light'];
  const ink = palette['--rise-ink'];
  return <>
    <Twinkle x={82} y={86} size={11} color={light} opacity={.8} />
    <Twinkle x={234} y={82} size={10} color={light} opacity={.85} />
    <Twinkle x={251} y={217} size={8} color={light} opacity={.74} />
    <Twinkle x={82} y={229} size={8} color={light} opacity={.72} />
    <Circle cx={105} cy={58} r={2} fill={accent} opacity={.52} />
    <Circle cx={257} cy={105} r={2} fill={accent} opacity={.55} />
    <Circle cx={67} cy={199} r={1.8} fill={light} opacity={.6} />
    <Circle cx={217} cy={248} r={2} fill={accent} opacity={.56} />
    <Circle cx={160} cy={158} r={71} fill="none" stroke={accent} strokeWidth={14} opacity={.14} />
    {MORNING_RAYS.map(({ long, ...ray }, i) => <Line key={i} {...ray} stroke={palette['--rise-rays']}
      strokeWidth={long ? 6 : 4.5} strokeLinecap="round" opacity={long ? 1 : .86} />)}
    <Circle cx={160} cy={158} r={71} fill={fill} stroke={light} strokeWidth={1.5} strokeOpacity={.64} />
    <Path d="M100 140c7-20 23-36 45-42m37 118q19-6 30-23" fill="none" stroke="#edfbd4" strokeWidth={2} strokeLinecap="round" opacity={.52} />
    <Path d="M124 135q6-6 13-3m45 0q7-3 13 3" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" opacity={.84} />
    <Ellipse cx={133} cy={151} rx={6.3} ry={9} fill={ink} />
    <Ellipse cx={187} cy={151} rx={6.3} ry={9} fill={ink} />
    <Circle cx={131.3} cy={147.7} r={2.15} fill="#f7ffe7" />
    <Circle cx={185.3} cy={147.7} r={2.15} fill="#f7ffe7" />
    <Ellipse cx={119} cy={170} rx={9.8} ry={4.9} fill="#f2d999" opacity={.69} />
    <Ellipse cx={201} cy={170} rx={9.8} ry={4.9} fill="#f2d999" opacity={.69} />
    <Path d="M141 169q19 8 38 0c-1 13-8 22-19 22s-18-9-19-22Z" fill={ink} />
    <Path d="M151 185q9-6 18 0-9 6-18 0Z" fill={light} opacity={.88} />
  </>;
}

export const Lantern = memo(function Lantern({ stage, palette, size, animated = true }: {
  stage: Stage; palette: Palette; size: number; animated?: boolean;
}) {
  const id = useSvgId('lantern');
  const [pulse] = useState(() => new Animated.Value(0));
  const [motion, setMotion] = useState(false);
  const accent = palette[`--${stage}-accent`];
  const backdrop = palette[`--${stage}-bg`];
  const inner = size * 268 / 320;
  const canAnimate = animated && motion;

  useEffect(() => {
    if (!animated) return;
    let active = true;
    let preferenceChanged = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', reduced => {
      preferenceChanged = true;
      setMotion(!reduced);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (active && !preferenceChanged) setMotion(!reduced);
    }).catch(() => {});
    return () => {
      active = false;
      subscription.remove();
    };
  }, [animated]);

  useEffect(() => {
    if (!canAnimate) return;
    const loop = Animated.loop(Animated.timing(pulse, {
      toValue: 1, duration: 4500, easing: breathe,
      useNativeDriver: Platform.OS !== 'web', isInteraction: false,
    }));
    loop.start();
    return () => {
      loop.stop();
      pulse.setValue(0);
    };
  }, [canAnimate, pulse]);

  const artwork = { palette, accent, fill: `url(#${id}-character)`, horizon: `url(#${id}-horizon)` };

  return (
    <View aria-hidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={[styles.lantern, { width: size, height: size }]}>
      <Animated.View style={[StyleSheet.absoluteFill, canAnimate && {
        opacity: pulse.interpolate({ inputRange: [0, .5, 1], outputRange: [.78, 1, .78] }),
        transform: [{ scale: pulse.interpolate({ inputRange: [0, .5, 1], outputRange: [1, 1.05, 1] }) }],
      }]}>
        <Svg width={size} height={size} viewBox="0 0 320 320">
          <Defs>
            <RadialGradient id={`${id}-halo`}>
              <Stop offset={0} stopColor={accent} stopOpacity={.42} />
              <Stop offset={.76} stopColor={accent} stopOpacity={.37} />
              <Stop offset={.86} stopColor={accent} stopOpacity={.22} />
              <Stop offset={1} stopColor={accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={160} cy={160} r={160} fill={`url(#${id}-halo)`} />
        </Svg>
      </Animated.View>
      <View style={[styles.ring, { width: inner, height: inner, borderRadius: inner / 2, borderColor: accent + '82', backgroundColor: backdrop }]} />
      <Svg width={size} height={size} viewBox="0 0 320 320" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id={`${id}-glass`} cx="45%" cy="37%" r="70%">
            <Stop offset={0} stopColor={accent} stopOpacity={.24} />
            <Stop offset={.65} stopColor={accent} stopOpacity={.10} />
            <Stop offset={1} stopColor="#110d18" stopOpacity={.57} />
          </RadialGradient>
          <RadialGradient id={`${id}-character`} cx="32%" cy="24%" r="86%">
            {STAGE_GRADIENTS[stage].map(([offset, color]) => <Stop key={color} offset={offset} stopColor={palette[color]} />)}
          </RadialGradient>
          <LinearGradient id={`${id}-horizon`} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset={0} stopColor={accent} stopOpacity={.5} />
            <Stop offset={1} stopColor={backdrop} />
          </LinearGradient>
        </Defs>
        <Circle cx={160} cy={160} r={132} fill={`url(#${id}-glass)`} />
        <Circle cx={160} cy={160} r={129} fill="none" stroke="#fff3dc" strokeWidth={.85} opacity={.16} />
        <Path d="M48 125a117 117 0 0 1 92-81m126 166a117 117 0 0 1-76 63"
          stroke="#fff3dc" strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={.29} />
        {stage === 'sleep' ? <Sleep {...artwork} /> : stage === 'quiet' ? <Quiet {...artwork} /> : <Rise {...artwork} />}
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  lantern: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  ring: { borderWidth: 1.5 },
});
