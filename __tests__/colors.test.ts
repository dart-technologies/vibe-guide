import { describe, expect, it } from 'vitest';
import { hexToRgb, mixColor } from '../utils/colors';

describe('color utilities', () => {
  it('parses hex to rgb', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb('#zzzzzz')).toBeNull();
    expect(hexToRgb('#123')).toBeNull();
  });

  it('mixes colors between two hex values', () => {
    expect(mixColor('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mixColor('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(mixColor('#000000', '#ffffff', 0.5)).toBe('#808080');
    // Clamps out-of-range values
    expect(mixColor('#000000', '#ffffff', 2)).toBe('#ffffff');
  });
});
