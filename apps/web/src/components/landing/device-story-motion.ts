import { GALLERY_IMAGE_ORDER, PREVIEW_DEVICES } from "./device-story-devices";

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export function phase(p: number, start: number, end: number) {
  const t = clamp((p - start) / (end - start));
  return t * t * (3 - 2 * t);
}

export const FORMAT_STOPS = [0.69, 0.78, 0.87] as const;
export const SCREEN_STOPS = [0.39, 0.45, 0.51] as const;
export const ORBIT_CARD_COUNT = 22;
export const WALL_CARD_COUNT = 25;
export const CAROUSEL_CARD_COUNT = GALLERY_IMAGE_ORDER.length;
export const GALLERY_RADIUS = 1.55;
export const GALLERY_CARD_WIDTH = Math.PI * 2 * GALLERY_RADIUS / ORBIT_CARD_COUNT * 0.97;
export const GALLERY_CARD_HEIGHT = GALLERY_CARD_WIDTH * 1019 / 720;
export const PICKER_SLOTS = [0, 7, 14] as const;
export type FormatIndex = 0 | 1 | 2;
export const nearestFormat = (p: number): FormatIndex =>
  (p < (FORMAT_STOPS[0] + FORMAT_STOPS[1]) / 2 ? 0 : p < (FORMAT_STOPS[1] + FORMAT_STOPS[2]) / 2 ? 1 : 2);

export function entranceWarp(p: number) {
  if (p < 0.04) return { k: 0, zoom: 1, source: 0 };
  if (p >= 0.20) return { k: 0, zoom: 1, source: 1 };
  const before = p < 0.10;
  const t = before ? clamp((p - 0.04) / 0.06) : clamp((p - 0.10) / 0.10);
  return {
    k: 22 * (before ? t ** 4 : (1 - t) ** 4.2),
    zoom: before ? 1 + 1.3 * t ** 2.6 : 1 + 0.1 * (1 - t) ** 3,
    source: phase(p, 0.088, 0.106),
  };
}

export function phoneEntranceRotations(p: number) {
  const shot = clamp((p - 0.10) / 0.15);
  const turn = 1 - (1 - shot) ** 3.4;
  const radians = Math.PI / 180;
  return {
    centerPitch: lerp(0.17, 0, turn),
    centerYaw: (lerp(-520, 0, turn) - 18 * (1 - phase(p, 0.10, 0.32))) * radians,
    leftYaw: lerp(-150, 0, phase(p, 0.10, 0.285)) * radians,
    rightYaw: lerp(30, 155, phase(p, 0.10, 0.30)) * radians,
    leftRoll: lerp(0.045, 0.11, phase(p, 0.14, 0.32)),
    rightRoll: lerp(0.045, 0.10, phase(p, 0.14, 0.32)),
  };
}

export function screenTransition(sheet: number) {
  return sheet < 0.5
    ? { stage: 0, rise: phase(sheet, 0, 0.45) }
    : { stage: 1, rise: phase(sheet, 0.55, 1) };
}

export function phoneFloat(p: number, time: number) {
  return Math.sin(time * 0.85) * 0.012 * phase(p, 0.33, 0.39) * (1 - phase(p, 0.52, 0.61));
}

export function pickerPose(p: number, device: number) {
  const position = clamp(device, 0, 2);
  const index = Math.round(position) as FormatIndex;
  const segment = Math.min(1, Math.floor(position));
  const t = position - segment;
  const focus = index === segment ? 1 - phase(t, 0, 0.16) : phase(t, 0.62, 1);
  const gallery = segment + phase(t, 0.12, 0.30);
  const travel = lerp(PICKER_SLOTS[segment], PICKER_SLOTS[segment + 1], phase(t, 0.27, 0.62));
  const anticipation = phase(t, 0.50, 0.62) * (1 - phase(t, 0.62, 0.72));
  return {
    index,
    gallery,
    wallTravel: phase(p, 0.60, 0.665),
    focus: phase(p, 0.665, FORMAT_STOPS[0]) * focus,
    anticipation: phase(p, 0.665, FORMAT_STOPS[0]) * anticipation,
    slot: PICKER_SLOTS[index],
    travel,
  };
}

