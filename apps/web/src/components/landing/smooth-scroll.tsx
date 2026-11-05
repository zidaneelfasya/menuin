"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Smooth scroll (Lenis) khusus landing page.
 *
 * Dipasang di sini, bukan di root layout, supaya kasir dan dashboard tetap
 * memakai scroll asli browser — di layar kerja, scroll yang "meluncur"
 * justru mengganggu saat mengejar antrean.
 *
 * Lenis dan ScrollTrigger harus berbagi satu loop. Kalau keduanya jalan
 * sendiri-sendiri, posisi scroll yang dibaca ScrollTrigger tertinggal satu
 * frame dari posisi yang digambar Lenis, dan section yang di-pin akan
 * terlihat bergetar.
 */
export default function SmoothScroll() {
  useEffect(() => {
    // Smooth scroll mengubah kecepatan gulir dari yang diminta sistem.
    // Kalau pengguna minta gerak dikurangi, biarkan scroll apa adanya.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 0.55,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      wheelMultiplier: 0.85,
      smoothWheel: true,
      // A pinned story may consume a gesture before the page's smooth scroll.
      virtualScroll: (input) => {
        if (input.event.defaultPrevented) return false;
        const story = document.querySelector<HTMLElement>('#device-export-story[data-animated="true"]');
        const progress = Number(story?.dataset.progress);
        if (story && input.event.type === "wheel" && progress >= 0.64 && progress < 0.87 && !input.event.ctrlKey && !input.event.metaKey) {
          input.deltaY *= 0.45;
        }
        if (input.event.type === "wheel" && !input.event.ctrlKey && !input.event.metaKey) {
          const filter = (window as unknown as { __deviceStoryWheelFilter?: (delta: number, target: number) => number }).__deviceStoryWheelFilter;
          if (filter) {
            input.deltaY = filter(input.deltaY, lenis.targetScroll);
            if (!input.deltaY) { if (input.event.cancelable) input.event.preventDefault(); return false; }
          }
        }
        return true;
      },
      // Sentuh dibiarkan native: di ponsel, gulir yang dilambatkan terasa
      // seperti aplikasi yang tersendat.
      syncTouch: false,
    });

    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Anchor di nav ikut diluncurkan, bukan melompat.
    const onAnchorClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -72 });
    };

    document.addEventListener("click", onAnchorClick);
    ScrollTrigger.refresh();

    return () => {
      document.removeEventListener("click", onAnchorClick);
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
      lenis.destroy();
    };
  }, []);

  return null;
}
