import { describe, expect, it } from "vitest";
import { extendedStoryProgress, pricingScrollOffset, sampleExtendedStory, storyScrollPosition } from "./device-story-motion";

describe("extended device story transitions", () => {
  it.each([[20.5, 17.548], [17.5, 14.98]])(
    "preserves device scroll positions while shortening later transitions (%s to %s viewports)",
    (oldDistance, newDistance) => {
      const deviceDistance = oldDistance * 0.52;
      for (const deviceProgress of [0, 0.39, 0.51, 0.69, 0.78, 0.87, 1]) {
        const actualScroll = storyScrollPosition(deviceProgress) * deviceDistance;
        const logical = extendedStoryProgress(actualScroll / newDistance, newDistance, deviceDistance);
        const original = actualScroll / oldDistance;
        expect(logical).toBeCloseTo(original, 12);
        expect(sampleExtendedStory(logical).deviceProgress).toBeCloseTo(sampleExtendedStory(original).deviceProgress, 12);
      }
      const at = (logical: number) => deviceDistance + (logical - 0.52) / 0.48 * (newDistance - deviceDistance);
      expect(at(0.76) - at(0.64)).toBeCloseTo((0.76 - 0.64) * oldDistance * 0.7, 12);
      expect(at(0.96) - at(0.86)).toBeCloseTo((0.96 - 0.86) * oldDistance * 0.7, 12);
      for (const logical of [0.52, 0.64, 0.76, 0.86, 0.96, 1]) {
        expect(extendedStoryProgress(at(logical) / newDistance, newDistance, deviceDistance)).toBeCloseTo(logical, 12);
      }
    },
  );
  it("preserves the device-to-grid handoff and holds the grid before the next transition", () => {
    const frame = sampleExtendedStory(0.52);
    expect(frame.story.nextTitle).toBe(1);
    expect(frame.story.nextContent).toBe(1);
    expect(frame.gridAlpha).toBe(1);
    expect(frame.gridInteractive).toBe(true);
    expect(frame.teaserVisible).toBe(false);
    expect(frame.pricingVisible).toBe(false);
  });

  it.each([
    { start: 0.64, duration: 0.12, outgoing: "gridAlpha", title: "teaserTitle", content: "teaserContent", incoming: "teaserAlpha" },
    { start: 0.86, duration: 0.10, outgoing: "teaserAlpha", title: "pricingTitle", content: "pricingContent", incoming: "pricingAlpha" },
  ] as const)("uses the same overlapping rise for the transition at $start", ({ start, duration, outgoing, title, content, incoming }) => {
    const before = sampleExtendedStory(start - 0.001);
    const early = sampleExtendedStory(start + duration * 0.2);
    const mid = sampleExtendedStory(start + duration * 0.5);
    const end = sampleExtendedStory(start + duration);
    expect(before[outgoing]).toBe(1);
    expect(before[incoming]).toBe(0);
    expect(early[outgoing]).toBeGreaterThan(0);
    expect(early[title]).toBeGreaterThan(early[content]);
    expect(early[incoming]).toBe(1);
    expect(mid[outgoing]).toBeLessThan(0.05);
    expect(mid[title]).toBeGreaterThan(mid[content]);
    expect(end[outgoing]).toBe(0);
    expect(end[title]).toBe(1);
    expect(end[content]).toBe(1);
  });

  it("is continuous and reversible across the transition boundaries", () => {
    for (const boundary of [0.64, 0.646, 0.7036, 0.76, 0.86, 0.865, 0.913, 0.96]) {
      const before = sampleExtendedStory(boundary - 0.00001);
      const after = sampleExtendedStory(boundary + 0.00001);
      for (const key of ["gridAlpha", "teaserTitle", "teaserContent", "pricingTitle", "pricingContent"] as const) {
        expect(Math.abs(before[key] - after[key])).toBeLessThan(0.002);
      }
    }
    // Teaser opacity becomes visible while both of its translated parts are offscreen.
    expect(sampleExtendedStory(0.64).teaserTitle).toBe(0);
    expect(sampleExtendedStory(0.64).teaserContent).toBe(0);
    const forward = sampleExtendedStory(0.70);
    sampleExtendedStory(1);
    expect(sampleExtendedStory(0.70)).toEqual(forward);
  });

  it("keeps pricing anchored during its entrance and returns it to normal flow", () => {
    for (const distance of [17.5, 20.5]) {
      for (const progress of [0.86, 0.91, 0.96, 1]) {
        const top = (1 - progress) * distance + pricingScrollOffset(progress, distance);
        expect(top).toBeCloseTo(0);
      }
      expect(pricingScrollOffset(1, distance)).toBe(0);
    }
    expect(sampleExtendedStory(0.96).pricingInteractive).toBe(true);
  });
});
