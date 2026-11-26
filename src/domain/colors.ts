/** Direct color interpolation for the clock artwork, never a filter on text. */
export const DEFAULT_COLOR_INTENSITY = 70;
export const LEGACY_COLOR_INTENSITY = 0;
const COLORS = {
  '--moon-light': ['#e79b85', '#ff6358'],
  '--moon-mid': ['#d57e6a', '#f12c35'],
  '--moon-dark': ['#b95f56', '#cc1027'],
  '--moon-ink': ['#784d46', '#651222'],
  '--moon-cheek': ['#f4b0a0', '#ff9690'],
  '--quiet-light': ['#f4d28d', '#fff35a'],
  '--quiet-dark': ['#d6a64f', '#eacd0c'],
  '--quiet-ink': ['#8a713e', '#625300'],
  '--quiet-rays': ['#dac181', '#f9e12f'],
  '--rise-light': ['#bdd5a4', '#68ed80'],
  '--rise-dark': ['#83a779', '#13bd49'],
  '--rise-ink': ['#526c47', '#125b2d'],
  '--rise-rays': ['#a3bf89', '#3bde66'],
  '--sleep-bg': ['#352b2b', '#470e17'],
  '--quiet-bg': ['#3b362a', '#403a09'],
  '--rise-bg': ['#29382e', '#0c3c22'],
  '--sleep-accent': ['#d29281', '#ff7b78'],
  '--quiet-accent': ['#d3b370', '#f9e744'],
  '--rise-accent': ['#adc69a', '#64ef91'],
  '--red': ['#c98473', '#ef3541'],
  '--yellow': ['#d9b76c', '#eed329'],
  '--green': ['#97ad83', '#28c658'],
} as const;
export type Palette = Record<keyof typeof COLORS, string>;

function interpolate(a: string, b: string, amount: number): string {
  const channels = [1, 3, 5].map(offset => {
    const start = parseInt(a.slice(offset, offset + 2), 16);
    const end = parseInt(b.slice(offset, offset + 2), 16);
    return Math.round(start + (end - start) * amount).toString(16).padStart(2, '0');
  });
  return `#${channels.join('')}`;
}
/** Return a fresh palette; brightness and text styles are deliberately absent. */
export function getColorPalette(intensity = DEFAULT_COLOR_INTENSITY): Palette {
  const safe = Number.isFinite(intensity) ? Math.min(100, Math.max(0, intensity)) : DEFAULT_COLOR_INTENSITY;
  return Object.fromEntries(Object.entries(COLORS).map(([key, [gentle, vivid]]) => [key, interpolate(gentle, vivid, safe / 100)])) as Palette;
}
