import { describe, expect, it } from "vitest";
import { loaderProgress, loaderRibbonPaths } from "./experiment-loader-motion";
import { LOADER_LOGO_PARTS } from "./experiment-loader-logo";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";

describe("Menuin loader readiness", () => {
  it("reserves completion for loaded fonts and a rendered hero frame", () => {
    expect(loaderProgress(0, false, false)).toBe(0);
    expect(loaderProgress(1, true, false)).toBeCloseTo(0.94);
    expect(loaderProgress(1, false, true)).toBeLessThan(1);
    expect(loaderProgress(1, true, true)).toBe(1);
    expect(loaderProgress(Number.NaN, false, false)).toBe(0);
    expect(loaderProgress(3, true, false)).toBeCloseTo(0.94);
  });

  it.each([[480, 1440], [260, 390], [240, 844]])("creates a continuous 32px ribbon for logo %s on viewport %s", (logoWidth, viewportWidth) => {
    const paths = loaderRibbonPaths(logoWidth, viewportWidth);
    expect(paths).toHaveLength(LOADER_LOGO_PARTS.length);
    const bounds = paths.map(d => {
      const raw = MorphSVGPlugin.stringToRawPath(d)[0];
      const x = raw.filter((_, index) => index % 2 === 0);
      const y = raw.filter((_, index) => index % 2 === 1);
      return { min: Math.min(...x), max: Math.max(...x), height: Math.max(...y) - Math.min(...y) };
    });
    const pixelScale = logoWidth / 1080;
    const ribbonWidth = (bounds.at(-1)!.max - bounds[0].min) * pixelScale;
    expect(ribbonWidth).toBeGreaterThanOrEqual(viewportWidth);
    bounds.forEach((bound, index) => {
      expect(bound.height * pixelScale).toBeCloseTo(32);
      if (index > 0) expect(bound.min).toBeLessThan(bounds[index - 1].max);
    });
    paths.forEach((path, index) => {
      const normalized = MorphSVGPlugin.normalizeStrings(LOADER_LOGO_PARTS[index].d, path, { map: "position" });
      expect(normalized).toHaveLength(2);
      expect(normalized.join()).not.toContain("NaN");
    });
  });
});
