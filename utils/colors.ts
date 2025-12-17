export function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return null;
  const num = parseInt(normalized, 16);
  if (Number.isNaN(num)) return null;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function mixColor(from: string, to: string, t: number) {
  const clamped = Math.max(0, Math.min(1, t));
  const fromRgb = hexToRgb(from);
  const toRgb = hexToRgb(to);
  if (!fromRgb || !toRgb) return to;
  const r = Math.round(fromRgb.r + (toRgb.r - fromRgb.r) * clamped);
  const g = Math.round(fromRgb.g + (toRgb.g - fromRgb.g) * clamped);
  const b = Math.round(fromRgb.b + (toRgb.b - fromRgb.b) * clamped);
  return `#${[r, g, b]
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`;
}
