import { afterEach, describe, expect, it, vi } from "vitest";
import { attachProgressiveFormatScroll } from "./device-story-progressive-scroll";

let dispose: (() => void) | undefined;
afterEach(() => { dispose?.(); dispose = undefined; vi.useRealTimers(); vi.unstubAllGlobals(); });

function setup(initial = 0.69) {
  vi.useFakeTimers();
  const target = new EventTarget();
  let pending: ReturnType<typeof setTimeout> | undefined;
  const win = Object.assign(target, {
    scrollY: initial * 10000,
    scrollTo: vi.fn(),
    __lenis: { scrollTo: vi.fn((top: number, options: { immediate?: boolean; onComplete?: () => void } = {}) => {
      clearTimeout(pending);
      if (options.immediate) return;
      pending = setTimeout(() => { set(top / 10000); options.onComplete?.(); }, 900);
    }) },
  });
  function set(p: number) { win.scrollY = p * 10000; adapter.sync(p); }
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", { documentElement: { clientWidth: 1920 } });
  const demand = vi.fn();
  const adapter = attachProgressiveFormatScroll(initial, p => p * 10000, demand);
  dispose = adapter.dispose;
  const wheel = (delta: number) => {
    const event = Object.assign(new Event("wheel", { cancelable: true }), { deltaY: delta, deltaX: 0 });
    target.dispatchEvent(event);
    return event.defaultPrevented;
  };
  const filter = (delta: number, position: number) => (win as unknown as { __deviceStoryWheelFilter: (delta: number, target: number) => number }).__deviceStoryWheelFilter(delta, position);
  return { set, wheel, demand, win, filter, select: adapter.select };
}