export const galleryImageIndex = (slot: number) => GALLERY_IMAGE_ORDER[slot % GALLERY_IMAGE_ORDER.length];

/** Stable slots keep the selected storefront in the wall's centre column. */
export function wallSlot(slot: number) {
  const cell = slot === 0 ? 12 : slot <= 12 ? slot - 1 : slot;
  return { column: cell % 5 - 2, row: Math.floor(cell / 5) - 2 };
}

/** One continuous set of cards: alternating wall → flat carousel → curved orbit. */
export function galleryCardPose(slot: number, selection: ReturnType<typeof pickerPose>, wallScale = 1) {
  const { gallery, travel, wallTravel } = selection;
  const { column, row } = wallSlot(slot);
  const width = GALLERY_CARD_WIDTH * wallScale;
  const height = GALLERY_CARD_HEIGHT * wallScale;
  const gap = width * 27 / 370.8;
  const pitchY = height + gap;
  const shift = (wallTravel - 1) * 0.65;
  const direction = Math.abs(column) % 2 === 1 ? 1 : -1;
  const unwrapped = (row + direction * shift) * pitchY;
  const wall = {
    x: column * (width + gap),
    y: -(unwrapped - Math.round(unwrapped / (5 * pitchY)) * 5 * pitchY),
    z: 0, scale: wallScale, yaw: 0, pitch: 0, roll: 0,
  };
  const carouselAngle = (slot - travel) / CAROUSEL_CARD_COUNT * Math.PI * 2;
  const carouselRadius = 1.14;
  const carousel = {
    x: carouselRadius * Math.sin(carouselAngle),
    y: -carouselRadius * Math.sin(8 * Math.PI / 180) * Math.cos(carouselAngle) + (slot % 2 ? 0.18 : -0.18),
    z: carouselRadius * Math.cos(carouselAngle),
    scale: 1.12, yaw: 0, pitch: 0, roll: 0,
  };
  const angle = (slot - travel) / ORBIT_CARD_COUNT * Math.PI * 2;
  const pitch = 18 * Math.PI / 180, roll = -12 * Math.PI / 180;
  const x = 1.55 * Math.sin(angle), y = -1.55 * Math.cos(angle) * Math.sin(pitch);
  const orbit = {
    x: x * Math.cos(roll) - y * Math.sin(roll), y: x * Math.sin(roll) + y * Math.cos(roll), z: 1.55 * Math.cos(angle) * Math.cos(pitch),
    scale: 0.86, yaw: angle, pitch, roll,
  };
  const a = gallery <= 1 ? wall : carousel, b = gallery <= 1 ? carousel : orbit;
  const blend = gallery <= 1 ? gallery : gallery - 1;
  return {
    x: lerp(a.x, b.x, blend), y: lerp(a.y, b.y, blend), z: lerp(a.z, b.z, blend),
    scale: lerp(a.scale, b.scale, blend),
    yaw: lerp(a.yaw, b.yaw, blend), pitch: lerp(a.pitch, b.pitch, blend), roll: lerp(a.roll, b.roll, blend),
    visibility: gallery <= 1 ? lerp(1, Number(slot < CAROUSEL_CARD_COUNT), blend)
      : lerp(Number(slot < CAROUSEL_CARD_COUNT), Number(slot < ORBIT_CARD_COUNT), blend),
  };
}

