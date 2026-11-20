export const DEFAULT_CATEGORY_ACCENT = "#8C8680";

// Returns a valid hex color, or the default if none was set.
export function accentOf(accent: string | null | undefined): string {
  return accent && /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : DEFAULT_CATEGORY_ACCENT;
}

// Darker shade of the same color (used for button hover).
export function darken(hex: string, amount = 0.2): string {
  const h = accentOf(hex).slice(1);
  const channel = (i: number) => {
    const v = parseInt(h.slice(i, i + 2), 16);
    return Math.round(v * (1 - amount)).toString(16).padStart(2, "0");
  };
  return `#${channel(0)}${channel(2)}${channel(4)}`;
}