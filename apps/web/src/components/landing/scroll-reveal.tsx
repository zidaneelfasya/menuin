"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Reveal saat elemen masuk layar. Anak langsungnya naik satu per satu.
 *
 * Elemen tetap terlihat kalau JavaScript belum jalan atau pengguna memilih
 * reduced motion — animasi hanya menambah, tidak pernah jadi syarat supaya
 * konten muncul.
 */
export function ScrollReveal({
  children,
  className = "",
  stagger = 0.08,
  y = 24,
  start = "top 85%",
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  y?: number;
  start?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const el = ref.current;
      if (!el) return;

      const targets = el.children.length > 1 ? Array.from(el.children) : el;

      const tween = gsap.from(targets, {
        opacity: 0,
        y,
        duration: 0.8,
        ease: "power3.out",
        stagger,
        scrollTrigger: { trigger: el, start, once: true },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });

    return () => mm.revert();
  }, [stagger, y, start]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/**
 * Urutan masuk hero saat halaman dibuka — satu momen yang ditata,
 * bukan efek yang bertaburan.
 */
export function HeroIntro({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const el = ref.current;
      if (!el) return;

      const items = el.querySelectorAll("[data-hero-item]");
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(items, { opacity: 0, y: 28, duration: 0.9, stagger: 0.09 });

      return () => {
        tl.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return <div ref={ref}>{children}</div>;
}
