import { describe, expect, it } from "vitest";
import { MENUIN_FEATURES } from "./feature-teaser";

describe("MENUIN_FEATURES configuration", () => {
  it("contains all 8 killer features of the Menuin F&B POS ecosystem", () => {
    expect(MENUIN_FEATURES).toHaveLength(8);
    const ids = MENUIN_FEATURES.map((f) => f.id);
    expect(ids).toEqual([
      "qr-order",
      "pos",
      "multi-device",
      "shift",
      "stock",
      "reports",
      "promotions",
      "multi-outlet",
    ]);
  });

  it("ensures every feature has a valid label, icon, headline, ctaText, ctaHref, and 2 detailed items", () => {
    MENUIN_FEATURES.forEach((feature) => {
      expect(feature.label).toBeTruthy();
      expect(feature.headline).toBeTruthy();
      expect(feature.ctaText).toBeTruthy();
      expect(feature.ctaHref.startsWith("/fitur")).toBe(true);
      expect(feature.items).toHaveLength(2);
      feature.items.forEach((item) => {
        expect(item.title).toBeTruthy();
        expect(item.description).toBeTruthy();
      });
    });
  });

  it("contains unique ids, labels, and icons for all 8 features", () => {
    const ids = new Set(MENUIN_FEATURES.map((f) => f.id));
    expect(ids.size).toBe(8);

    const labels = new Set(MENUIN_FEATURES.map((f) => f.label));
    expect(labels.size).toBe(8);

    const icons = new Set(MENUIN_FEATURES.map((f) => f.icon));
    expect(icons.size).toBe(8);
  });
});
