import type Lenis from "lenis";
import { clamp, FORMAT_STOPS, SCREEN_STOPS, nearestFormat, phase, type FormatIndex } from "./device-story-motion";

/** Device galleries follow scrolling freely and settle on the closest device after idle. */
export function attachProgressiveFormatScroll(
  initial: number,
  positionAt: (progress: number) => number,
  demand: (gallery: number, frame: number, selected: FormatIndex, refresh: boolean, velocity: number) => void,
) {
  const events = new AbortController();
  const lenis = () => (window as unknown as { __lenis?: Lenis }).__lenis;
  let last = initial;
  let origin = (initial < (FORMAT_STOPS[0] + FORMAT_STOPS[1]) / 2 ? 0 : initial < (FORMAT_STOPS[1] + FORMAT_STOPS[2]) / 2 ? 1 : 2) as FormatIndex;
  let direction = 0;
  let running = false;
  let transaction = 0;
  let idle: ReturnType<typeof setTimeout> | undefined;
  let touchY: number | null = null;
  let gestureDirection = 0;
  let gestureTimer: ReturnType<typeof setTimeout> | undefined;
  let gestureLimit: number | null = null;
  let lastMotionTime = performance.now();
  let motionVelocity = 0;
  let settlementVelocity = 0;
  let fallbackEnd: ReturnType<typeof setTimeout> | undefined;
  let draggingScrollbar = false;
  const clear = () => { if (idle) clearTimeout(idle); idle = undefined; };
  const cancel = () => {
    clear();
    clearTimeout(fallbackEnd);
    if (running) {
      ++transaction;
      running = false;
      const smooth = lenis();
      if (smooth) smooth.scrollTo(window.scrollY, { immediate: true, force: true });
      else window.scrollTo({ top: window.scrollY, behavior: "instant" });
    }
  };
  const move = (index: FormatIndex, selection = false, stops: readonly number[] = FORMAT_STOPS) => {
    clear();
    clearTimeout(fallbackEnd);
    const id = ++transaction;
    running = true;
    settlementVelocity = stops === FORMAT_STOPS ? (selection ? 1.5 : motionVelocity * 0.1) : 0;
    const top = positionAt(stops[index]);
    const smooth = lenis();
    if (smooth) smooth.scrollTo(top, {
      force: true, lock: false, duration: selection ? 1.6 : 0.9,
      easing: t => t * t * (3 - 2 * t),
      onComplete: () => { if (id === transaction) running = false; },
    });
    else {
      window.scrollTo({ top, behavior: "smooth" });
      fallbackEnd = setTimeout(() => { if (id === transaction) running = false; }, 1200);
    }
  };
  const filterWheel = (delta: number, target: number) => {
    if (!delta) return delta;
    // The storefront screens keep their gesture boundary; the device gallery does not.
    if (last < SCREEN_STOPS[0] - 0.008 || last > SCREEN_STOPS[2] + 0.008) {
      gestureDirection = 0; gestureLimit = null;
      return delta;
    }
    const nextDirection = Math.sign(delta);
    if (gestureDirection !== nextDirection) {
      gestureDirection = nextDirection;
      const stops = nextDirection > 0 ? SCREEN_STOPS : [...SCREEN_STOPS].reverse();
      // Scroll positions are pixel-rounded and rendered progress may lag behind Lenis.
      const next = stops.find(stop => nextDirection > 0 ? positionAt(stop) > target + 2 : positionAt(stop) < target - 2);
      gestureLimit = next !== undefined ? positionAt(next) : null;
    }
    clearTimeout(gestureTimer);
    gestureTimer = setTimeout(() => { gestureDirection = 0; gestureLimit = null; }, 220);
    const allowed = gestureLimit === null ? delta : nextDirection > 0 ? Math.max(0, Math.min(delta, gestureLimit - target)) : Math.min(0, Math.max(delta, gestureLimit - target));
    if (allowed && running) { running = false; ++transaction; }
    return allowed;
  };
  const host = window as unknown as { __deviceStoryWheelFilter?: typeof filterWheel };
  host.__deviceStoryWheelFilter = filterWheel;
  const onWheel = (event: WheelEvent) => {
    if (event.ctrlKey || event.metaKey || Math.abs(event.deltaY) < Math.abs(event.deltaX) || event.defaultPrevented) return;
    if ((event.target as Element | null)?.closest?.("input,textarea,select,[contenteditable=true],[role=dialog],[data-lenis-prevent]")) return;
    const nextDirection = Math.sign(event.deltaY);
    if (running && nextDirection === direction && last <= SCREEN_STOPS[2] + 0.008) clear(); else cancel();
    direction = nextDirection;
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || (event.target as Element | null)?.closest?.("input,textarea,select,button,a,[contenteditable=true]")) return;
    const delta = event.key === "ArrowDown" || event.key === "PageDown" || (event.code === "Space" && !event.shiftKey) ? 1
      : event.key === "ArrowUp" || event.key === "PageUp" || (event.code === "Space" && event.shiftKey) ? -1 : 0;
    if (delta) { cancel(); direction = Math.sign(delta); }
  };
  window.addEventListener("wheel", onWheel, { capture: true, passive: true, signal: events.signal });
  window.addEventListener("keydown", onKey, { signal: events.signal });
  window.addEventListener("touchstart", e => { touchY = e.touches.length === 1 ? e.touches[0].clientY : null; cancel(); }, { passive: true, signal: events.signal });
  window.addEventListener("touchmove", e => {
    if (touchY === null || e.touches.length !== 1 || e.defaultPrevented) return;
    direction = Math.sign(touchY - e.touches[0].clientY); touchY = e.touches[0].clientY;
  }, { passive: true, signal: events.signal });
  window.addEventListener("touchend", () => { touchY = null; sync(last); }, { passive: true, signal: events.signal });
  window.addEventListener("touchcancel", () => { touchY = null; sync(last); }, { passive: true, signal: events.signal });
  window.addEventListener("pointerdown", e => { if (e.clientX >= document.documentElement.clientWidth) { draggingScrollbar = true; cancel(); } }, { passive: true, signal: events.signal });
  window.addEventListener("pointerup", () => { if (draggingScrollbar) { draggingScrollbar = false; sync(last); } }, { passive: true, signal: events.signal });

  const sync = (p: number, refresh = false) => {
    const now = performance.now();
    if (refresh) {
      cancel();
      origin = (p < (FORMAT_STOPS[0] + FORMAT_STOPS[1]) / 2 ? 0 : p < (FORMAT_STOPS[1] + FORMAT_STOPS[2]) / 2 ? 1 : 2) as FormatIndex;
      direction = 0;
      motionVelocity = 0;
    } else if (p !== last) {
      if (!running && p >= FORMAT_STOPS[0] && p <= FORMAT_STOPS[2]) {
        const dt = Math.max(16, now - lastMotionTime) / 1000;
        const speed = Math.abs(p - last) / (FORMAT_STOPS[1] - FORMAT_STOPS[0]) / dt;
        motionVelocity = Math.max(speed, motionVelocity * Math.exp(-dt / 0.18));
      }
      direction = Math.sign(p - last);
      if (p >= FORMAT_STOPS[2]) origin = 2;
      else if (p <= FORMAT_STOPS[0]) origin = 0;
      else if ((last < FORMAT_STOPS[1] && p >= FORMAT_STOPS[1]) || (last > FORMAT_STOPS[1] && p <= FORMAT_STOPS[1])) origin = 1;
    }
    lastMotionTime = now;
    last = p;
    const segment = p < FORMAT_STOPS[1] ? 0 : 1;
    const t = clamp((p - FORMAT_STOPS[segment]) / (FORMAT_STOPS[segment + 1] - FORMAT_STOPS[segment]));
    const gallery = p <= FORMAT_STOPS[0] ? 0 : p >= FORMAT_STOPS[2] ? 2 : segment + t;
    const frame = p <= FORMAT_STOPS[0] ? 0 : p >= FORMAT_STOPS[2] ? 2
      : segment + (origin <= segment ? phase(t, 0.9, 1) : phase(t, 0, 0.1));
    demand(gallery, frame, Math.round(frame) as FormatIndex, refresh, running ? settlementVelocity : motionVelocity);
    const screenSegment = p < SCREEN_STOPS[1] ? 0 : 1;
    const screenT = clamp((p - SCREEN_STOPS[screenSegment]) / (SCREEN_STOPS[screenSegment + 1] - SCREEN_STOPS[screenSegment]));
    const screenNear = p > SCREEN_STOPS[0] && p < SCREEN_STOPS[2] && ((direction > 0 && screenT >= 0.9 && screenT < 1) || (direction < 0 && screenT > 0 && screenT <= 0.1));
    const betweenDevices = p > FORMAT_STOPS[0] && p < FORMAT_STOPS[2] && !FORMAT_STOPS.some(stop => p === stop);
    if (!refresh && !running && touchY === null && !draggingScrollbar && (betweenDevices || screenNear)) {
      clear();
      idle = setTimeout(() => {
        idle = undefined;
        if (screenNear) move((direction > 0 ? screenSegment + 1 : screenSegment) as FormatIndex, false, SCREEN_STOPS);
        else move(nearestFormat(last));
      }, screenNear ? 160 : 900);
    } else if (!betweenDevices && !screenNear) {
      clear();
    }
  };
  sync(initial, true);
  return { sync, select(index: FormatIndex) { cancel(); gestureDirection = 0; move(index, true); }, dispose() { cancel(); clearTimeout(gestureTimer); if (host.__deviceStoryWheelFilter === filterWheel) delete host.__deviceStoryWheelFilter; events.abort(); } };
}