const PICKER_SCROLL_START = 0.64, PICKER_SCROLL_END = FORMAT_STOPS[2], PICKER_SCROLL_WEIGHT = 3;
const EXIT_SCROLL_START = FORMAT_STOPS[2], EXIT_SCROLL_END = 1, EXIT_SCROLL_WEIGHT = 3;
const DEVICE_HOLD = 0.035;
const TOTAL_SCROLL_WEIGHT = 1
  + (PICKER_SCROLL_END - PICKER_SCROLL_START) * (PICKER_SCROLL_WEIGHT - 1)
  + (EXIT_SCROLL_END - EXIT_SCROLL_START) * (EXIT_SCROLL_WEIGHT - 1)
  + FORMAT_STOPS.length * DEVICE_HOLD;

const weightedStory = (p: number) =>
  p
  + clamp(p - PICKER_SCROLL_START, 0, PICKER_SCROLL_END - PICKER_SCROLL_START) * (PICKER_SCROLL_WEIGHT - 1)
  + clamp(p - EXIT_SCROLL_START, 0, EXIT_SCROLL_END - EXIT_SCROLL_START) * (EXIT_SCROLL_WEIGHT - 1);

export function storyScrollPosition(p: number) {
  const holds = FORMAT_STOPS.reduce((sum, stop) => sum + (p > stop ? DEVICE_HOLD : p === stop ? DEVICE_HOLD / 2 : 0), 0);
  return (weightedStory(p) + holds) / TOTAL_SCROLL_WEIGHT;
}
export function storyProgress(scroll: number) {
  let weighted = scroll * TOTAL_SCROLL_WEIGHT;
  for (const stop of FORMAT_STOPS) {
    const start = weightedStory(stop);
    if (weighted < start) break;
    if (weighted <= start + DEVICE_HOLD) return stop;
    weighted -= DEVICE_HOLD;
  }
  const pickerEnd = PICKER_SCROLL_START + (PICKER_SCROLL_END - PICKER_SCROLL_START) * PICKER_SCROLL_WEIGHT;
  return weighted < PICKER_SCROLL_START
    ? weighted
    : weighted < pickerEnd
      ? PICKER_SCROLL_START + (weighted - PICKER_SCROLL_START) / PICKER_SCROLL_WEIGHT
      : EXIT_SCROLL_START + (weighted - pickerEnd) / EXIT_SCROLL_WEIGHT;
}

export function sampleStory(progress: number) {
  const p = clamp(progress);
  return {
    p,
    focus: phase(p, 0.24, 0.33),
    sheet: phase(p, 0.39, 0.51),
    phoneAlpha: 1 - phase(p, 0.612, 0.622),
    deviceCopy: phase(p, 0.33, 0.39) * (1 - phase(p, 0.51, 0.55)),
    handoff: phase(p, 0.51, 0.61),
    deviceMix: phase(p, 0.612, 0.622),
    exportAlpha: phase(p, 0.56, 0.61) * (1 - phase(p, 0.88, 0.925)),
    exportDarken: phase(p, 0.88, 0.925),
    exportEntrance: phase(p, 0.58, 0.66),
    format: nearestFormat(p),
    ringTurn: (p - 0.58) / 0.34 * Math.PI * 2,
    nextTitle: phase(p, 0.875, 0.95),
    nextContent: phase(p, 0.885, 0.97),
  };
}

export function fallbackEntrance(frame: ReturnType<typeof sampleStory>) {
  const source = entranceWarp(frame.p).source;
  return { logo: 1 - source, phone: frame.phoneAlpha * source };
}

export interface ExtendedStoryFrame {
  story: ReturnType<typeof sampleStory>;
  deviceProgress: number;
  gridVisible: boolean;
  gridAlpha: number;
  gridInteractive: boolean;
  teaserVisible: boolean;
  teaserAlpha: number;
  teaserTitle: number;
  teaserContent: number;
  teaserInteractive: boolean;
  pricingVisible: boolean;
  pricingAlpha: number;
  pricingTitle: number;
  pricingContent: number;
  pricingInteractive: boolean;
}

