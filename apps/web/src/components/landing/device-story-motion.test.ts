import { describe, expect, it } from "vitest";
import { CAROUSEL_CARD_COUNT, ORBIT_CARD_COUNT, PICKER_SLOTS, WALL_CARD_COUNT, deviceArrival, deviceCopyReveal, deviceLandingStrength, entranceWarp, galleryCardPose, galleryImageIndex, getFormatFrames, laptopNotchProgress, nearestFormat, phoneEntranceRotations, phoneFloat, phoneIslandRetraction, pickerPose, previewSize, pullFormat, sampleStory, screenTransition, stepDeviceMotion, storyProgress, storyScrollPosition, wallSlot, type FormatGesture } from "./device-story-motion";
import { GALLERY_IMAGES, PREVIEW_DEVICES } from "./device-story-devices";

describe("device story choreography", () => {
  it("grows only the laptop notch when its image is nearly full and reverses cleanly", () => {
    expect(laptopNotchProgress(0, 1)).toBe(0);
    expect(laptopNotchProgress(1, 1)).toBe(0);
    expect(laptopNotchProgress(2, 0.68)).toBe(0);
    expect(laptopNotchProgress(2, 0.83)).toBeCloseTo(0.5);
    expect(laptopNotchProgress(2, 1)).toBe(1);
    const before = laptopNotchProgress(2, pickerPose(0.87, 1.9).focus);
    expect(before).toBeGreaterThan(0);
    expect(laptopNotchProgress(2, pickerPose(0.87, 1.75).focus)).toBe(0);
    expect(laptopNotchProgress(2, pickerPose(0.87, 1.9).focus)).toBe(before);
  });
  it("retracts the dynamic island into the bezel and reverses with the device morph", () => {
    expect(phoneIslandRetraction(0)).toBe(0);
    expect(phoneIslandRetraction(0.14)).toBeCloseTo(0.5);
    expect(phoneIslandRetraction(0.28)).toBe(1);
    expect(phoneIslandRetraction(1)).toBe(1);
    expect(phoneIslandRetraction(2)).toBe(1);
    const before = phoneIslandRetraction(0.14);
    phoneIslandRetraction(1);
    expect(phoneIslandRetraction(0.14)).toBe(before);
  });
  it("gently floats only during the focused phone scene", () => {
    expect(phoneFloat(0.2, 1)).toBe(0);
    expect(phoneFloat(0.45, 1)).toBeGreaterThan(0);
    expect(phoneFloat(0.45, 4)).toBeLessThan(0);
    expect(phoneFloat(0.65, 1)).toBe(0);
  });
  it("reveals menu, cart, and order status in sequence and reverses cleanly", () => {
    expect(screenTransition(0)).toEqual({ stage: 0, rise: 0 });
    expect(screenTransition(0.25).rise).toBeGreaterThan(0);
    expect(screenTransition(0.45)).toEqual({ stage: 0, rise: 1 });
    expect(screenTransition(0.5)).toEqual({ stage: 1, rise: 0 });
    expect(screenTransition(0.75).rise).toBeGreaterThan(0);
    expect(screenTransition(1)).toEqual({ stage: 1, rise: 1 });
    const before = screenTransition(0.25);
    screenTransition(1);
    expect(screenTransition(0.25)).toEqual(before);
  });
  it("locks the phone while the internal panel moves, then hands off to export", () => {
    const early = sampleStory(0.39), late = sampleStory(0.51);
    expect(early.focus).toBe(late.focus);
    expect(early.handoff).toBe(late.handoff);
    expect(early.sheet).toBe(0);
    expect(late.sheet).toBe(1);
    expect(sampleStory(0.67).phoneAlpha).toBe(0);
    expect(sampleStory(0.67).exportAlpha).toBe(1);
  });

  it("rotates phone 360 degrees and performs mix transition directly into export preview", () => {
    expect(sampleStory(0.51).handoff).toBe(0);
    expect(sampleStory(0.56).handoff).toBeGreaterThan(0);
    expect(sampleStory(0.56).handoff).toBeLessThan(1);
    expect(sampleStory(0.61).handoff).toBe(1);
    expect(sampleStory(0.61).deviceMix).toBe(0);
    expect(sampleStory(0.635).deviceMix).toBeGreaterThan(0);
    expect(sampleStory(0.66).deviceMix).toBe(1);
    expect(sampleStory(0.61).phoneAlpha).toBe(1);
    expect(sampleStory(0.67).phoneAlpha).toBe(0);
  });

  it("starts with solid visible logo plate and reversibly resolves the optical tunnel into the triptych", () => {
    expect(sampleStory(0).phoneAlpha).toBe(1);
    expect(sampleStory(0.05).phoneAlpha).toBe(1);
    expect(entranceWarp(0)).toEqual({ k: 0, zoom: 1, source: 0 });
    expect(entranceWarp(0.04)).toEqual({ k: 0, zoom: 1, source: 0 });
    expect(entranceWarp(0.10).k).toBe(22);
    expect(entranceWarp(0.16).k).toBeLessThan(entranceWarp(0.11).k);
    expect(entranceWarp(0.20)).toEqual({ k: 0, zoom: 1, source: 1 });
    expect(sampleStory(0.21).focus).toBe(0);
    expect(sampleStory(0.21).phoneAlpha).toBe(1);
  });

  it("turns each side phone through its own outward-facing path while the center settles more slowly", () => {
    for (const p of [0.10, 0.14, 0.17, 0.19, 0.21, 0.24, 0.285, 0.33]) {
      const pose = phoneEntranceRotations(p);
      expect(Math.sin(pose.leftYaw)).toBeLessThan(0);
      expect(Math.sin(pose.rightYaw)).toBeGreaterThan(0);
      expect(pose.leftRoll).toBeGreaterThan(0);
      expect(pose.rightRoll).toBeGreaterThan(0);
    }
    const arriving = phoneEntranceRotations(0.19), leaving = phoneEntranceRotations(0.285);
    expect(Math.cos(arriving.leftYaw)).toBeLessThan(0);
    expect(Math.cos(arriving.rightYaw)).toBeGreaterThan(0);
    expect(Math.cos(leaving.leftYaw)).toBeGreaterThan(0);
    expect(Math.cos(leaving.rightYaw)).toBeLessThan(0);
    expect(phoneEntranceRotations(0.20).centerYaw).toBeLessThan(phoneEntranceRotations(0.22).centerYaw);
    expect(phoneEntranceRotations(0.22).centerYaw).toBeLessThan(0);
    expect(phoneEntranceRotations(0.24).centerYaw).toBeLessThan(0);
    expect(phoneEntranceRotations(0.285).centerYaw).toBeLessThan(0);
    expect(phoneEntranceRotations(0.32).centerYaw).toBeCloseTo(0, 12);
    expect(phoneEntranceRotations(0.24).leftYaw).toBeGreaterThan(-Math.PI / 3);
    expect(phoneEntranceRotations(0.24).rightYaw - phoneEntranceRotations(0.24).leftYaw).not.toBeCloseTo(Math.PI, 2);
    expect(phoneEntranceRotations(0.30).leftRoll).toBeGreaterThan(phoneEntranceRotations(0.20).leftRoll);
    expect(phoneEntranceRotations(0.30).rightRoll).toBeGreaterThan(phoneEntranceRotations(0.20).rightRoll);
  });

  it("uses centered, bounded endpoint frames without overshoot at every room size", () => {
    for (const [w, h] of [[280, 400], [240, 600], [800, 500], [600, 650]]) {
      getFormatFrames(w, h).forEach((frame, index) => {
        const preview = previewSize(index, w, h);
        expect(preview.width).toBeCloseTo(frame.width, 10);
        expect(preview.height).toBeCloseTo(frame.height, 10);
        expect(frame.x + frame.width / 2).toBeCloseTo(w / 2);
        expect(frame.y + frame.height / 2).toBeCloseTo(h / 2);
      });
      for (const format of [-0.35, -0.16, 2.16, 2.35]) {
        const preview = previewSize(format, w, h);
        expect(preview.width).toBeGreaterThan(0);
        expect(preview.height).toBeGreaterThan(0);
        expect(preview.width).toBeLessThan(w);
        expect(preview.height).toBeLessThan(h);
      }
      expect(previewSize(2.3, w, h)).toEqual(previewSize(2, w, h));
      expect(previewSize(-0.3, w, h)).toEqual(previewSize(0, w, h));
    }
  });

  it("makes the tablet shorter than the laptop and morphs its bezel and corners", () => {
    const [phone, tab, laptop] = getFormatFrames(800, 650);
    expect(phone.width).toBeLessThan(tab.width);
    expect(tab.width).toBeLessThan(laptop.width);
    expect(tab.width / laptop.width).toBeLessThan(0.85);
    const mid = previewSize(0.5, 800, 650);
    expect(mid.bezel).toBeCloseTo((phone.bezel + tab.bezel) / 2);
    expect(mid.radius).toBeCloseTo((phone.radius + tab.radius) / 2);
  });

  it("matches the previous phone's height including its bezel and keeps larger formats inside the room", () => {
    for (const [width, height] of [[850, 720], [700, 615], [343, 447]]) {
      const [phone, tab, laptop] = getFormatFrames(width, height);
      expect(phone.height + 2 * phone.bezel).toBeCloseTo(height - 4);
      expect(phone.height / phone.width).toBeCloseTo(1 / PREVIEW_DEVICES[0].ratio);
      for (const frame of [phone, tab, laptop]) {
        expect(frame.width + 2 * frame.bezel).toBeLessThan(width);
        expect(frame.height + 2 * frame.bezel).toBeLessThan(height);
      }
      const square = previewSize(0, width, height, 0.5);
      expect(square.width).toBeCloseTo(square.height);
      expect(square.width + 2 * square.bezel).toBeLessThan(width);
      expect(square.height + 2 * square.bezel).toBeLessThan(height);
    }
  });

  it("morphs through a centered square while each gallery is active, in either direction", () => {
    for (const [width, height] of [[800, 650], [240, 600]]) {
      const frames = getFormatFrames(width, height);
      for (const segment of [0, 1]) {
        for (const t of [0.3, 0.5, 0.68]) {
          const size = previewSize(segment, width, height, segment + t);
          expect(size.width / size.height).toBeCloseTo(1, 10);
        }
        const start = previewSize(segment, width, height, segment);
        const end = previewSize(segment + 1, width, height, segment + 1);
        expect(start.width).toBeCloseTo(frames[segment].width);
        expect(end.width).toBeCloseTo(frames[segment + 1].width);
        for (const t of [0.1, 0.3, 0.5, 0.74, 0.9]) {
          const before = previewSize(segment, width, height, segment + t - 0.00001);
          const after = previewSize(segment, width, height, segment + t + 0.00001);
          expect(Math.abs(before.width - after.width)).toBeLessThan(0.1);
          expect(Math.abs(before.height - after.height)).toBeLessThan(0.1);
        }
      }
    }
  });

  it("only lands after reaching a device and keeps its subtle overshoot within the preview", () => {
    expect(deviceArrival(0.98, 1, false)).toBe(true);
    expect(deviceArrival(1.02, 1, false)).toBe(true);
    expect(deviceArrival(0.02, 0, false)).toBe(true);
    expect(deviceArrival(0.98, 0.99, false)).toBe(false);
    expect(deviceArrival(1, 1, false)).toBe(false);
    expect(deviceArrival(0.98, 1, true)).toBe(false);
    expect(deviceLandingStrength(0.1)).toBe(0);
    expect(deviceLandingStrength(1)).toBeGreaterThan(0);
    expect(deviceLandingStrength(3)).toBeCloseTo(0.018);
    for (const [width, height] of [[800, 650], [240, 600]]) {
      for (const device of [0, 1, 2]) {
        const settled = previewSize(device, width, height, device);
        const landing = previewSize(device, width, height, device, 0.018);
        if (device === 0) {
          expect(landing.width).toBeLessThan(settled.width);
          expect(landing.height).toBeGreaterThan(settled.height);
        } else {
          expect(landing.width).toBeGreaterThanOrEqual(settled.width);
          expect(landing.height).toBeLessThan(settled.height);
        }
        expect(landing.width).toBeLessThanOrEqual(width * 0.98);
        expect(landing.height).toBeLessThanOrEqual(height * 0.98);
      }
    }
  });

  it("identifies the target before the image advances and delays the device morph", () => {
    for (const from of [0, 1]) {
      const selected = pickerPose(0.87, from + 0.60);
      expect(selected.anticipation).toBeGreaterThan(0);
      expect(selected.focus).toBe(0);
      const advance = pickerPose(0.87, from + 0.67);
      expect(advance.focus).toBeGreaterThan(0);
      const square = previewSize(from, 800, 650, from + 0.67);
      expect(square.width / square.height).toBeCloseTo(1);
      expect(pickerPose(0.87, from + 1).focus).toBe(1);
    }
    expect(deviceCopyReveal(0)).toBe(1);
    expect(deviceCopyReveal(0.5)).toBe(0);
    expect(deviceCopyReveal(1)).toBe(1);
  });

  it("extends only the picker scroll range and maps seeking back to the same logical pose", () => {
    for (const p of [0, 0.39, 0.51, 0.64, 0.69, 0.735, 0.78, 0.87, 0.90, 1]) {
      expect(storyProgress(storyScrollPosition(p))).toBeCloseTo(p, 12);
    }
    const before = storyScrollPosition(0.51) - storyScrollPosition(0.39);
    const picker = storyScrollPosition(0.76) - storyScrollPosition(0.71);
    expect(picker / 0.05 / (before / 0.12)).toBeCloseTo(3);
    expect(storyProgress(0)).toBe(0);
    expect(storyProgress(1)).toBeCloseTo(1);
  });

  it("holds each fully selected device across a reversible scroll range", () => {
    for (const stop of [0.69, 0.78, 0.87]) {
      const center = storyScrollPosition(stop);
      expect(storyProgress(center - 0.007)).toBeCloseTo(stop, 12);
      expect(storyProgress(center + 0.007)).toBeCloseTo(stop, 12);
      expect(storyProgress(center - 0.012)).toBeLessThan(stop);
      expect(storyProgress(center + 0.012)).toBeGreaterThan(stop);
    }
  });

  it("preserves phone, tablet, and laptop screen proportions at rest", () => {
    for (const [width, height] of [[240, 600], [800, 720]]) {
      for (const [format, ratio] of [[0, PREVIEW_DEVICES[0].ratio], [1, 4 / 3], [2, 16 / 10]]) {
        const size = previewSize(format, width, height, format);
        expect(size.width / size.height).toBeCloseTo(ratio, 6);
        expect(size.width).toBeLessThanOrEqual(width);
        expect(size.height).toBeLessThanOrEqual(height);
      }
    }
  });

  it("fills each resting device with its chosen image and returns to orbit between devices", () => {
    for (const [p, device] of [[0.69, 0], [0.78, 1], [0.87, 2]]) {
      const pose = pickerPose(p, device);
      expect(pose.index).toBe(device);
      expect(pose.focus).toBe(1);
      expect(pose.travel).toBe(pose.slot);
    }
    expect(pickerPose(0.64, 0).focus).toBe(0);
    expect(pickerPose(0.735, 0.5).focus).toBe(0);
    expect(pickerPose(0.825, 1.5).focus).toBe(0);
    for (const from of [0, 1]) {
      expect(pickerPose(0.87, from + 0.24).travel).toBeCloseTo(pickerPose(0.87, from).travel);
      expect(pickerPose(0.87, from + 0.90).travel).toBeCloseTo(pickerPose(0.87, from + 1).travel);
    }
  });

  it("uses the same complete image collection in all three galleries and selects the actual card", () => {
    for (const device of [0, 1, 2] as const) {
      const gallery = pickerPose(0.87, device);
      const visible = Array.from({ length: WALL_CARD_COUNT }, (_, slot) => slot)
        .filter(slot => galleryCardPose(slot, gallery).visibility > 0)
        .map(slot => GALLERY_IMAGES[galleryImageIndex(slot)]);
      expect(new Set(visible)).toEqual(new Set(GALLERY_IMAGES));
      expect(GALLERY_IMAGES[galleryImageIndex(PICKER_SLOTS[device])]).toBe(PREVIEW_DEVICES[device].image);
      expect(gallery.gallery).toBe(device);
      const target = galleryCardPose(gallery.slot, gallery);
      expect(Math.abs(target.x)).toBeLessThan(0.1);
      expect(target.yaw).toBeCloseTo(0);
    }
  });

  it("moves adjacent wall columns in opposite directions and brings the storefront to the centre", () => {
    expect(new Set(Array.from({ length: WALL_CARD_COUNT }, (_, slot) => JSON.stringify(wallSlot(slot)))).size).toBe(25);
    expect(wallSlot(PICKER_SLOTS[0])).toEqual({ column: 0, row: 0 });
    const start = pickerPose(0.61, 0), end = pickerPose(0.665, 0);
    const middle = 0, adjacent = Array.from({ length: WALL_CARD_COUNT }, (_, slot) => slot)
      .find(slot => wallSlot(slot).column === 1 && wallSlot(slot).row === 0)!;
    expect((galleryCardPose(middle, end).y - galleryCardPose(middle, start).y) *
      (galleryCardPose(adjacent, end).y - galleryCardPose(adjacent, start).y)).toBeLessThan(0);
    expect(galleryCardPose(middle, end).x).toBe(0);
    expect(galleryCardPose(middle, end).y).toBeCloseTo(0);
    expect(galleryCardPose(middle, end).z).toBe(0);
    expect(galleryCardPose(adjacent, start)).toEqual(galleryCardPose(adjacent, pickerPose(0.61, 0)));
  });

  it("uses a flat horizontal carousel followed by the tilted curved orbit", () => {
    const carousel = pickerPose(0.78, 1), orbit = pickerPose(0.87, 2);
    for (let slot = 0; slot < ORBIT_CARD_COUNT; slot++) {
      const flat = galleryCardPose(slot, carousel);
      expect(flat.yaw).toBe(0);
      expect(flat.pitch).toBe(0);
      expect(flat.roll).toBe(0);
      expect(flat.visibility).toBe(Number(slot < CAROUSEL_CARD_COUNT));
      expect(galleryCardPose(slot, orbit).pitch).toBeCloseTo(18 * Math.PI / 180);
      expect(galleryCardPose(slot, orbit).roll).toBeCloseTo(-12 * Math.PI / 180);
      expect(galleryCardPose(slot, orbit).visibility).toBe(1);
    }
    expect(galleryCardPose(0, carousel).z).not.toBe(galleryCardPose(5, carousel).z);
  });

  it("withdraws the selected image before rotating, and advances the destination only after it reaches the center", () => {
    for (const from of [0, 1]) {
      const retract = pickerPose(0.87, from + 0.05);
      expect(retract.index).toBe(from);
      expect(retract.focus).toBeGreaterThan(0);
      expect(retract.focus).toBeLessThan(1);
      expect(retract.travel).toBe(PICKER_SLOTS[from]);
      const moving = pickerPose(0.87, from + 0.5);
      expect(moving.gallery).toBe(from + 1);
      expect(moving.focus).toBe(0);
      const advance = pickerPose(0.87, from + 0.95);
      expect(advance.index).toBe(from + 1);
      expect(advance.focus).toBeGreaterThan(0);
      expect(advance.travel).toBe(PICKER_SLOTS[from + 1]);
    }
  });

  it("keeps every card continuous across layout and selection boundaries when seeking in either direction", () => {
    for (const value of [0, 0.24, 0.44, 0.5, 0.72, 1, 1.24, 1.44, 1.5, 1.72, 2]) {
      for (let slot = 0; slot < ORBIT_CARD_COUNT; slot++) {
        const before = galleryCardPose(slot, pickerPose(0.87, value - 0.00001));
        const after = galleryCardPose(slot, pickerPose(0.87, value + 0.00001));
        for (const property of ["x", "y", "z", "scale", "pitch", "roll"] as const) {
          expect(Math.abs(before[property] - after[property])).toBeLessThan(0.01);
        }
      }
    }
  });

  it("ends on real following content and gives the same pose after reverse seeking", () => {
    const end = sampleStory(1);
    expect(end.exportAlpha).toBe(0);
    expect(end.phoneAlpha).toBe(0);
    expect(end.nextTitle).toBe(1);
    expect(end.nextContent).toBe(1);
    const before = sampleStory(0.7);
    sampleStory(1);
    expect(sampleStory(0.7)).toEqual(before);
    expect(sampleStory(-3)).toEqual(sampleStory(0));
    expect(sampleStory(4)).toEqual(sampleStory(1));
  });

  it("starts translating the next scene up while the export preview is still visible, and fades export preview before next scene reaches center", () => {
    // At laptop stop (0.87), next scene hasn't started yet and export preview is fully visible and undarkened
    expect(sampleStory(0.87).exportDarken).toBe(0);
    expect(sampleStory(0.87).exportAlpha).toBe(1);
    expect(sampleStory(0.87).nextTitle).toBe(0);
    expect(sampleStory(0.87).nextContent).toBe(0);

    // At 0.88, next scene begins translating up while export preview is STILL fully visible (1.0)
    expect(sampleStory(0.88).exportAlpha).toBe(1);
    expect(sampleStory(0.88).nextTitle).toBeGreaterThan(0);

    // By 0.925, next scene title reaches near center/upper position (>= 0.7), and export preview is already completely gone (0)
    expect(sampleStory(0.925).nextTitle).toBeGreaterThan(0.7);
    expect(sampleStory(0.925).exportAlpha).toBe(0);

    // By 0.95 - 0.97, export preview is completely gone (0) and next scene title and content are at rest
    expect(sampleStory(0.95).exportAlpha).toBe(0);
    expect(sampleStory(0.95).nextTitle).toBe(1);
    expect(sampleStory(0.97).nextContent).toBe(1);
    expect(sampleStory(1).nextContent).toBe(1);
  });

  it("gives the exit transition extra scroll weight so the feature grid entrance feels heavier and controlled", () => {
    expect(storyScrollPosition(0.90) - storyScrollPosition(0.87)).toBeGreaterThan(0.045);
    expect(storyProgress(storyScrollPosition(0.87) + 0.005)).toBe(0.87);
    for (const p of [0.87, 0.88, 0.90, 0.93, 0.97, 1]) {
      expect(storyProgress(storyScrollPosition(p))).toBeCloseTo(p, 12);
    }
  });
});

