"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";

// Dynamic import with SSR disabled for Three.js WebGL Canvas
const Hero3DScene = dynamic(() => import("./hero-3d-scene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-[#0854f8]" />
        <span className="text-[13px] font-medium tracking-tight text-slate-400">
          Memuat Ruang 3D...
        </span>
      </div>
    </div>
  ),
});

// Bersus-inspired discrete stage targets across the 6-stage showcase:
// Stage 0: 0.00 (Silhouette on studio floor)
// Stage 1: 0.22 (Floor standing, lit PBR)
// Stage 2: 0.44 (Float Master Shot, orbit completed)
// Stage 3: 0.68 (MacBook Pro cinematic rule-of-thirds)
// Stage 4: 0.90 (iPhone 14 Pro Max cinematic rule-of-thirds)
// Stage 5: 1.00 (Final Master Hero shot + CTA)
const STAGE_SILHOUETTE = 0.0;
const STAGE_STAND = 0.22;
const STAGE_FLOAT = 0.44;
const STAGE_MACBOOK = 0.68;
const STAGE_IPHONE = 0.90;
const STAGE_HERO = 1.0;

const STAGE_TARGETS = [
  STAGE_SILHOUETTE,
  STAGE_STAND,
  STAGE_FLOAT,
  STAGE_MACBOOK,
  STAGE_IPHONE,
  STAGE_HERO,
];

// Threshold to commit to next/prev stage (approx 1.5 - 2 scroll ticks for snappier feel)
const SCROLL_THRESHOLD = 150;
// Maximum visual displacement nudge before threshold is reached
const MAX_NUDGE = 0.024;

