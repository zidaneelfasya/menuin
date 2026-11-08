import { LOADER_LOGO_BOX, LOADER_LOGO_PARTS } from "./experiment-loader-logo";

export const LOADER_RIBBON_HEIGHT = 32;
// The two curtains overlap by one pixel before the ribbon opens.
export const LOADER_CURTAIN_REVEAL_OFFSET = LOADER_RIBBON_HEIGHT / 2 + 1;

export function loaderProgress(assets: number, fontsReady: boolean, sceneReady: boolean) {
  if (fontsReady && sceneReady) return 1;
  const loaded = Number.isFinite(assets) ? Math.min(1, Math.max(0, assets)) : 0;
  return loaded * 0.88 + Number(fontsReady) * 0.06 + Number(sceneReady) * 0.04;
}

export function loaderRibbonPaths(logoWidth: number, viewportWidth: number) {
  const { x, y, width, height } = LOADER_LOGO_BOX;
  const unitsPerPixel = width / Math.max(1, logoWidth);
  const left = x - Math.max(0, viewportWidth - logoWidth) * unitsPerPixel / 2 - unitsPerPixel;
  const ribbonWidth = Math.max(viewportWidth, logoWidth) * unitsPerPixel + 2 * unitsPerPixel;
  const halfHeight = LOADER_RIBBON_HEIGHT / 2 * unitsPerPixel;
  const centerY = y + height / 2;

  return LOADER_LOGO_PARTS.map(part => {
    const a = left + (part.left - x) / width * ribbonWidth;
    const b = left + (part.right - x) / width * ribbonWidth + unitsPerPixel * 1.5;
    const top = centerY - halfHeight;
    const bottom = centerY + halfHeight;
    const centerX = (a + b) / 2;
    // The e's counter shrinks in place as the letter becomes a solid ribbon segment.
    const counter = part.hole ? ` M${centerX},${centerY} C${centerX},${centerY} ${centerX},${centerY} ${centerX},${centerY} Z` : "";
    return `M${a},${top} H${b} V${bottom} H${a} Z${counter}`;
  });
}