// Keep the device story's original scroll distance while shortening the later scenes.
export function extendedStoryProgress(scrollProgress: number, scrollDistance: number, deviceDistance: number) {
  if (scrollDistance <= 0 || deviceDistance <= 0 || deviceDistance >= scrollDistance) return clamp(scrollProgress);
  const distance = clamp(scrollProgress) * scrollDistance;
  return distance <= deviceDistance
    ? 0.52 * distance / deviceDistance
    : 0.52 + 0.48 * (distance - deviceDistance) / (scrollDistance - deviceDistance);
}

export function sampleExtendedStory(scrollProgress: number): ExtendedStoryFrame {
  const s = clamp(scrollProgress, 0, 1);

  // Phase 1: Device story (0.00 to 0.52)
  const deviceProgress = storyProgress(clamp(s / 0.52, 0, 1));
  const story = sampleStory(deviceProgress);

  // Match the device-to-grid handoff: the outgoing scene fades while the
  // incoming heading and content rise independently, without a second fade.
  const gridExit = clamp((s - 0.64) / 0.12);
  const gridAlpha = story.nextTitle > 0 ? 1 - phase(gridExit, 0.05, 0.53) : 0;
  const gridVisible = story.nextTitle > 0 && gridAlpha > 0;
  const gridInteractive = s >= 0.50 && s < 0.65;

  const teaserEnter = clamp((s - 0.64) / 0.12);
  const teaserExit = clamp((s - 0.86) / 0.10);
  const teaserTitle = phase(teaserEnter, 0, 0.79);
  const teaserContent = phase(teaserEnter, 0.105, 1);
  const teaserAlpha = s >= 0.64 ? 1 - phase(teaserExit, 0.05, 0.53) : 0;
  const teaserVisible = s >= 0.64 && teaserAlpha > 0;
  const teaserInteractive = s >= 0.75 && s < 0.87;

  const pricingEnter = clamp((s - 0.86) / 0.10);
  const pricingTitle = phase(pricingEnter, 0, 0.79);
  const pricingContent = phase(pricingEnter, 0.105, 1);
  const pricingVisible = s >= 0.86;
  const pricingInteractive = s >= 0.96;

  return {
    story,
    deviceProgress,
    gridVisible,
    gridAlpha,
    gridInteractive,
    teaserVisible,
    teaserAlpha,
    teaserTitle,
    teaserContent,
    teaserInteractive,
    pricingVisible,
    pricingAlpha: Number(pricingVisible),
    pricingTitle,
    pricingContent,
    pricingInteractive,
  };
}

export function pricingScrollOffset(progress: number, scrollDistance: number) {
  return (clamp(progress) - 1) * scrollDistance;
}

export function getFormatFrames(maxWidth: number, maxHeight: number) {
  return PREVIEW_DEVICES.map((device, index) => {
    const scale = clamp(maxHeight / 650, 0.65, 1);
    const bezel = device.bezel * scale;
    const rim = device.rim * scale;
    const height = Math.max(1, Math.min(maxHeight * 0.98, maxHeight - 2 * bezel - 4, maxWidth * device.widthScale / device.ratio));
    const width = height * device.ratio;
    return { width, height, x: (maxWidth - width) / 2, y: (maxHeight - height) / 2, pill: index, radius: device.radius * scale, bezel, rim };
  });
}

