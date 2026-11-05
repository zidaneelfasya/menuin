import { describe, expect, it } from "vitest";
import { pricingScrollOffset, sampleExtendedStory } from "./device-story-motion";

describe("sampleExtendedStory multi-scene transitions", () => {
  it("starts on the device morph scene and keeps future scenes hidden", () => {
    const frame = sampleExtendedStory(0);
    expect(frame.story.p).toBe(0);
    expect(frame.teaserAlpha).toBe(0);
    expect(frame.pricingAlpha).toBe(0);
  });

  it("settles FeatureGridMinimal in place when device morph completes", () => {
    const frame = sampleExtendedStory(0.52);
    expect(frame.story.nextTitle).toBe(1);
    expect(frame.story.nextContent).toBe(1);
    expect(frame.gridAlpha).toBe(1);
    expect(frame.gridDarken).toBe(0);
    expect(frame.gridInteractive).toBe(true);
    expect(frame.teaserAlpha).toBe(0);
  });

  it("transitions smoothly from FeatureGridMinimal to FeatureTeaser", () => {
    // Before transition starts
    const rest = sampleExtendedStory(0.60);
    expect(rest.gridAlpha).toBe(1);
    expect(rest.gridDarken).toBe(0);
    expect(rest.teaserAlpha).toBe(0);

    // Mid transition
    const mid = sampleExtendedStory(0.70);
    expect(mid.gridDarken).toBeGreaterThan(0.5);
    expect(mid.gridAlpha).toBeLessThan(0.5);
    expect(mid.teaserTitle).toBeGreaterThan(0.5);
    expect(mid.teaserAlpha).toBeGreaterThan(0.5);

    // Completed transition
    const arrived = sampleExtendedStory(0.78);
    expect(arrived.gridAlpha).toBe(0);
    expect(arrived.gridDarken).toBe(1);
    expect(arrived.teaserTitle).toBe(1);
    expect(arrived.teaserContent).toBe(1);
    expect(arrived.teaserAlpha).toBe(1);
    expect(arrived.teaserInteractive).toBe(true);
  });

  it("transitions smoothly from FeatureTeaser to PricingSection", () => {
    // Mid transition
    const mid = sampleExtendedStory(0.91);
    expect(mid.teaserDarken).toBeGreaterThan(0.5);
    expect(mid.teaserAlpha).toBeLessThan(0.5);
    expect(mid.pricingTitle).toBeGreaterThan(0.5);
    expect(mid.pricingAlpha).toBeGreaterThan(0.5);

    // Completed transition at pricing rest
    const arrived = sampleExtendedStory(0.98);
    expect(arrived.teaserAlpha).toBe(0);
    expect(arrived.teaserDarken).toBe(1);
    expect(arrived.pricingTitle).toBe(1);
    expect(arrived.pricingContent).toBe(1);
    expect(arrived.pricingAlpha).toBe(1);
    expect(arrived.pricingInteractive).toBe(true);
  });

  it("reverses seeking cleanly without state leakage", () => {
    const forward = sampleExtendedStory(0.70);
    sampleExtendedStory(1.0);
    sampleExtendedStory(0.2);
    const backward = sampleExtendedStory(0.70);
    expect(backward).toEqual(forward);
  });

  it("brings pricing into view during the teaser exit and returns it to normal flow", () => {
    for (const scrollDistance of [17.5, 20.5]) {
      const position = (progress: number) => 0.35 + (1 - progress) * scrollDistance
        + pricingScrollOffset(progress, scrollDistance, 1);

      expect(position(0.91)).toBeLessThan(0.9);
      expect(position(0.96)).toBeLessThan(position(0.91));
      expect(pricingScrollOffset(1, scrollDistance, 1)).toBe(0);
      expect(position(1)).toBeCloseTo(0.35);
    }
  });
});
