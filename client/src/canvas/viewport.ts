export interface Viewport {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

export const DEFAULT_VIEWPORT: Viewport = { offsetX: 0, offsetY: 0, zoom: 1 };
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;