describe("format gesture decisions", () => {
  const start = (): FormatGesture => ({ from: 0, direction: 1, pull: 0, committed: false });
  it("returns a short pull to its origin and commits a sufficiently long pull", () => {
    const short = start();
    expect(pullFormat(short, 0.25).position).toBeCloseTo(0.25);
    expect(pullFormat(short, 0).goal).toBe(0);
    expect(pullFormat(start(), 0.43).goal).toBe(1);
  });
  it("holds the decision through small reversals and cancels a deliberate reversal", () => {
    const gesture = start();
    pullFormat(gesture, 0.46);
    expect(pullFormat(gesture, -0.1).goal).toBe(1);
    expect(pullFormat(gesture, -0.2).goal).toBe(0);
  });
  it("commits a flick with enough travel but ignores tiny high speed trackpad noise", () => {
    expect(pullFormat(start(), 0.04, true).goal).toBe(0);
    const flick = start();
    expect(pullFormat(flick, 0.15, true).goal).toBe(1);
    expect(pullFormat(flick, 0).goal).toBe(1);
    expect(pullFormat(flick, 0.005).goal).toBe(1);
    expect(pullFormat(flick, -0.08).goal).toBe(0);
  });
  it("does not advance twice from the momentum of one gesture", () => {
    const gesture = start();
    for (let i = 0; i < 80; i++) expect(pullFormat(gesture, 0.12).goal).toBeLessThanOrEqual(1);
    const reverse: FormatGesture = { from: 1, direction: -1, pull: 0, committed: false };
    expect(pullFormat(reverse, -0.5).goal).toBe(0);
    expect(nearestFormat(0.78)).toBe(1);
    expect(nearestFormat(0.99)).toBe(2);
  });
  it("moves monotonically and rests exactly on a device without any bounce at different refresh rates", () => {
    for (const rate of [30, 60, 120]) {
      for (const [from, goal] of [[0, 1], [1, 2], [2, 1], [1, 0], [0, 2], [2, 0]]) {
        const state = { x: from, v: 0 };
        for (let i = 0; i < rate * 5; i++) {
          const before = state.x;
          stepDeviceMotion(state, goal, 1 / rate);
          expect(Math.abs(state.x - goal)).toBeLessThanOrEqual(Math.abs(before - goal));
          expect(state.x).toBeGreaterThanOrEqual(Math.min(from, goal));
          expect(state.x).toBeLessThanOrEqual(Math.max(from, goal));
        }
        expect(state).toEqual({ x: goal, v: 0 });
      }
    }
  });
  it("reverses smoothly from its current position without carrying spring momentum", () => {
    const state = { x: 0, v: 0 };
    for (let i = 0; i < 8; i++) stepDeviceMotion(state, 1, 1 / 60);
    const before = state.x;
    expect(state.v).toBeGreaterThan(0);
    stepDeviceMotion(state, 0, 1 / 240);
    expect(Math.abs(state.x - before)).toBeLessThan(0.05);
    expect(state.v).toBeLessThan(0);
    for (let i = 0; i < 240; i++) stepDeviceMotion(state, 0, 1 / 60);
    expect(state).toEqual({ x: 0, v: 0 });
  });
});
