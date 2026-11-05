import type Lenis from "lenis";
import type { ScrollTrigger } from "gsap/ScrollTrigger";
import { clamp, FORMAT_STOPS, lerp, pullFormat, type FormatGesture, type FormatIndex } from "./device-story-motion";

/** Own input only while moving between the supplied pinned-scene stops. */
export function attachFormatScroll(
  trigger: Pick<ScrollTrigger, "start" | "end" | "progress">,
  demand: (position: number, selected: FormatIndex, seek?: boolean) => void,
  stops: readonly [number, number, number] = FORMAT_STOPS,
  options: { positionAt?: (p: number) => number; duration?: number; allowFlick?: boolean } = {},
) {
  const events = new AbortController();
  const lenis = () => (window as unknown as { __lenis?: Lenis }).__lenis;
  const nearest = (p: number): FormatIndex => p < (stops[0] + stops[1]) / 2 ? 0 : p < (stops[1] + stops[2]) / 2 ? 1 : 2;
  let selected = nearest(trigger.progress);
  let gesture: FormatGesture | null = null;
  let idle: ReturnType<typeof setTimeout> | undefined;
  let transaction = 0;
  let scrolling = false;
  let touchY: number | null = null;
  let lastProgress = trigger.progress;
  let draggingScrollbar = false;
  let lastInput = 0;
  let gestureStartProgress = trigger.progress;

  const inRange = (p: number) => p >= stops[0] - 0.008 && p <= stops[2] + 0.008;
  const clearIdle = () => { if (idle) clearTimeout(idle); idle = undefined; };
  const positionAt = options.positionAt ?? ((p: number) => trigger.start + p * (trigger.end - trigger.start));
  const moveScroll = (p: number, immediate: boolean) => {
    const id = ++transaction;
    scrolling = true;
    const top = positionAt(p), smooth = lenis();
    if (!immediate && Math.abs(top - window.scrollY) < 0.5) {
      smooth?.scrollTo(top, { immediate: true, force: true });
      scrolling = false;
      return;
    }
    if (smooth) smooth.scrollTo(top, {
      immediate, force: true, lock: false, duration: options.duration ?? 0.34,
      easing: t => 1 - (1 - t) ** 3,
      onComplete: () => { if (id === transaction) scrolling = false; },
    });
    else { window.scrollTo({ top, behavior: "instant" }); scrolling = false; }
  };
  const finish = () => {
    clearIdle();
    if (!inRange(trigger.progress)) { gesture = null; return; }
    if (gesture) selected = pullFormat(gesture, 0).goal;
    gesture = null;
    demand(selected, selected);
    moveScroll(stops[selected], false);
  };
  const waitForEnd = () => { clearIdle(); idle = setTimeout(finish, 160); };
  const claim = (delta: number) => {
    if (!delta || !inRange(trigger.progress) || lenis()?.isStopped) return false;
    const now = performance.now(), elapsed = gesture ? Math.max(16, now - lastInput) : 80;
    lastInput = now;
    if (!gesture) {
      if ((selected === 0 && delta < 0) || (selected === 2 && delta > 0)) return false;
      clearIdle();
      gesture = { from: selected, direction: Math.sign(delta), pull: 0, committed: false };
      gestureStartProgress = trigger.progress;
    }
    const wasCommitted = gesture.committed;
    const gap = Math.max(120, positionAt(stops[1]) - positionAt(stops[0]));
    const normalized = delta / gap;
    const result = pullFormat(gesture, normalized, options.allowFlick !== false && Math.abs(normalized) / (elapsed / 1000) > 1.8);
    selected = result.goal;
    demand(result.position, selected);
    // A gesture chooses once; its momentum tail cannot advance another format.
    if (gesture.committed) {
      if (!wasCommitted) moveScroll(stops[selected], false);
    } else {
      const to = clamp(gesture.from + gesture.direction, 0, 2) as FormatIndex;
      moveScroll(lerp(gestureStartProgress, stops[to], gesture.pull), true);
    }
    waitForEnd();
    return true;
  };
  const onWheel = (event: WheelEvent) => {
    if (!event.cancelable || event.defaultPrevented || event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if ((event.target as Element | null)?.closest?.("input,textarea,select,[contenteditable=true],[role=dialog],[data-lenis-prevent]")) return;
    const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    if (claim(event.deltaY * units)) event.preventDefault();
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if ((event.target as Element | null)?.closest?.("input,textarea,select,button,a,[contenteditable=true],[role=slider]")) return;
    const delta = event.key === "ArrowDown" ? 100 : event.key === "ArrowUp" ? -100
      : event.key === "PageDown" ? 500 : event.key === "PageUp" ? -500
        : event.code === "Space" ? (event.shiftKey ? -500 : 500) : 0;
    if (claim(delta)) event.preventDefault();
  };
  const onTouchStart = (event: TouchEvent) => { touchY = event.touches.length === 1 ? event.touches[0].clientY : null; };
  const onTouchMove = (event: TouchEvent) => {
    if (touchY === null || event.touches.length !== 1 || event.defaultPrevented || !event.cancelable) return;
    if ((event.target as Element | null)?.closest?.("input,textarea,select,[contenteditable=true],[role=dialog],[data-lenis-prevent]")) return;
    const y = event.touches[0].clientY, delta = touchY - y;
    touchY = y;
    if (claim(delta)) event.preventDefault();
  };
  const onTouchEnd = () => { touchY = null; if (gesture) finish(); };
  const onPointerDown = (event: PointerEvent) => {
    draggingScrollbar = event.clientX >= document.documentElement.clientWidth;
    if (draggingScrollbar) clearIdle();
  };
  const onPointerUp = () => { if (draggingScrollbar) { draggingScrollbar = false; waitForEnd(); } };

  window.addEventListener("wheel", onWheel, { capture: true, passive: false, signal: events.signal });
  window.addEventListener("keydown", onKey, { signal: events.signal });
  window.addEventListener("touchstart", onTouchStart, { passive: true, signal: events.signal });
  window.addEventListener("touchmove", onTouchMove, { capture: true, passive: false, signal: events.signal });
  window.addEventListener("touchend", onTouchEnd, { passive: true, signal: events.signal });
  window.addEventListener("touchcancel", onTouchEnd, { passive: true, signal: events.signal });
  window.addEventListener("pointerdown", onPointerDown, { passive: true, signal: events.signal });
  window.addEventListener("pointerup", onPointerUp, { passive: true, signal: events.signal });
  demand(selected, selected, true);

  return {
    select(index: FormatIndex) {
      clearIdle(); gesture = null;
      selected = index;
      demand(index, index);
      moveScroll(stops[index], false);
    },
    sync(p: number, refresh = false) {
      const seek = refresh || (Math.abs(p - lastProgress) > 0.15 && (!scrolling || !inRange(p)));
      lastProgress = p;
      if (seek || (!inRange(p) && !scrolling)) {
        const wasScrolling = scrolling;
        clearIdle(); gesture = null; scrolling = false; ++transaction;
        if (wasScrolling) lenis()?.scrollTo(window.scrollY, { immediate: true, force: true });
        selected = nearest(clamp(p));
        demand(selected, selected, seek);
        if (!inRange(p)) return;
      }
      if ((gesture || scrolling) && !seek) return;
      selected = nearest(clamp(p));
      demand(selected, selected, seek);
      if (inRange(p) && !draggingScrollbar) waitForEnd();
    },
    dispose() {
      clearIdle(); events.abort(); ++transaction;
      if (scrolling) lenis()?.scrollTo(window.scrollY, { immediate: true, force: true });
    },
  };
}
