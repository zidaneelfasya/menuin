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
      duration: 1.05,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      // Sentuh dibiarkan native: di ponsel, gulir yang dilambatkan terasa
      // seperti aplikasi yang tersendat.
      syncTouch: false,
    });

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
      lenis.destroy();
    };
  }, []);

  return null;
}