export function previewSize(format: number, maxWidth: number, maxHeight: number, galleryPosition?: number, landing = 0) {
  const shapes = getFormatFrames(maxWidth, maxHeight);
  const f = clamp(format, 0, 2);
  const index = Math.min(1, Math.floor(f));
  const a = Math.max(0, index), b = a + 1, t = f - a;
  const g = clamp(galleryPosition ?? format, 0, 2);
  const segment = Math.min(1, Math.floor(g)), progress = g - segment;
  const squareSize = Math.min(maxWidth * 0.86, maxHeight * 0.82);
  const square = {
    width: squareSize,
    height: squareSize,
    bezel: (shapes[segment].bezel + shapes[segment + 1].bezel) / 2,
    radius: (shapes[segment].radius + shapes[segment + 1].radius) / 2,
    rim: (shapes[segment].rim + shapes[segment + 1].rim) / 2,
  };
  const from = galleryPosition === undefined ? 0 : 1 - (1 - clamp(progress / 0.22)) ** 3;
  const to = galleryPosition === undefined ? 0 : phase(progress, 0.68, 1);
  const value = (key: "width" | "height" | "radius" | "bezel" | "rim") => galleryPosition === undefined
    ? lerp(shapes[a][key], shapes[b][key], t)
    : lerp(lerp(shapes[segment][key], square[key], from), shapes[segment + 1][key], to);
  const width = clamp(value("width"), 1, maxWidth * 0.98);
  const height = clamp(value("height"), 1, maxHeight * 0.98);
  const amount = clamp(landing, 0, 0.02) * (Math.round(g) === 0 ? -1 : 1);
  return {
    width: clamp(width * (1 + amount), 1, maxWidth * 0.98),
    height: clamp(height * (1 - amount), 1, maxHeight * 0.98),
    pill: lerp(shapes[a].pill, shapes[b].pill, t),
    radius: value("radius"),
    bezel: value("bezel"),
    rim: value("rim"),
  };
}

/** Only a completed transition lands; refreshing or remaining on a stop does not. */
export function deviceArrival(previous: number, next: number, refresh: boolean) {
  return !refresh && next >= 0 && next <= 2 && Number.isInteger(next) && previous !== next;
}

/** No artificial bounce for an almost stationary or slowly scrubbed arrival. */
export const deviceLandingStrength = (velocity: number) => 0.018 * phase(Math.abs(velocity), 0.35, 2);

/** The island retracts into the upper bezel during the phone-to-tablet morph. */
export const phoneIslandRetraction = (format: number) => phase(format, 0, 0.28);

/** Grow the laptop notch only as its selected image approaches the screen edges. */
export const laptopNotchProgress = (device: number, focus: number) => device === 2 ? phase(focus, 0.68, 0.98) : 0;

/** Conceal the copy swap without delaying the chosen device state. */
export function deviceCopyReveal(format: number) {
  const fraction = clamp(format, 0, 2) % 1;
  return 1 - phase(1 - Math.abs(fraction - 0.5) * 2, 0.5, 1);
}

export type FormatGesture = { from: FormatIndex; direction: number; pull: number; committed: boolean };
export function pullFormat(gesture: FormatGesture, delta: number, flick = false) {
  gesture.pull = clamp(gesture.pull + delta * gesture.direction);
  // A lower release threshold prevents trackpad noise from toggling a decision.
  if (gesture.committed) {
    if (delta * gesture.direction < 0 && gesture.pull < 0.24) gesture.committed = false;
  } else gesture.committed = gesture.pull >= 0.42 || (flick && gesture.pull >= 0.12);
  const to = clamp(gesture.from + gesture.direction, 0, 2) as FormatIndex;
  return {
    goal: (gesture.committed ? to : gesture.from) as FormatIndex,
    position: gesture.committed ? to : lerp(gesture.from, to, gesture.pull),
  };
}

export function stepDeviceMotion(state: { x: number; v: number }, goal: number, seconds: number) {
  const dt = clamp(seconds, 0, 0.064);
  const distance = goal - state.x;
  const travel = Math.min(Math.abs(distance) * (1 - Math.exp(-dt / 0.16)), dt * 0.95);
  state.x += Math.sign(distance) * travel;
  state.v = dt ? Math.sign(distance) * travel / dt : 0;
  const resting = Math.abs(goal - state.x) < 0.0001;
  if (resting) { state.x = goal; state.v = 0; }
  return !resting;
}

export type StoryFrame = ReturnType<typeof sampleStory>;
export type StoryLayout = {
  width: number;
  height: number;
  phone: { x: number; y: number; height: number };
  preview: { x: number; y: number; width: number; height: number };
};

