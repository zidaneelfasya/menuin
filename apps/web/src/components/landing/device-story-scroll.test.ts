import { afterEach, describe, expect, it, vi } from "vitest";
import type { ScrollTrigger } from "gsap/ScrollTrigger";
import { attachFormatScroll } from "./device-story-scroll";

let dispose: (() => void) | undefined;
afterEach(() => { dispose?.(); dispose = undefined; vi.useRealTimers(); vi.unstubAllGlobals(); });

function setup(progress = 0.69, stops?: readonly [number, number, number]) {
  vi.useFakeTimers();
  const bounds = { start: 1000, end: 8000, progress };
  const target = new EventTarget();
  let adapter: ReturnType<typeof attachFormatScroll> | null = null;
  let pending: ReturnType<typeof setTimeout> | undefined;
  const win = Object.assign(target, {
    scrollY: 1000 + progress * 7000, innerHeight: 900,
    scrollTo: ({ top }: { top: number }) => setPosition((top - 1000) / 7000),
    __lenis: {
      isStopped: false,
      scrollTo(top: number, options: { immediate?: boolean; onComplete?: () => void } = {}) {
        clearTimeout(pending);
        const complete = () => { setPosition((top - 1000) / 7000); options.onComplete?.(); };
        if (options.immediate) complete(); else pending = setTimeout(complete, 340);
      },
    },
  });
  function setPosition(p: number) { bounds.progress = p; win.scrollY = 1000 + p * 7000; adapter?.sync(p); }
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", { documentElement: { clientWidth: 1920 } });
  const demand = vi.fn();
  adapter = attachFormatScroll(bounds as unknown as ScrollTrigger, demand, stops);
  dispose = adapter.dispose;
  return {
    bounds, win, demand, setPosition,
    select: adapter.select,
    input(type: string, properties: Record<string, unknown>) {
      const event = Object.assign(new Event(type, { cancelable: true }), properties);
      target.dispatchEvent(event);
      return event.defaultPrevented;
    },
    wheel(delta: number) {
      const event = Object.assign(new Event("wheel", { cancelable: true }), { deltaY: delta, deltaX: 0, deltaMode: 0 });
      target.dispatchEvent(event);
      return event.defaultPrevented;
    },
  };
}

describe("format scroll ownership", () => {
  it("allows a button selection while the opening gallery is still outside the snap range", () => {
    const page = setup(0.65);
    page.select(1);
    page.setPosition(0.655);
    expect(page.demand).toHaveBeenLastCalledWith(1, 1);
    vi.advanceTimersByTime(700);
    expect(page.bounds.progress).toBeCloseTo(0.78);
  });
  it("lets a device button select a non-adjacent stop and then resumes reverse scroll", () => {
    const page = setup();
    page.select(2);
    expect(page.demand).toHaveBeenLastCalledWith(2, 2);
    vi.advanceTimersByTime(700);
    expect(page.bounds.progress).toBeCloseTo(0.87);
    page.wheel(-350);
    vi.advanceTimersByTime(700);
    expect(page.bounds.progress).toBeCloseTo(0.78);
  });
  it("snaps phone screens to their own stops and releases scrolling at both ends", () => {
    const page = setup(0.39, [0.39, 0.45, 0.51]);
    expect(page.wheel(-120)).toBe(false);
    expect(page.wheel(35)).toBe(true);
    vi.advanceTimersByTime(700);
    expect(page.bounds.progress).toBeCloseTo(0.39);
    page.wheel(300);
    vi.advanceTimersByTime(700);
    expect(page.bounds.progress).toBeCloseTo(0.45);
    page.wheel(300);
    vi.advanceTimersByTime(700);
    expect(page.bounds.progress).toBeCloseTo(0.51);
    expect(page.wheel(120)).toBe(false);
    page.wheel(-300);
    vi.advanceTimersByTime(700);
    expect(page.bounds.progress).toBeCloseTo(0.45);
  });

  it("settles an external seek in the middle of a phone transition", () => {
    const page = setup(0.39, [0.39, 0.45, 0.51]);
    page.setPosition(0.43);
    vi.advanceTimersByTime(700);
    expect(page.bounds.progress).toBeCloseTo(0.45);
  });
  it("settles a short wheel pull back onto the original scroll anchor", () => {
    const page = setup();
    expect(page.wheel(35)).toBe(true);
    vi.advanceTimersByTime(700);
    expect(page.bounds.progress).toBeCloseTo(0.69);
    expect(page.demand).toHaveBeenLastCalledWith(0, 0);
  });

  it("does not jump backwards when taking over a gesture between anchors", () => {
    const page = setup(0.70);
    page.wheel(35);
    expect(page.bounds.progress).toBeGreaterThan(0.70);
    vi.advanceTimersByTime(700);
    expect(page.bounds.progress).toBeCloseTo(0.69);
  });

  it("consumes one momentum tail once, then accepts a reverse gesture", () => {
    const page = setup();
    page.wheel(300);
    for (let i = 0; i < 15; i++) { vi.advanceTimersByTime(10); page.wheel(20); }
    vi.advanceTimersByTime(700);
    expect(page.bounds.progress).toBeCloseTo(0.78);
    expect(page.demand).toHaveBeenLastCalledWith(1, 1);
    page.wheel(-350);
    vi.advanceTimersByTime(700);
    expect(page.bounds.progress).toBeCloseTo(0.69);
  });

  it("allows leaving either boundary and cancels a pending snap after an external seek", () => {
    const page = setup();
    expect(page.wheel(-120)).toBe(false);
    page.wheel(300);
    page.setPosition(0.97);
    vi.advanceTimersByTime(1000);
    expect(page.bounds.progress).toBe(0.97);
    expect(page.wheel(120)).toBe(false);
    expect(page.demand).toHaveBeenLastCalledWith(2, 2, true);
  });

  it("releases its listeners and deferred work on unmount", () => {
    const page = setup();
    page.wheel(35);
    dispose?.(); dispose = undefined;
    const calls = page.demand.mock.calls.length;
    vi.advanceTimersByTime(1000);
    expect(page.demand).toHaveBeenCalledTimes(calls);
    expect(page.wheel(300)).toBe(false);
  });

  it("supports keyboard changes and lets forward input leave the wide boundary", () => {
    const page = setup(0.78);
    expect(page.input("keydown", { key: "PageDown" })).toBe(true);
    vi.advanceTimersByTime(700);
    expect(page.bounds.progress).toBeCloseTo(0.87);
    expect(page.wheel(120)).toBe(false);
    expect(page.input("keydown", { key: "End" })).toBe(false);
    expect(page.input("keydown", { key: "PageUp" })).toBe(true);
    vi.advanceTimersByTime(700);
    expect(page.bounds.progress).toBeCloseTo(0.78);
  });

  it("returns a short touch drag on touchend and commits a longer swipe", () => {
    const page = setup(0.78);
    page.input("touchstart", { touches: [{ clientY: 600 }] });
    expect(page.input("touchmove", { touches: [{ clientY: 570 }] })).toBe(true);
    page.input("touchend", { touches: [] });
    vi.advanceTimersByTime(700);
    expect(page.bounds.progress).toBeCloseTo(0.78);
    page.input("touchstart", { touches: [{ clientY: 600 }] });
    page.input("touchmove", { touches: [{ clientY: 280 }] });
    page.input("touchend", { touches: [] });
    vi.advanceTimersByTime(700);
    expect(page.bounds.progress).toBeCloseTo(0.87);
  });
});
