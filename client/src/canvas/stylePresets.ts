export const STROKE_COLORS = ["#F8FAFC", "#589555", "#ea8b86", "#71a2e2", "#a96624"] as const;

export const BACKGROUND_COLORS = ["#121212", "#161718", "#14171b", "#171606", "#1a1715"] as const;

export const STROKE_WIDTHS = [1, 2, 4] as const;

export const TEXT_SIZES = [
  { label: "S", value: 20 },
  { label: "M", value: 28 },
  { label: "L", value: 36 },
  { label: "XL", value: 44 },
] as const;

export const FONT_FAMILIES = ["Arial", "Georgia", "Trebuchet MS", "Courier New"] as const;

export const DEFAULT_STROKE_COLOR = STROKE_COLORS[0];
export const DEFAULT_STROKE_WIDTH = STROKE_WIDTHS[1];
export const DEFAULT_TEXT_FONT_SIZE = TEXT_SIZES[0].value;
export const DEFAULT_TEXT_FONT_FAMILY = FONT_FAMILIES[0];
export const DEFAULT_CANVAS_BACKGROUND = BACKGROUND_COLORS[0];