export default function HeroScrollShowcase({
  isLoggedIn = false,
}: {
  isLoggedIn?: boolean;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [sceneVisible, setSceneVisible] = useState(true);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let inView = true;
    const update = () => setSceneVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); });
    observer.observe(section);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);

  // Overlay element refs
  const topTextRef = useRef<HTMLDivElement>(null);
  const ctaWrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const magneticCircleRef = useRef<HTMLSpanElement>(null);
  const magneticTextRef = useRef<HTMLSpanElement>(null);
  const ctaArrowRef = useRef<HTMLSpanElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);

  // State machine refs
  // mode: "stage" (parked at discrete stage) | "orbit" (free momentum glide between 0.22 and 0.44)
  const modeRef = useRef<"stage" | "orbit">("stage");
  const accumDeltaRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const progressProxyRef = useRef({ val: 0 });
  const currentProgressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const lastWheelTimeRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Heavy Ice Glide Momentum Physics Refs (Curling Stone on Ice Model)
  const orbitVelocityRef = useRef(0);
  const lastFrameTimeRef = useRef(0);

  // Smoothly update UI overlays based on 3D progress
  const updateOverlays = useCallback((p: number) => {
    const ctaEl = ctaWrapRef.current;
    const topTextEl = topTextRef.current;
    const scrollHintEl = scrollHintRef.current;

    // Active visibility for top brand text ("Simple. Modern. Efficient.")
    // and bottom CTA button ("Coba menuin sekarang"):
    // - Hidden in Stage 1 Silhouette (p < 0.06)
    // - Visible in Stage 2 (Floor lit, p = 0.22) & Stage 3 (Orbit glide, p = 0.22 .. 0.44)
    // - Hidden during Stage 4 (MacBook closeup) & Stage 5 (iPhone closeup)
    // - Reappears after Stage 5 finishes (Final Master Ecosystem Shot, p >= 0.92 .. 1.00)
    let activeAlpha = 0;
    if (p < 0.06) {
      activeAlpha = 0;
    } else if (p < 0.18) {
      activeAlpha = (p - 0.06) / 0.12;
    } else if (p <= 0.46) {
      activeAlpha = 1;
    } else if (p <= 0.54) {
      activeAlpha = 1 - (p - 0.46) / 0.08;
    } else if (p < 0.92) {
      activeAlpha = 0;
    } else {
      activeAlpha = (p - 0.92) / 0.08;
    }
    activeAlpha = gsap.utils.clamp(0, 1, activeAlpha);

    // Top text ("Simple. Modern. Efficient.")
    if (topTextEl) {
      gsap.to(topTextEl, {
        autoAlpha: activeAlpha,
        y: (1 - activeAlpha) * -12,
        filter: `blur(${(1 - activeAlpha) * 4}px)`,
        duration: 0.2,
        overwrite: "auto",
      });
    }

    // Bottom CTA button ("Coba menuin sekarang")
    if (ctaEl) {
      gsap.to(ctaEl, {
        autoAlpha: activeAlpha,
        y: (1 - activeAlpha) * 20,
        filter: `blur(${(1 - activeAlpha) * 4}px)`,
        duration: 0.2,
        overwrite: "auto",
      });
    }

    // Bersus scroll hint at bottom right (only visible in Stage 1 silhouette)
    if (scrollHintEl) {
      const hintAlpha = p < 0.05 ? 1 : 0;
      gsap.to(scrollHintEl, {
        autoAlpha: hintAlpha,
        duration: 0.2,
        overwrite: "auto",
      });
    }
  }, []);

  // Magnetic button hover interactions (subtle 3D magnetic cursor tracking with elastic return)
  const handleButtonMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);

    // Subtle magnetic attraction on the pill button
    gsap.to(btn, {
      x: x * 0.16,
      y: y * 0.20,
      duration: 0.28,
      ease: "power2.out",
      overwrite: "auto",
    });

    // Independent magnetic parallax on the blue icon circle
    if (magneticCircleRef.current) {
      gsap.to(magneticCircleRef.current, {
        x: x * 0.12,
        y: y * 0.15,
        duration: 0.28,
        ease: "power2.out",
        overwrite: "auto",
      });
    }

    // Gentle magnetic shift on text
    if (magneticTextRef.current) {
      gsap.to(magneticTextRef.current, {
        x: x * 0.08,
        y: y * 0.10,
        duration: 0.28,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  }, []);

  const handleButtonMouseLeave = useCallback(() => {
    const btn = buttonRef.current;
    if (btn) {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.65,
        ease: "elastic.out(1.15, 0.4)",
        overwrite: "auto",
      });
    }
    if (magneticCircleRef.current) {
      gsap.to(magneticCircleRef.current, {
        x: 0,
        y: 0,
        duration: 0.65,
        ease: "elastic.out(1.15, 0.4)",
        overwrite: "auto",
      });
    }
    if (magneticTextRef.current) {
      gsap.to(magneticTextRef.current, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        overwrite: "auto",
      });
    }
  }, []);

  // Helper to interact with global Lenis instance
  const getLenis = useCallback(
    () =>
      (
        window as unknown as {
          __lenis?: {
            stop: () => void;
            start: () => void;
            scrollTo: (target: number | HTMLElement, opts?: any) => void;
          };
        }
      ).__lenis,
    []
  );

  const lockPageScroll = useCallback(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    }
    const lenis = getLenis();
    lenis?.stop();
    if (typeof window !== "undefined" && window.scrollY !== 0) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [getLenis]);

  const unlockPageScroll = useCallback(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    const lenis = getLenis();
    lenis?.start();
  }, [getLenis]);

  // Smooth non-linear GSAP transition between discrete camera stages
  // Uses power2.inOut curve for cinematic camera crane acceleration & deceleration
  const triggerStageTransition = useCallback(
    (targetVal: number, duration = 0.95, ease: string = "power3.inOut") => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      orbitVelocityRef.current = 0;
      gsap.killTweensOf(progressProxyRef.current);
      accumDeltaRef.current = 0;
      isAnimatingRef.current = true;
      lockPageScroll();

      targetProgressRef.current = targetVal;
      progressProxyRef.current.val = currentProgressRef.current;

      gsap.to(progressProxyRef.current, {
        val: targetVal,
        duration: duration,
        ease: ease,
        overwrite: true,
        onUpdate: () => {
          const current = progressProxyRef.current.val;
          currentProgressRef.current = current;
          setScrollProgress(current);
          updateOverlays(current);
        },
        onComplete: () => {
          isAnimatingRef.current = false;
          currentProgressRef.current = targetVal;
          targetProgressRef.current = targetVal;
          progressProxyRef.current.val = targetVal;
          modeRef.current = "stage";
          setScrollProgress(targetVal);
          updateOverlays(targetVal);

          if (targetVal >= 0.999) {
            unlockPageScroll();
          }
        },
      });
    },
    [lockPageScroll, unlockPageScroll, updateOverlays]
  );

  const jumpToStage = useCallback(
    (stageVal: number) => {
      triggerStageTransition(stageVal, 0.75);
    },
    [triggerStageTransition]
  );

  // Elastic spring back to base stage when user scrolls less than threshold
  const springBackToStage = useCallback(
    (baseStage: number) => {
      if (modeRef.current !== "stage" || isAnimatingRef.current) return;
      accumDeltaRef.current = 0;
      progressProxyRef.current.val = currentProgressRef.current;

      gsap.to(progressProxyRef.current, {
        val: baseStage,
        duration: 0.26,
        ease: "power2.out",
        overwrite: true,
        onUpdate: () => {
          const current = progressProxyRef.current.val;
          currentProgressRef.current = current;
          targetProgressRef.current = current;
          setScrollProgress(current);
          updateOverlays(current);
        },
      });
    },
    [updateOverlays]
  );

  // Free momentum ice glide for Stage 2 -> 3 Orbit (p in [0.22, 0.44])
  // Physics model: Heavy Mass with Controlled Glide & Zero-Blink Seamless Docking
  const startOrbitGlide = useCallback(() => {
    if (rafIdRef.current !== null) return;
    lastFrameTimeRef.current = performance.now();

    const tick = (now: number) => {
      if (modeRef.current !== "orbit" || isAnimatingRef.current) {
        rafIdRef.current = null;
        return;
      }

      const rawDt = (now - lastFrameTimeRef.current) / 1000;
      // Clamp dt to avoid physics leaps on background tab switch (1ms to 50ms)
      const dt = Math.max(0.001, Math.min(rawDt, 0.05));
      lastFrameTimeRef.current = now;

      let vel = orbitVelocityRef.current;
      let current = currentProgressRef.current;

      // Silky extended ice kinetic friction (smooth, sustained glide lasting ~1.4 - 1.8s)
      const frictionDecay = Math.pow(0.965, dt * 60);
      vel *= frictionDecay;

      // Integrate position along orbit curve (100% uniform ice surface all the way to 100% without artificial mud brakes)
      let next = current + vel * dt;

      // -------------------------------------------------------------
      // Forward Boundary Arrival: STAGE_FLOAT (0.44 -> Stage 4 MacBook Focus)
      // -------------------------------------------------------------
      if (next >= STAGE_FLOAT) {
        currentProgressRef.current = STAGE_FLOAT;
        progressProxyRef.current.val = STAGE_FLOAT;
        setScrollProgress(STAGE_FLOAT);
        updateOverlays(STAGE_FLOAT);

        // Balanced intentional threshold for momentum carryover (prevents accidental trigger from casual glide)
        const residualGlide = (next - STAGE_FLOAT) + (vel / 2.137);
        const hasCarryoverMomentum = vel >= 0.026 || residualGlide >= 0.012;

        if (hasCarryoverMomentum) {
          // Carry over momentum seamlessly into Stage 4 (MacBook Pro Focus)
          orbitVelocityRef.current = 0;
          accumDeltaRef.current = 0;
          modeRef.current = "stage";
          rafIdRef.current = null;

          // Responsive duration: faster incoming glide produces snappier transition (0.58s - 0.72s)
          const transitionDuration = Math.max(0.58, 0.72 - Math.min(0.14, vel * 1.5));
          triggerStageTransition(STAGE_MACBOOK, transitionDuration, "power2.out");
          return;
        }

        // When threshold is not reached: show slight scroll nudge, hit barrier (mentok), and spring back
        if (vel > 0.003 || residualGlide > 0.002) {
          orbitVelocityRef.current = 0;
          modeRef.current = "stage";
          rafIdRef.current = null;

          const nudgeRatio = Math.min(1, Math.max(0.2, residualGlide / 0.012));
          const peakNudgedVal = STAGE_FLOAT + nudgeRatio * 0.012;
          accumDeltaRef.current = Math.round(nudgeRatio * 65);

          gsap.killTweensOf(progressProxyRef.current);
          progressProxyRef.current.val = STAGE_FLOAT;

          gsap.to(progressProxyRef.current, {
            val: peakNudgedVal,
            duration: 0.16,
            ease: "power2.out",
            overwrite: true,
            onUpdate: () => {
              const current = progressProxyRef.current.val;
              currentProgressRef.current = current;
              targetProgressRef.current = current;
              setScrollProgress(current);
              updateOverlays(current);
            },
            onComplete: () => {
              springBackToStage(STAGE_FLOAT);
            },
          });
          return;
        }

        // Gentle coasting landing: park softly at Stage 3 Float Master Shot
        targetProgressRef.current = STAGE_FLOAT;
        orbitVelocityRef.current = 0;
        modeRef.current = "stage";
        accumDeltaRef.current = 0;
        rafIdRef.current = null;
        return;
      }

      // -------------------------------------------------------------
      // Backward Boundary Arrival: STAGE_STAND (0.22 -> Stage 1 Silhouette)
      // -------------------------------------------------------------
      if (next <= STAGE_STAND) {
        currentProgressRef.current = STAGE_STAND;
        progressProxyRef.current.val = STAGE_STAND;
        setScrollProgress(STAGE_STAND);
        updateOverlays(STAGE_STAND);

        // Balanced intentional threshold for reverse momentum carryover
        const residualGlide = (STAGE_STAND - next) + (Math.abs(vel) / 2.137);
        const hasCarryoverMomentum = vel <= -0.026 || residualGlide >= 0.012;

        if (hasCarryoverMomentum) {
          // Carry over reverse momentum seamlessly into Stage 1 (Silhouette)
          orbitVelocityRef.current = 0;
          accumDeltaRef.current = 0;
          modeRef.current = "stage";
          rafIdRef.current = null;

          const transitionDuration = Math.max(0.56, 0.70 - Math.min(0.14, Math.abs(vel) * 1.5));
          triggerStageTransition(STAGE_SILHOUETTE, transitionDuration, "power2.out");
          return;
        }

        // When threshold is not reached: show slight scroll nudge, hit barrier (mentok), and spring back
        if (vel < -0.003 || residualGlide > 0.002) {
          orbitVelocityRef.current = 0;
          modeRef.current = "stage";
          rafIdRef.current = null;

          const nudgeRatio = Math.min(1, Math.max(0.2, residualGlide / 0.012));
          const peakNudgedVal = STAGE_STAND - nudgeRatio * 0.012;
          accumDeltaRef.current = -Math.round(nudgeRatio * 65);

          gsap.killTweensOf(progressProxyRef.current);
          progressProxyRef.current.val = STAGE_STAND;

          gsap.to(progressProxyRef.current, {
            val: peakNudgedVal,
            duration: 0.16,
            ease: "power2.out",
            overwrite: true,
            onUpdate: () => {
              const current = progressProxyRef.current.val;
              currentProgressRef.current = current;
              targetProgressRef.current = current;
              setScrollProgress(current);
              updateOverlays(current);
            },
            onComplete: () => {
              springBackToStage(STAGE_STAND);
            },
          });
          return;
        }

        // Gentle coasting landing: park softly at Stage 2 Stand Floor
        targetProgressRef.current = STAGE_STAND;
        orbitVelocityRef.current = 0;
        modeRef.current = "stage";
        accumDeltaRef.current = 0;
        rafIdRef.current = null;
        return;
      }

      orbitVelocityRef.current = vel;
      currentProgressRef.current = next;
      targetProgressRef.current = next;
      progressProxyRef.current.val = next;
      setScrollProgress(next);
      updateOverlays(next);

      // If velocity has decayed to a stop in mid-orbit, pause RAF loop until next user scroll
      if (Math.abs(vel) < 0.00015) {
        orbitVelocityRef.current = 0;
        rafIdRef.current = null;
        return;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, [updateOverlays, triggerStageTransition, springBackToStage]);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    if (!sectionEl) return;

    // Reset window scroll to top and disable browser scroll restoration
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    // Initial state
    gsap.set(topTextRef.current, { autoAlpha: 0, y: -12, filter: "blur(6px)" });
    gsap.set(ctaWrapRef.current, { autoAlpha: 0, y: 30, filter: "blur(6px)" });
    gsap.set(scrollHintRef.current, { autoAlpha: 1 });

    // Lock page scroll initially
    lockPageScroll();
    const lenisTimer = setTimeout(lockPageScroll, 120);

    // Core unified input processor for both Wheel and Touch deltas
    const processScrollDelta = (deltaY: number) => {
      if (isAnimatingRef.current) return;

      // -------------------------------------------------------------
      // 1. ORBIT MODE (0.22 <-> 0.44 Heavy Ice Glide Momentum)
      // -------------------------------------------------------------
      if (modeRef.current === "orbit") {
        lastWheelTimeRef.current = performance.now();
        const absDelta = Math.abs(deltaY);
        const sign = Math.sign(deltaY);

        // Sublinear force curve: feels heavy and solid,
        // while powering an extended, silky ice glide
        const impulse = sign * Math.min(0.022, Math.pow(absDelta, 0.70) * 0.00055);

        // Heavy momentum cap: prevents fast skipping through the orbit
        const MAX_ORBIT_VEL = 0.11;
        const newVel = orbitVelocityRef.current + impulse;
        orbitVelocityRef.current = Math.max(-MAX_ORBIT_VEL, Math.min(MAX_ORBIT_VEL, newVel));

        startOrbitGlide();
        return;
      }

      // -------------------------------------------------------------
      // 2. STAGE MODE (Discrete Threshold-Triggered States)
      // -------------------------------------------------------------
      const curr = currentProgressRef.current;

      // Helper to identify nearest base stage
      let baseStage = STAGE_TARGETS[0];
      let minDiff = 999;
      for (const st of STAGE_TARGETS) {
        const d = Math.abs(curr - st);
        if (d < minDiff) {
          minDiff = d;
          baseStage = st;
        }
      }

      // STAGE 0: SILHOUETTE (0.00)
      if (baseStage === STAGE_SILHOUETTE) {
        if (deltaY > 0) {
          gsap.killTweensOf(progressProxyRef.current);
          accumDeltaRef.current += deltaY;
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

          if (accumDeltaRef.current >= SCROLL_THRESHOLD) {
            triggerStageTransition(STAGE_STAND, 0.72);
          } else {
            const ratio = Math.min(1, accumDeltaRef.current / SCROLL_THRESHOLD);
            const nudgedVal = STAGE_SILHOUETTE + ratio * MAX_NUDGE;
            currentProgressRef.current = nudgedVal;
            targetProgressRef.current = nudgedVal;
            progressProxyRef.current.val = nudgedVal;
            setScrollProgress(nudgedVal);
            updateOverlays(nudgedVal);
            debounceTimerRef.current = setTimeout(
              () => springBackToStage(STAGE_SILHOUETTE),
              260
            );
          }
        }
        return;
      }

      // STAGE 1: STAND FLOOR (0.22)
      if (baseStage === STAGE_STAND) {
        if (deltaY < 0) {
          // Scroll up -> return to silhouette
          gsap.killTweensOf(progressProxyRef.current);
          accumDeltaRef.current += deltaY;
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

          const TRANSITION_THRESHOLD = 115; // Balanced deliberate threshold (prevents hair-trigger switching)
          if (accumDeltaRef.current <= -TRANSITION_THRESHOLD) {
            triggerStageTransition(STAGE_SILHOUETTE, 0.72);
          } else {
            const ratio = Math.min(1, Math.abs(accumDeltaRef.current) / TRANSITION_THRESHOLD);
            const nudgedVal = STAGE_STAND - ratio * MAX_NUDGE;
            currentProgressRef.current = nudgedVal;
            targetProgressRef.current = nudgedVal;
            progressProxyRef.current.val = nudgedVal;
            setScrollProgress(nudgedVal);
            updateOverlays(nudgedVal);
            debounceTimerRef.current = setTimeout(
              () => springBackToStage(STAGE_STAND),
              240
            );
          }
        } else if (deltaY > 0) {
          // Scroll down -> Enter Orbit Mode with initial heavy ice glide impulse
          accumDeltaRef.current = 0;
          modeRef.current = "orbit";
          const absDelta = Math.abs(deltaY);
          const initialImpulse = Math.min(0.022, Math.pow(absDelta, 0.70) * 0.00055);
          orbitVelocityRef.current = Math.max(0.012, initialImpulse);
          startOrbitGlide();
        }
        return;
      }

      // STAGE 2: FLOAT MASTER SHOT (0.44)
      if (baseStage === STAGE_FLOAT) {
        if (deltaY > 0) {
          // Scroll down -> Trigger Stage 4 (MacBook Pro)
          gsap.killTweensOf(progressProxyRef.current);
          accumDeltaRef.current += deltaY;
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

          const TRANSITION_THRESHOLD = 115; // Balanced deliberate threshold (prevents hair-trigger switching)
          if (accumDeltaRef.current >= TRANSITION_THRESHOLD) {
            triggerStageTransition(STAGE_MACBOOK, 0.75);
          } else {
            const ratio = Math.min(1, accumDeltaRef.current / TRANSITION_THRESHOLD);
            const nudgedVal = STAGE_FLOAT + ratio * 0.014;
            currentProgressRef.current = nudgedVal;
            targetProgressRef.current = nudgedVal;
            progressProxyRef.current.val = nudgedVal;
            setScrollProgress(nudgedVal);
            updateOverlays(nudgedVal);
            debounceTimerRef.current = setTimeout(
              () => springBackToStage(STAGE_FLOAT),
              240
            );
          }
        } else if (deltaY < 0) {
          // Scroll up -> Re-enter Orbit Mode in reverse with heavy ice glide impulse
          accumDeltaRef.current = 0;
          modeRef.current = "orbit";
          const absDelta = Math.abs(deltaY);
          const initialImpulse = -Math.min(0.022, Math.pow(absDelta, 0.70) * 0.00055);
          orbitVelocityRef.current = Math.min(-0.012, initialImpulse);
          startOrbitGlide();
        }
        return;
      }

      // STAGE 3: MACBOOK PRO FOCUS (0.68)
      if (baseStage === STAGE_MACBOOK) {
        gsap.killTweensOf(progressProxyRef.current);
        accumDeltaRef.current += deltaY;
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        if (accumDeltaRef.current >= SCROLL_THRESHOLD) {
          // Trigger Stage 5 (iPhone)
          triggerStageTransition(STAGE_IPHONE, 0.78);
        } else if (accumDeltaRef.current <= -SCROLL_THRESHOLD) {
          // Trigger back to Stage 3 (Float)
          triggerStageTransition(STAGE_FLOAT, 0.72);
        } else {
          const ratio = accumDeltaRef.current / SCROLL_THRESHOLD;
          const nudgedVal = STAGE_MACBOOK + ratio * 0.014;
          currentProgressRef.current = nudgedVal;
          targetProgressRef.current = nudgedVal;
          progressProxyRef.current.val = nudgedVal;
          setScrollProgress(nudgedVal);
          updateOverlays(nudgedVal);
          debounceTimerRef.current = setTimeout(
            () => springBackToStage(STAGE_MACBOOK),
            260
          );
        }
        return;
      }

      // STAGE 4: IPHONE 14 PRO MAX FOCUS (0.90)
      if (baseStage === STAGE_IPHONE) {
        gsap.killTweensOf(progressProxyRef.current);
        accumDeltaRef.current += deltaY;
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        if (accumDeltaRef.current >= SCROLL_THRESHOLD) {
          // Trigger Stage 6 (Final Hero)
          triggerStageTransition(STAGE_HERO, 0.72);
        } else if (accumDeltaRef.current <= -SCROLL_THRESHOLD) {
          // Trigger back to Stage 4 (MacBook)
          triggerStageTransition(STAGE_MACBOOK, 0.78);
        } else {
          const ratio = accumDeltaRef.current / SCROLL_THRESHOLD;
          const nudgedVal = STAGE_IPHONE + ratio * 0.012;
          currentProgressRef.current = nudgedVal;
          targetProgressRef.current = nudgedVal;
          progressProxyRef.current.val = nudgedVal;
          setScrollProgress(nudgedVal);
          updateOverlays(nudgedVal);
          debounceTimerRef.current = setTimeout(
            () => springBackToStage(STAGE_IPHONE),
            260
          );
        }
        return;
      }

      // STAGE 5: FINAL HERO SHOT (1.00)
      if (baseStage === STAGE_HERO) {
        if (deltaY < 0) {
          gsap.killTweensOf(progressProxyRef.current);
          accumDeltaRef.current += deltaY;
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

          if (accumDeltaRef.current <= -SCROLL_THRESHOLD) {
            triggerStageTransition(STAGE_IPHONE, 0.72);
          } else {
            const ratio = Math.min(1, Math.abs(accumDeltaRef.current) / SCROLL_THRESHOLD);
            const nudgedVal = STAGE_HERO - ratio * 0.012;
            currentProgressRef.current = nudgedVal;
            targetProgressRef.current = nudgedVal;
            progressProxyRef.current.val = nudgedVal;
            setScrollProgress(nudgedVal);
            updateOverlays(nudgedVal);
            debounceTimerRef.current = setTimeout(
              () => springBackToStage(STAGE_HERO),
              260
            );
          }
        }
        return;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      const isAtEnd =
        modeRef.current === "stage" &&
        Math.abs(currentProgressRef.current - STAGE_HERO) < 0.005;

      // When at the final stage (p = 1.00):
      if (isAtEnd) {
        if (e.deltaY > 0) {
          // Allow native/Lenis scroll to proceed downward into the rest of the landing page
          unlockPageScroll();
          return;
        } else if (e.deltaY < 0 && window.scrollY <= 10) {
          // User is at the top of the landing page scrolling UP back into 3D showcase
          lockPageScroll();
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        } else {
          // User is further down the page
          return;
        }
      } else {
        // Inside 3D showcase: intercept and lock completely
        lockPageScroll();
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }

      processScrollDelta(e.deltaY);
    };

    // Mobile touch support
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const isAtEnd =
        modeRef.current === "stage" &&
        Math.abs(currentProgressRef.current - STAGE_HERO) < 0.005;
      const currentY = e.touches[0].clientY;
      const deltaY = (touchStartY - currentY) * 2.2;
      touchStartY = currentY;

      if (isAtEnd) {
        if (deltaY > 0) {
          unlockPageScroll();
          return;
        } else if (deltaY < 0 && window.scrollY <= 10) {
          lockPageScroll();
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        } else {
          return;
        }
      } else {
        lockPageScroll();
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }

      processScrollDelta(deltaY);
    };

    const handleTouchEnd = () => {
      if (modeRef.current === "stage" && !isAnimatingRef.current && accumDeltaRef.current !== 0) {
        let baseStage = STAGE_TARGETS[0];
        let minDiff = 999;
        for (const st of STAGE_TARGETS) {
          const d = Math.abs(currentProgressRef.current - st);
          if (d < minDiff) {
            minDiff = d;
            baseStage = st;
          }
        }
        springBackToStage(baseStage);
      }
    };

    // Keyboard support
    const handleKeyDown = (e: KeyboardEvent) => {
      const isAtEnd =
        modeRef.current === "stage" &&
        Math.abs(currentProgressRef.current - STAGE_HERO) < 0.005;
      if (isAtEnd && window.scrollY > 15) return;
      if (isAnimatingRef.current) return;

      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        if (isAtEnd) return;
        e.preventDefault();
        if (modeRef.current === "orbit") {
          orbitVelocityRef.current = Math.min(0.11, orbitVelocityRef.current + 0.025);
          startOrbitGlide();
        } else {
          const curr = currentProgressRef.current;
          const nextStage = STAGE_TARGETS.find((pt) => pt > curr + 0.02);
          if (nextStage !== undefined) {
            if (nextStage === STAGE_FLOAT && curr <= STAGE_STAND + 0.02) {
              // Trigger forward through orbit with heavy ice glide momentum
              modeRef.current = "orbit";
              orbitVelocityRef.current = 0.040;
              startOrbitGlide();
            } else {
              triggerStageTransition(
                nextStage,
                nextStage === STAGE_IPHONE || nextStage === STAGE_MACBOOK ? 0.78 : 0.72
              );
            }
          }
        }
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        if (window.scrollY > 15) return;
        e.preventDefault();
        if (modeRef.current === "orbit") {
          orbitVelocityRef.current = Math.max(-0.11, orbitVelocityRef.current - 0.025);
          startOrbitGlide();
        } else {
          const curr = currentProgressRef.current;
          const prevStages = STAGE_TARGETS.filter((pt) => pt < curr - 0.02);
          const prevStage = prevStages.length > 0 ? prevStages[prevStages.length - 1] : undefined;
          if (prevStage !== undefined) {
            if (prevStage === STAGE_STAND && curr <= STAGE_FLOAT + 0.02) {
              // Rewind through orbit with heavy ice glide momentum
              modeRef.current = "orbit";
              orbitVelocityRef.current = -0.040;
              startOrbitGlide();
            } else {
              triggerStageTransition(
                prevStage,
                prevStage === STAGE_MACBOOK || prevStage === STAGE_IPHONE ? 0.78 : 0.72
              );
            }
          }
        }
      }
    };

    // Fallback: strictly prevent window scroll while inside 3D showcase
    const handleScroll = () => {
      const isAtEnd =
        modeRef.current === "stage" &&
        Math.abs(currentProgressRef.current - STAGE_HERO) < 0.005;
      if (!isAtEnd && window.scrollY !== 0) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true, capture: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false, capture: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true, capture: true });
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("scroll", handleScroll, { passive: false });

    return () => {
      clearTimeout(lenisTimer);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      unlockPageScroll();
      window.removeEventListener("wheel", handleWheel, { capture: true });
      window.removeEventListener("touchstart", handleTouchStart, { capture: true });
      window.removeEventListener("touchmove", handleTouchMove, { capture: true });
      window.removeEventListener("touchend", handleTouchEnd, { capture: true });
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("scroll", handleScroll);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (buttonRef.current) gsap.killTweensOf(buttonRef.current);
      if (magneticCircleRef.current) gsap.killTweensOf(magneticCircleRef.current);
      if (magneticTextRef.current) gsap.killTweensOf(magneticTextRef.current);
    };
  }, [
    lockPageScroll,
    springBackToStage,
    startOrbitGlide,
    triggerStageTransition,
    unlockPageScroll,
    updateOverlays,
  ]);

  return (
    <section
      ref={sectionRef}
      aria-label="Menuin Interactive 3D Showcase"
      className="relative -mt-16 h-[calc(100vh+5rem)] min-h-[calc(100vh+5rem)] w-full bg-white select-none overflow-hidden"
    >
      {/* Fullscreen Sticky Viewport (100vh) */}
      <div className="sticky top-0 flex h-screen min-h-[100vh] w-full items-center justify-center overflow-hidden bg-white">
        {/* Ambient Subtle Radial Gradient Background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(235,243,255,0.7)_0%,rgba(255,255,255,1)_100%)]"
        />

        {/* 3D Canvas Scene */}
        <Hero3DScene progress={scrollProgress} active={sceneVisible} />

        {/* ================================================================ */}
        {/* TOP BRAND TEXT ("Simple. Modern. Efficient.")                     */}
        {/* Appears in Stage 2 & 3, and after Stage 5 finishes                */}
        {/* ================================================================ */}
        <div
          ref={topTextRef}
          className="pointer-events-none absolute inset-x-0 top-[8vh] z-30 flex justify-center px-4 will-change-transform sm:top-[10vh] md:top-[18vh]"
        >
          <span className="text-[19px] font-medium tracking-tight text-[#0a0a0a] sm:text-[23px] md:text-[26px]">
            Simple. Modern. Efficient.
          </span>
        </div>

        {/* ================================================================ */}
        {/* BERSUS-STYLE SCROLL HINT (Visible in Stage 1 silhouette)          */}
        {/* ================================================================ */}
        <div
          ref={scrollHintRef}
          onClick={() => triggerStageTransition(STAGE_STAND, 0.72)}
          className="cursor-pointer absolute bottom-[6vh] right-8 z-30 flex flex-col items-center gap-2 will-change-transform sm:right-12"
        >
          <div className="flex h-8 w-5 items-start justify-center rounded-full border border-slate-300/80 bg-white/70 p-1 shadow-xs backdrop-blur-xs transition-transform hover:scale-110">
            <div className="h-1.5 w-1 animate-bounce rounded-full bg-slate-600" />
          </div>
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-slate-400">
            scroll down
          </span>
        </div>

        {/* ================================================================ */}
        {/* BOTTOM CTA BUTTON ("Coba menuin sekarang")                        */}
        {/* User Visual Redesign: Pure white pill, crisp border, deep black   */}
        {/* text, prominent Menuin blue circle with white arrow.              */}
        {/* Modern Interactive Animations (NO COLOR CHANGE):                  */}
        {/* 1. Dual-arrow continuous slingshot launch (Linear/Stripe pattern) */}
        {/* 2. Elastic spring expansion on the blue circle                    */}
        {/* 3. Kinetic text drift responding to hover                         */}
        {/* 4. Fluid 3D magnetic cursor attraction with parallax depth        */}
        {/* 5. Tactile elastic return on mouse leave                          */}
        {/* ================================================================ */}
        <div
          ref={ctaWrapRef}
          className="absolute inset-x-0 bottom-[7.5vh] z-40 flex justify-center px-6 will-change-transform sm:bottom-[8.5vh]"
        >
          <Link
            ref={buttonRef}
            href={isLoggedIn ? "/select-tenant" : "/auth/signup"}
            onMouseMove={handleButtonMouseMove}
            onMouseLeave={handleButtonMouseLeave}
            className="group relative inline-flex h-14 sm:h-[60px] items-center justify-center gap-5 sm:gap-7 rounded-full border border-slate-200/80 bg-white pl-7 sm:pl-8 pr-2 sm:pr-2.5 text-[15.5px] sm:text-[16.5px] font-medium tracking-[-0.01em] text-[#0a0a0a] shadow-none select-none transition-shadow duration-300 ease-out active:scale-[0.98] will-change-transform"
          >
            <span
              ref={magneticTextRef}
              className="whitespace-nowrap font-medium text-[#0a0a0a] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1 will-change-transform"
            >
              Coba menuin sekarang
            </span>
            <span
              ref={magneticCircleRef}
              className="relative flex size-11 sm:size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0e59f9] shadow-none transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-108 will-change-transform"
            >
              {/* Primary arrow: glides top-right and exits */}
              <ArrowUpRight className="size-5 sm:size-5.5 stroke-[2.5] text-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-7 group-hover:-translate-y-7 will-change-transform" />
              {/* Secondary arrow: glides into center from bottom-left */}
              <ArrowUpRight className="absolute size-5 sm:size-5.5 stroke-[2.5] text-white -translate-x-7 translate-y-7 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0 group-hover:translate-y-0 will-change-transform" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
