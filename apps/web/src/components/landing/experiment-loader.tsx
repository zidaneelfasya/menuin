"use client";

import { useEffect, useId, useRef } from "react";
import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { LOADER_LOGO_BOX, LOADER_LOGO_PARTS } from "./experiment-loader-logo";
import { LOADER_CURTAIN_REVEAL_OFFSET, loaderRibbonPaths } from "./experiment-loader-motion";
import styles from "./experiment-loader.module.css";

type ExperimentLoaderProps = {
  progress?: number;
  ready?: boolean;
  canContinue?: boolean;
  onComplete?: () => void;
};

export default function ExperimentLoader({ progress = 0, ready = false, canContinue = false, onComplete }: ExperimentLoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<SVGRectElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const whiteRef = useRef<SVGGElement>(null);
  const grayRef = useRef<SVGGElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const targetRef = useRef(progress);
  const readyRef = useRef(ready);
  const completeRef = useRef(onComplete);
  const skipRef = useRef<(() => void) | null>(null);
  const clipId = useId().replace(/:/g, "");
  targetRef.current = Math.max(targetRef.current, Math.min(0.94, progress));
  readyRef.current = ready;
  completeRef.current = onComplete;

  useEffect(() => {
    const root = rootRef.current;
    const fill = fillRef.current;
    const white = whiteRef.current;
    const svg = svgRef.current;
    if (!root || !fill || !white || !svg) return;
    gsap.registerPlugin(MorphSVGPlugin);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { width } = LOADER_LOGO_BOX;
    const state = { fill: 0 };
    let exiting = false;
    let timeline: gsap.core.Timeline | null = null;
    const paintFill = () => {
      fill.setAttribute("width", String((width + 2) * state.fill));
    };
    const reveal = (skip = false) => {
      if (exiting) return;
      exiting = true;
      gsap.ticker.remove(tick);
      skipRef.current = null;
      root.dataset.phase = skip ? "opening" : "morphing";
      timeline = gsap.timeline({ onComplete: () => completeRef.current?.() });
      if (continueRef.current) timeline.to(continueRef.current, { autoAlpha: 0, duration: 0.15 }, 0);
      if (skip || reduced) {
        timeline.set(root, { backgroundColor: "transparent" }, 0);
        timeline.to(svg, { opacity: 0, duration: reduced ? 0.16 : 0.3 }, 0);
        if (reduced) timeline.to([topRef.current, bottomRef.current], { opacity: 0, duration: 0.2 }, 0.12);
        else {
          timeline.to(topRef.current, { yPercent: -100, duration: 0.95, ease: "power3.inOut" }, 0.05);
          timeline.to(bottomRef.current, { yPercent: 100, duration: 0.95, ease: "power3.inOut" }, 0.05);
        }
        return;
      }
      white.removeAttribute("clip-path");
      const targets = loaderRibbonPaths(svg.getBoundingClientRect().width, window.innerWidth);
      timeline.to(grayRef.current, { opacity: 0, duration: 0.12 }, 0);
      white.querySelectorAll("path").forEach((path, index) => {
        timeline!.to(path, {
          morphSVG: { shape: targets[index], map: "position", shapeIndex: "auto" },
          duration: 1.15,
          ease: "power3.inOut",
        }, 0.2);
      });
      // Once the ribbon is complete, uncover exactly the area hidden behind it.
      // Its fade then reveals the hero, with the curtains meeting its edges.
      timeline.set(root, { backgroundColor: "transparent" }, 1.35);
      timeline.set(topRef.current, { y: -LOADER_CURTAIN_REVEAL_OFFSET }, 1.35);
      timeline.set(bottomRef.current, { y: LOADER_CURTAIN_REVEAL_OFFSET }, 1.35);
      timeline.add(() => { root.dataset.phase = "opening"; }, 1.42);
      timeline.to(svg, { opacity: 0, duration: 0.38, ease: "power2.out" }, 1.42);
      timeline.to(topRef.current, { yPercent: -100, duration: 1, ease: "power3.inOut" }, 1.44);
      timeline.to(bottomRef.current, { yPercent: 100, duration: 1, ease: "power3.inOut" }, 1.44);
    };
    const tick = (_time: number, delta: number) => {
      const target = readyRef.current ? 1 : targetRef.current;
      const dt = Math.min(delta, 64) / 1000;
      state.fill += (target - state.fill) * (1 - Math.exp(-dt / (reduced ? 0.06 : 0.18)));
      paintFill();
      if (readyRef.current && state.fill >= 0.998) {
        state.fill = 1;
        paintFill();
        reveal();
      }
    };
    paintFill();
    skipRef.current = () => reveal(true);
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      timeline?.kill();
      skipRef.current = null;
      white.setAttribute("clip-path", `url(#${clipId})`);
      white.querySelectorAll("path").forEach((path, index) => path.setAttribute("d", LOADER_LOGO_PARTS[index].d));
    };
  }, [clipId]);

  return (
    <div ref={rootRef} className={styles.screen} data-phase="loading" aria-label="Menyiapkan Menuin">
      <div ref={topRef} className={styles.top} aria-hidden="true" />
      <div ref={bottomRef} className={styles.bottom} aria-hidden="true" />
      <svg ref={svgRef} className={styles.logo} viewBox={`${LOADER_LOGO_BOX.x} ${LOADER_LOGO_BOX.y} ${LOADER_LOGO_BOX.width} ${LOADER_LOGO_BOX.height}`} aria-hidden="true">
        <defs><clipPath id={clipId} clipPathUnits="userSpaceOnUse"><rect ref={fillRef} x={LOADER_LOGO_BOX.x - 1} y={LOADER_LOGO_BOX.y - 1} width="0" height={LOADER_LOGO_BOX.height + 2} /></clipPath></defs>
        <g ref={grayRef} fill="#d2d8e4" fillRule="evenodd">{LOADER_LOGO_PARTS.map(part => <path key={part.id} d={part.d} />)}</g>
        <g ref={whiteRef} fill="white" fillRule="evenodd" clipPath={`url(#${clipId})`}>{LOADER_LOGO_PARTS.map(part => <path key={part.id} d={part.d} />)}</g>
      </svg>
      <span role="status" aria-live="polite" className={styles.status}>{ready ? "Menuin siap." : "Menyiapkan Menuin."}</span>
      {canContinue && !ready && <button ref={continueRef} type="button" className={styles.continue} onClick={() => skipRef.current?.()}>Lanjutkan ke halaman <span aria-hidden="true">→</span></button>}
    </div>
  );
}