describe("device gallery gestures", () => {
  it("limits each phone-screen gesture while keeping small scrolls progressive", () => {
    const page = setup(0.39);
    expect(page.wheel(100)).toBe(false);
    expect(page.filter(100, 3900)).toBe(100);
    page.set(0.40);
    expect(page.filter(10000, 4000)).toBeCloseTo(500);
    page.set(0.45);
    expect(page.filter(100, 4500)).toBe(0);
    vi.advanceTimersByTime(250);
    expect(page.filter(10000, 4500)).toBeCloseTo(600);
  });
  it("finishes a nearly complete phone-screen transition without snapping a short scroll back", () => {
    const page = setup(0.39);
    page.set(0.41);
    vi.advanceTimersByTime(250);
    expect(page.win.__lenis.scrollTo).not.toHaveBeenCalled();
    page.set(0.447);
    vi.advanceTimersByTime(160);
    expect(page.win.__lenis.scrollTo.mock.lastCall?.[0]).toBeCloseTo(4500);
  });
  it("releases the last screen on a new downward gesture even when progress lags", () => {
    const page = setup(0.45);
    expect(page.filter(10000, 4500)).toBeCloseTo(600);
    page.set(0.5098);
    expect(page.filter(100, 5100)).toBe(0);
    vi.advanceTimersByTime(250);
    expect(page.filter(100, 5099)).toBe(100);
  });
  it("does not cancel same-direction completion when the next gesture starts", () => {
    const page = setup(0.39);
    page.wheel(100);
    page.filter(100, 3900);
    page.set(0.447);
    vi.advanceTimersByTime(250);
    expect(page.win.__lenis.scrollTo.mock.lastCall?.[0]).toBeCloseTo(4500);
    page.wheel(100);
    expect(page.win.__lenis.scrollTo).toHaveBeenCalledTimes(1);
    expect(page.filter(100, 4500)).toBe(100);
  });
  it("releases the cart toward the first screen when the target is within pixel rounding", () => {
    const page = setup(0.51);
    expect(page.filter(-10000, 5100)).toBeCloseTo(-600);
    page.set(0.4502);
    expect(page.filter(-100, 4500)).toBe(0);
    vi.advanceTimersByTime(250);
    expect(page.filter(-10000, 4501)).toBeCloseTo(-601);
    page.set(0.3901);
    vi.advanceTimersByTime(250);
    expect(page.filter(-100, 3901)).toBe(-100);
  });
  it("follows small scroll input and permits one burst to cross multiple devices", () => {
    const page = setup();
    expect(page.wheel(100)).toBe(false);
    expect(page.filter(100, 6900)).toBe(100);
    page.set(0.72);
    expect(page.demand.mock.lastCall?.[0]).toBeCloseTo(1 / 3);
    expect(page.filter(10000, 7200)).toBe(10000);
    page.set(0.78);
    expect(page.filter(100, 7800)).toBe(100);
  });
  it("reverses toward the previous device without jumping forward", () => {
    const page = setup();
    page.wheel(100);
    page.filter(100, 6900);
    page.set(0.74);
    expect(page.wheel(-100)).toBe(false);
    expect(page.filter(-10000, 7400)).toBe(-10000);
    expect(page.demand.mock.lastCall?.[1]).toBe(0);
  });
  it("releases scrolling beyond the first and last devices", () => {
    const page = setup();
    expect(page.wheel(-100)).toBe(false);
    page.set(0.87);
    expect(page.wheel(100)).toBe(false);
    expect(page.filter(100, 8700)).toBe(100);
  });
  it("still supports selecting a device directly", () => {
    const page = setup();
    page.select(2);
    vi.advanceTimersByTime(900);
    expect(page.demand.mock.lastCall?.[1]).toBe(2);
    expect(page.wheel(-100)).toBe(false);
    expect(page.filter(-10000, 8700)).toBe(-10000);
  });
  it.each([[0.71, 6900], [0.75, 7800], [0.80, 7800], [0.85, 8700]])(
    "settles idle gallery position %s at the nearest device", (progress, expected) => {
      const page = setup();
      page.set(progress);
      vi.advanceTimersByTime(899);
      expect(page.win.__lenis.scrollTo).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(page.win.__lenis.scrollTo.mock.lastCall?.[0]).toBeCloseTo(expected);
    },
  );
  it("does not settle while progress is still changing and cancels settlement on renewed input", () => {
    const page = setup();
    page.set(0.72);
    vi.advanceTimersByTime(700);
    page.set(0.73);
    vi.advanceTimersByTime(800);
    expect(page.win.__lenis.scrollTo).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(page.win.__lenis.scrollTo.mock.lastCall?.[0]).toBeCloseTo(6900);
    page.wheel(100);
    expect(page.win.__lenis.scrollTo.mock.lastCall?.[1]).toMatchObject({ immediate: true });
  });
  it("reports greater landing velocity for faster progress", () => {
    const page = setup();
    vi.advanceTimersByTime(500);
    page.set(0.70);
    const slow = page.demand.mock.lastCall?.[4];
    vi.advanceTimersByTime(16);
    page.set(0.72);
    expect(page.demand.mock.lastCall?.[4]).toBeGreaterThan(slow);
  });
  it("waits for a finger to leave the screen before starting idle settlement", () => {
    const page = setup();
    window.dispatchEvent(Object.assign(new Event("touchstart"), { touches: [{ clientY: 400 }] }));
    page.set(0.75);
    vi.advanceTimersByTime(1500);
    expect(page.win.__lenis.scrollTo).not.toHaveBeenCalled();
    window.dispatchEvent(new Event("touchend"));
    vi.advanceTimersByTime(900);
    expect(page.win.__lenis.scrollTo.mock.lastCall?.[0]).toBeCloseTo(7800);
  });
  it("does not snap while the scrollbar is being dragged", () => {
    const page = setup();
    window.dispatchEvent(Object.assign(new Event("pointerdown"), { clientX: 1920 }));
    page.set(0.75);
    vi.advanceTimersByTime(1500);
    expect(page.win.__lenis.scrollTo).not.toHaveBeenCalled();
    window.dispatchEvent(new Event("pointerup"));
    vi.advanceTimersByTime(900);
    expect(page.win.__lenis.scrollTo.mock.lastCall?.[0]).toBeCloseTo(7800);
  });
});
