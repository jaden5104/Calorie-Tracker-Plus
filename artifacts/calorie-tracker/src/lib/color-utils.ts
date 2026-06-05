import { ColorRange } from "../hooks/use-calorie-data";

export function getContrastColor(hexColor: string): string {
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#ffffff';
}

export function getColorForCalories(calories: number, ranges: ColorRange[]): ColorRange {
  for (const range of ranges) {
    if (calories >= range.min && (range.max === null || calories <= range.max)) {
      return range;
    }
  }
  return ranges[ranges.length - 1];
}
