import { describe, expect, it } from "vitest";
import { Quaternion } from "three";
import { cardSide, exitRotation, sideRotation, type CardSide } from "./feature-card-motion";

const sides: CardSide[] = ["top", "right", "bottom", "left"];

describe("feature card direction", () => {
  it("finds each edge using the card's actual dimensions", () => {
    const rect = { left: 100, top: 50, width: 200, height: 100 };
    expect(cardSide(rect, 200, 50)).toBe("top");
    expect(cardSide(rect, 300, 100)).toBe("right");
    expect(cardSide(rect, 200, 150)).toBe("bottom");
    expect(cardSide(rect, 100, 100)).toBe("left");
    expect(cardSide(rect, 100, 50)).toBe("top");
  });

  it("returns upright continuously for every combination of entry and exit", () => {
    for (const entry of sides) {
      for (const exit of sides) {
        const start = sideRotation(entry);
        expect(exitRotation(start, exit, 0).angleTo(start)).toBeCloseTo(0, 6);
        expect(exitRotation(start, exit, 1).angleTo(new Quaternion())).toBeCloseTo(0, 6);
        for (let step = 1; step <= 20; step++) {
          expect(exitRotation(start, exit, step / 20).angleTo(exitRotation(start, exit, (step - 1) / 20))).toBeLessThan(0.5);
        }
      }
    }
  });

  it("returns upright after an interrupted entry", () => {
    const start = new Quaternion().slerp(sideRotation("left"), 0.35);
    for (const exit of sides) {
      expect(exitRotation(start, exit, 0).angleTo(start)).toBeCloseTo(0, 6);
      expect(exitRotation(start, exit, 1).angleTo(new Quaternion())).toBeCloseTo(0, 6);
    }
  });
});
