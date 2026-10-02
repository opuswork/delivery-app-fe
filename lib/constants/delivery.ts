/** Palette for the 납품처 badge colour, in picker order (two rows of six). */
export const BADGE_COLORS = [
  "#1DA1F2",
  "#EF4444",
  "#F06292",
  "#F98A1B",
  "#FFC107",
  "#16C784",
  "#52C41A",
  "#2CCFD3",
  "#64A0F5",
  "#2F6BDB",
  "#9B6BF0",
  "#A8A8A8",
] as const;

/** New 납품처 without a colour of their own, and records saved with none. */
export const DEFAULT_BADGE_COLOR: string = BADGE_COLORS[0];

/** The colour a delivery's badge is drawn in. */
export function badgeColorOf(record: { badge_color: string }): string {
  return record.badge_color || DEFAULT_BADGE_COLOR;
}

/** Dark text on light colours (yellow, grey), white on the rest. */
export function badgeTextColor(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.6 ? "#1E293B" : "#FFFFFF";
}
