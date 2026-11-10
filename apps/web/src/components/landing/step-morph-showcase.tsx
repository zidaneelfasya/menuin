"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import type Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import GradientWaves, {
  GradientWavesScrollDriver,
  parseWaveColor,
} from "./GradientWaves";

/**
 * ============================================================================
 * KONFIGURASI ASET & STEP-BY-STEP MENUIN
 * Ubah path gambar `imageSrc`, `title`, `subtitle`, atau `waveColors` di bawah
 * kapan saja untuk menyesuaikan tampilan layar & warna gelombang tiap step.
 * ============================================================================
 */
export interface StepWaveColors {
  horizon: string;
  shadow: string;
  wave: string;
  crest: string;
}

export interface StepShowcaseItem {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  deviceType: "phone" | "tablet";
  imageSrc: string;
  imageAlt: string;
  /** Warna bezel/frame mockup pada step ini */
  bezelColor: string;
  /** Palet warna GradientWaves di sisi kiri pada step ini */
  waveColors: StepWaveColors;
}

export const STEP_SHOWCASE_ITEMS: StepShowcaseItem[] = [
  {
    id: "storefront",
    number: "01",
    title: "Tampilan Storefront & Katalog Meja",
    subtitle:
      "Pelanggan scan QR di meja dan langsung memilih produk favorit tanpa aplikasi.",
    deviceType: "phone",
    imageSrc: "/menuin-vert-white.png",
    imageAlt: "Tampilan Storefront Menuin di Smartphone",
    // Warna awal: putih agak kebiruan
    bezelColor: "#dbeafe",
    waveColors: {
      horizon: "#0e59f9",
      shadow: "#06329c",
      wave: "#2e77ff",
      crest: "#93c5fd",
    },
  },
  {
    id: "payment",
    number: "02",
    title: "Pembayaran Digital Instan",
    subtitle:
      "Checkout langsung dari meja dengan QRIS maupun metode pembayaran digital lainnya.",
    deviceType: "phone",
    imageSrc: "/menuin-vert-blue.png",
    imageAlt: "Halaman Pembayaran Menuin di Smartphone",
    // Warna tengah 1: berubah menjadi agak lebih gelap mengikuti scroll
    bezelColor: "#75a4fb",
    waveColors: {
      horizon: "#256ef9",
      shadow: "#0d4ed2",
      wave: "#60a5fa",
      crest: "#dbeafe",
    },
  },
  {
    id: "order-status",
    number: "03",
    title: "Halaman Status Pesanan Real-Time",
    subtitle:
      "Pantau progres pesanan dari diterima kasir, diproses, hingga siap diserahkan.",
    deviceType: "phone",
    imageSrc: "/menuin-vert-white.png",
    imageAlt: "Halaman Status Pesanan Menuin di Smartphone",
    // Warna tengah 2: agak lebih gelap sebelum kembali terang di akhir
    bezelColor: "#5487f0",
    waveColors: {
      horizon: "#8eb8ff",
      shadow: "#3b82f6",
      wave: "#dbeafe",
      crest: "#ffffff",
    },
  },
  {
    id: "reports",
    number: "04",
    title: "Laporan & Analitik Terpusat",
    subtitle:
      "Seluruh transaksi otomatis tercatat ke laporan penjualan & omset secara real-time.",
    deviceType: "tablet",
    imageSrc: "/menuin-hori-blue.png",
    imageAlt: "Tampilan Laporan Menuin di Tablet",
    // Warna akhir: kembali ke putih agak kebiruan seperti warna awal
    bezelColor: "#dbeafe",
    waveColors: {
      horizon: "#ffffff",
      shadow: "#5492f7",
      wave: "#bdd7ff",
      crest: "#ffffff",
    },
  },
];

function toRgb(hex: string): [number, number, number] {
  return parseWaveColor(hex, [0.055, 0.349, 0.976]) ?? [0.055, 0.349, 0.976];
}

export default function StepMorphShowcase() {
  const sectionRef = useRef<HTMLElement>(null);

  // Driver mutabel untuk merubah warna GradientWaves lewat ScrollTrigger
  // (sementara ombaknya tetap bergerak otomatis dengan speed bawaan)
  const waveDriverRef = useRef<GradientWavesScrollDriver | null>({
    time: 0,
    horizon: [0.055, 0.349, 0.976],
    shadow: [0.024, 0.196, 0.612],
    wave: [0.18, 0.467, 1.0],
    crest: [0.576, 0.773, 0.992],
    background: [0.055, 0.349, 0.976],
    lightAngleDeg: 118,
  });

  // Sisi Kiri (Background + Teks Judul Kiri)
  const leftBgRef = useRef<HTMLDivElement>(null);
  const leftHeadingRef = useRef<HTMLHeadingElement>(null);
  const leftCountRef = useRef<HTMLSpanElement>(null);
  const leftSubRef = useRef<HTMLParagraphElement>(null);

  // Mockup Tengah (Parallax Entrance Wrapper + Outer Bezel + Inner Fixed Clipping Viewport + Filmstrip Track + Screen Items)
  const mockupParallaxRef = useRef<HTMLDivElement>(null);
  const mockupShellRef = useRef<HTMLDivElement>(null);
  const mockupViewportRef = useRef<HTMLDivElement>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);
  const screenItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Daftar Step di Sisi Kanan
  const stepItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stepDotRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: "(min-width: 768px)",
        isMobile: "(max-width: 767px)",
      },
      (context) => {
        const { isDesktop } = context.conditions as {
          isDesktop: boolean;
          isMobile: boolean;
        };

        const sectionEl = sectionRef.current;
        const leftBgEl = leftBgRef.current;
        const leftHeadingEl = leftHeadingRef.current;
        const leftCountEl = leftCountRef.current;
        const leftSubEl = leftSubRef.current;
        const mockupParallaxEl = mockupParallaxRef.current;
        const mockupShellEl = mockupShellRef.current;
        const mockupViewportEl = mockupViewportRef.current;
        const filmstripEl = filmstripRef.current;

        if (
          !sectionEl ||
          !leftBgEl ||
          !leftHeadingEl ||
          !leftCountEl ||
          !leftSubEl ||
          !mockupParallaxEl ||
          !mockupShellEl ||
          !mockupViewportEl ||
          !filmstripEl
        ) {
          return;
        }

        const screenEls = screenItemRefs.current.filter(
          Boolean,
        ) as HTMLDivElement[];
        const stepEls = stepItemRefs.current.filter(
          Boolean,
        ) as HTMLDivElement[];
        const dotEls = stepDotRefs.current.filter(Boolean) as HTMLSpanElement[];

        // ==================================================================
        // KALKULASI DIMENSI PROPORSIONAL VIEWPORT (ANTI-PECAH DI SCALE 125%/150%)
        // Ketika OS scale laptop 125%, window.innerWidth & window.innerHeight
        // mengecil 1.25x dalam satuan CSS px. Dengan menghitung ukuran mockup,
        // bezel, gap, dan tinggi tiap layar langsung dari rasio vw/vh layar 100%,
        // proporsi fisik di layar pengguna akan 100% identik di scale berapa pun.
        // ==================================================================
        const computeDims = () => {
          const vw = window.innerWidth;
          const vh = window.innerHeight;

          if (isDesktop) {
            // Acuan layar 100% (1920x955): phoneH = 608px (~63.6% vh, ~31.6% vw)
            const phoneH = Math.round(Math.min(vh * 0.636, vw * 0.316));
            const phoneW = Math.round(phoneH * 0.5);
            const scale = phoneH / 608;

            const bezelPad = 9;
            const gap = Math.max(10, Math.round(16 * scale));

            const tabletH = Math.round(phoneH * (390 / 608));
            const tabletW = Math.round(tabletH * (568 / 390));

            const phoneOuterR = Math.round(42 * scale);
            const phoneInnerR = Math.max(14, phoneOuterR - bezelPad);
            const tabletOuterR = Math.round(32 * scale);
            const tabletInnerR = Math.max(12, tabletOuterR - bezelPad);

            const phoneInnerH = phoneH - bezelPad * 2;
            const tabletInnerH = tabletH - bezelPad * 2;
            const stepOffset = phoneInnerH + gap;
            const parallaxStartY = Math.round(vh * 0.22);

            return {
              phoneW,
              phoneH,
              bezelPad,
              gap,
              tabletW,
              tabletH,
              phoneOuterR,
              phoneInnerR,
              tabletOuterR,
              tabletInnerR,
              phoneInnerH,
              tabletInnerH,
              stepOffset,
              parallaxStartY,
            };
          } else {
            const phoneH = Math.round(Math.min(vh * 0.48, vw * 0.92));
            const phoneW = Math.round(phoneH * 0.5);
            const scale = phoneH / 456;

            const bezelPad = 7;
            const gap = Math.max(8, Math.round(12 * scale));

            const tabletH = Math.round(phoneH * (248 / 456));
            const tabletW = Math.round(tabletH * (356 / 248));

            const phoneOuterR = Math.round(34 * scale);
            const phoneInnerR = Math.max(12, phoneOuterR - bezelPad);
            const tabletOuterR = Math.round(24 * scale);
            const tabletInnerR = Math.max(10, tabletOuterR - bezelPad);

            const phoneInnerH = phoneH - bezelPad * 2;
            const tabletInnerH = tabletH - bezelPad * 2;
            const stepOffset = phoneInnerH + gap;
            const parallaxStartY = Math.round(vh * 0.14);

            return {
              phoneW,
              phoneH,
              bezelPad,
              gap,
              tabletW,
              tabletH,
              phoneOuterR,
              phoneInnerR,
              tabletOuterR,
              tabletInnerR,
              phoneInnerH,
              tabletInnerH,
              stepOffset,
              parallaxStartY,
            };
          }
        };

        let dims = computeDims();

        // Parse semua palet warna GradientWaves tiap step ke [r, g, b] (0..1)
        const palettes = STEP_SHOWCASE_ITEMS.map((item) => ({
          horizon: toRgb(item.waveColors.horizon),
          shadow: toRgb(item.waveColors.shadow),
          wave: toRgb(item.waveColors.wave),
          crest: toRgb(item.waveColors.crest),
        }));

        // Objek proxy yang di-tween oleh GSAP untuk mengubah warna GradientWaves
        const waveProxy = {
          lightAngleDeg: 118,
          hR: palettes[0].horizon[0],
          hG: palettes[0].horizon[1],
          hB: palettes[0].horizon[2],
          sR: palettes[0].shadow[0],
          sG: palettes[0].shadow[1],
          sB: palettes[0].shadow[2],
          wR: palettes[0].wave[0],
          wG: palettes[0].wave[1],
          wB: palettes[0].wave[2],
          cR: palettes[0].crest[0],
          cG: palettes[0].crest[1],
          cB: palettes[0].crest[2],
        };

        const syncWaveDriver = () => {
          const drv = waveDriverRef.current;
          if (!drv) return;
          drv.lightAngleDeg = waveProxy.lightAngleDeg;
          drv.horizon[0] = waveProxy.hR;
          drv.horizon[1] = waveProxy.hG;
          drv.horizon[2] = waveProxy.hB;
          drv.background[0] = waveProxy.hR;
          drv.background[1] = waveProxy.hG;
          drv.background[2] = waveProxy.hB;
          drv.shadow[0] = waveProxy.sR;
          drv.shadow[1] = waveProxy.sG;
          drv.shadow[2] = waveProxy.sB;
          drv.wave[0] = waveProxy.wR;
          drv.wave[1] = waveProxy.wG;
          drv.wave[2] = waveProxy.wB;
          drv.crest[0] = waveProxy.cR;
          drv.crest[1] = waveProxy.cG;
          drv.crest[2] = waveProxy.cB;
          drv.invalidate?.();
        };

        syncWaveDriver();

        const applyInitialLayout = () => {
          dims = computeDims();

          gsap.set(leftBgEl, { backgroundColor: "#0e59f9" });
          gsap.set(leftHeadingEl, { color: "#ffffff" });
          gsap.set(leftCountEl, { color: "rgba(255,255,255,0.65)" });
          gsap.set(leftSubEl, { color: "rgba(255,255,255,0.78)" });

          // Set state awal Mockup Tengah (Phone Portrait) tepat di tengah (y: 0)
          gsap.set(mockupShellEl, {
            width: dims.phoneW,
            height: dims.phoneH,
            borderRadius: dims.phoneOuterR,
            padding: dims.bezelPad,
            backgroundColor: STEP_SHOWCASE_ITEMS[0].bezelColor,
            force3D: true,
          });
          gsap.set(mockupViewportEl, {
            borderRadius: dims.phoneInnerR,
            force3D: true,
          });

          // PENTING: rowGap wajib menyertakan satuan "px" agar tidak diabaikan browser!
          filmstripEl.style.rowGap = `${dims.gap}px`;
          gsap.set(filmstripEl, {
            y: 0,
            force3D: true,
          });

          // Sinkronkan tinggi & radius tiap layar di dalam filmstrip agar 100% presisi dengan stepOffset
          screenEls.forEach((el, idx) => {
            const isTab = STEP_SHOWCASE_ITEMS[idx]?.deviceType === "tablet";
            el.style.height = `${isTab ? dims.tabletInnerH : dims.phoneInnerH}px`;
            el.style.borderRadius = `${isTab ? dims.tabletInnerR : dims.phoneInnerR}px`;
          });

          // Set state awal Step-by-Step di sisi kanan (Step 1 aktif terang, Step 2-4 redup tanpa bergeser)
          stepEls.forEach((el, idx) => {
            gsap.set(el, {
              opacity: idx === 0 ? 1 : 0.32,
            });
          });
          dotEls.forEach((el, idx) => {
            gsap.set(el, {
              backgroundColor: idx === 0 ? "#ffffff" : "rgba(255,255,255,0.45)",
            });
          });
        };

        applyInitialLayout();

        // ==================================================================
        // ENTRANCE PARALLAX SEBELUM SAMPAI DI SECTION (top 82% -> top top)
        // Saat pengguna scroll menuju section ini (saat mockup mulai masuk layar),
        // mockup bergerak berlawanan arah scroll (ke atas dari +22vh menuju 0 di tengah).
        // ==================================================================
        const entranceParallaxTween = gsap.fromTo(
          mockupParallaxEl,
          { y: () => dims.parallaxStartY },
          {
            y: 0,
            ease: "none",
            scrollTrigger: {
              trigger: sectionEl,
              start: "top 82%",
              end: "top top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );

        // ==================================================================
        // AUTO-SNAP SETELAH 1 DETIK BERHENTI DI TENGAH ANTAR LAYAR
        // Total durasi timeline = 80 unit (0..25..50..75 + 5 unit hold di akhir Step 4)
        // ==================================================================
        const TOTAL_TL = 80;
        const ACTIVE_TL = 75;
        const END_RATIO = ACTIVE_TL / TOTAL_TL; // 0.9375

        let snapTimer: ReturnType<typeof setTimeout> | null = null;
        let isAutoSnapping = false;

        const clearSnapTimer = () => {
          if (snapTimer) {
            clearTimeout(snapTimer);
            snapTimer = null;
          }
        };

        const scheduleDominantSnap = (st: ScrollTrigger) => {
          if (isAutoSnapping) return;
          clearSnapTimer();

          const p = st.progress;
          // Jika masih di paling awal atau sudah masuk zona hold Step 4 (p >= 0.9375), layar sudah 100% penuh
          if (p <= 0.002 || p >= END_RATIO - 0.002) return;

          // Petakan progress ke indeks layar dominan (0, 1, 2, 3)
          const normalizedStep = (p / END_RATIO) * 3;
          const dominantIndex = Math.min(3, Math.round(normalizedStep));
          const targetProgress = (dominantIndex / 3) * END_RATIO;

          if (Math.abs(p - targetProgress) <= 0.003) return;

          snapTimer = setTimeout(() => {
            const currentP = st.progress;
            if (currentP <= 0.002 || currentP >= END_RATIO - 0.002) return;

            const curNorm = (currentP / END_RATIO) * 3;
            const nearestIdx = Math.min(3, Math.round(curNorm));
            const nearestProgress = (nearestIdx / 3) * END_RATIO;
            if (Math.abs(currentP - nearestProgress) <= 0.003) return;

            const targetScrollY =
              st.start + nearestProgress * (st.end - st.start);
            const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;

            isAutoSnapping = true;
            if (lenis) {
              lenis.scrollTo(targetScrollY, {
                duration: 0.65,
                easing: (t: number) => 1 - Math.pow(1 - t, 3),
                onComplete: () => {
                  isAutoSnapping = false;
                },
              });
            } else {
              window.scrollTo({ top: targetScrollY, behavior: "smooth" });
              setTimeout(() => {
                isAutoSnapping = false;
              }, 650);
            }
          }, 1000);
        };

        const onUserInterrupt = () => {
          if (isAutoSnapping) {
            isAutoSnapping = false;
          }
          clearSnapTimer();
        };

        window.addEventListener("wheel", onUserInterrupt, { passive: true });
        window.addEventListener("touchstart", onUserInterrupt, {
          passive: true,
        });

        // Master ScrollTrigger Timeline — mengalir penuh & otomatis rekalkulasi saat resize / ubah scale
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          onUpdate: syncWaveDriver,
          scrollTrigger: {
            trigger: sectionEl,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            invalidateOnRefresh: true,
            onRefreshInit: () => {
              applyInitialLayout();
            },
            onUpdate: (self) => {
              scheduleDominantSnap(self);
            },
          },
        });

        // ==================================================================
        // TRANSISI 1 (0 -> 25): STEP 1 (Storefront) -> STEP 2 (Pembayaran)
        // ==================================================================
        tl.to(filmstripEl, { y: () => -dims.stepOffset, duration: 25 }, 0);
        tl.to(
          mockupShellEl,
          { backgroundColor: STEP_SHOWCASE_ITEMS[1].bezelColor, duration: 25 },
          0,
        );
        tl.to(
          leftBgEl,
          {
            backgroundColor: STEP_SHOWCASE_ITEMS[1].waveColors.horizon,
            duration: 25,
          },
          0,
        );
        tl.to(
          waveProxy,
          {
            lightAngleDeg: 130,
            hR: palettes[1].horizon[0],
            hG: palettes[1].horizon[1],
            hB: palettes[1].horizon[2],
            sR: palettes[1].shadow[0],
            sG: palettes[1].shadow[1],
            sB: palettes[1].shadow[2],
            wR: palettes[1].wave[0],
            wG: palettes[1].wave[1],
            wB: palettes[1].wave[2],
            cR: palettes[1].crest[0],
            cG: palettes[1].crest[1],
            cB: palettes[1].crest[2],
            duration: 25,
          },
          0,
        );

        // Highlight Step 1 -> Step 2 di kanan (hanya perubahan warna/opacity tanpa bergeser)
        tl.to(stepEls[0], { opacity: 0.32, duration: 25 }, 0);
        tl.to(
          dotEls[0],
          { backgroundColor: "rgba(255,255,255,0.45)", duration: 25 },
          0,
        );
        tl.to(stepEls[1], { opacity: 1, duration: 25 }, 0);
        tl.to(
          dotEls[1],
          { backgroundColor: "#ffffff", duration: 25 },
          0,
        );

        // ==================================================================
        // TRANSISI 2 (25 -> 50): STEP 2 (Pembayaran) -> STEP 3 (Status Pesanan)
        // ==================================================================
        tl.to(filmstripEl, { y: () => -dims.stepOffset * 2, duration: 25 }, 25);
        tl.to(
          mockupShellEl,
          { backgroundColor: STEP_SHOWCASE_ITEMS[2].bezelColor, duration: 25 },
          25,
        );
        tl.to(
          leftBgEl,
          {
            backgroundColor: STEP_SHOWCASE_ITEMS[2].waveColors.horizon,
            duration: 25,
          },
          25,
        );
        tl.to(
          waveProxy,
          {
            lightAngleDeg: 144,
            hR: palettes[2].horizon[0],
            hG: palettes[2].horizon[1],
            hB: palettes[2].horizon[2],
            sR: palettes[2].shadow[0],
            sG: palettes[2].shadow[1],
            sB: palettes[2].shadow[2],
            wR: palettes[2].wave[0],
            wG: palettes[2].wave[1],
            wB: palettes[2].wave[2],
            cR: palettes[2].crest[0],
            cG: palettes[2].crest[1],
            cB: palettes[2].crest[2],
            duration: 25,
          },
          25,
        );

        // Teks sisi kiri berubah kontras ke warna gelap saat gelombang kiri mulai terang
        tl.to(leftHeadingEl, { color: "#0a0a0a", duration: 20 }, 30);
        tl.to(leftCountEl, { color: "#0e59f9", duration: 20 }, 30);
        tl.to(leftSubEl, { color: "#1e293b", duration: 20 }, 30);

        // Highlight Step 2 -> Step 3 di kanan (hanya perubahan warna/opacity tanpa bergeser)
        tl.to(stepEls[1], { opacity: 0.32, duration: 25 }, 25);
        tl.to(
          dotEls[1],
          { backgroundColor: "rgba(255,255,255,0.45)", duration: 25 },
          25,
        );
        tl.to(stepEls[2], { opacity: 1, duration: 25 }, 25);
        tl.to(
          dotEls[2],
          { backgroundColor: "#ffffff", duration: 25 },
          25,
        );

        // ==================================================================
        // TRANSISI 3 (50 -> 75): STEP 3 (Status Pesanan) -> STEP 4 (Laporan Tablet)
        // ==================================================================
        tl.to(
          mockupShellEl,
          {
            width: () => dims.tabletW,
            height: () => dims.tabletH,
            borderRadius: () => dims.tabletOuterR,
            backgroundColor: STEP_SHOWCASE_ITEMS[3].bezelColor,
            duration: 25,
          },
          50,
        );
        tl.to(
          mockupViewportEl,
          {
            borderRadius: () => dims.tabletInnerR,
            duration: 25,
          },
          50,
        );
        tl.to(filmstripEl, { y: () => -dims.stepOffset * 3, duration: 25 }, 50);
        tl.to(
          leftBgEl,
          {
            backgroundColor: STEP_SHOWCASE_ITEMS[3].waveColors.horizon,
            duration: 25,
          },
          50,
        );
        tl.to(
          waveProxy,
          {
            lightAngleDeg: 126,
            hR: palettes[3].horizon[0],
            hG: palettes[3].horizon[1],
            hB: palettes[3].horizon[2],
            sR: palettes[3].shadow[0],
            sG: palettes[3].shadow[1],
            sB: palettes[3].shadow[2],
            wR: palettes[3].wave[0],
            wG: palettes[3].wave[1],
            wB: palettes[3].wave[2],
            cR: palettes[3].crest[0],
            cG: palettes[3].crest[1],
            cB: palettes[3].crest[2],
            duration: 25,
          },
          50,
        );

        // Highlight Step 3 -> Step 4 di kanan (hanya perubahan warna/opacity tanpa bergeser)
        tl.to(stepEls[2], { opacity: 0.32, duration: 25 }, 50);
        tl.to(
          dotEls[2],
          { backgroundColor: "rgba(255,255,255,0.45)", duration: 25 },
          50,
        );
        tl.to(stepEls[3], { opacity: 1, duration: 25 }, 50);
        tl.to(
          dotEls[3],
          { backgroundColor: "#ffffff", duration: 25 },
          50,
        );

        // Zona hold pendek di akhir Step 4 (75 -> 80) agar layar Tablet selalu terkunci
        // penuh tanpa celah di bagian atas saat pengguna scroll sampai bawah section
        tl.to(filmstripEl, { y: () => -dims.stepOffset * 3, duration: 5 }, 75);

        return () => {
          clearSnapTimer();
          window.removeEventListener("wheel", onUserInterrupt);
          window.removeEventListener("touchstart", onUserInterrupt);
          entranceParallaxTween.scrollTrigger?.kill();
          entranceParallaxTween.kill();
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      id="alur"
      ref={sectionRef}
      aria-label="Alur Kerja Step-by-Step Menuin"
      className="relative h-[380vh] w-full bg-[#0e59f9] select-none"
    >
      {/* Sticky Split-Screen Viewport (100svh) */}
      <div className="sticky top-0 flex h-[100svh] w-full flex-col overflow-hidden md:flex-row">
        {/* ================================================================ */}
        {/* BELAHAN KIRI (50%): GRADIENT WAVES (OMBAK JALAN, WARNA SCROLL)   */}
        {/* ================================================================ */}
        <div
          ref={leftBgRef}
          className="relative flex h-[42%] w-full flex-col justify-center overflow-hidden px-6 sm:px-12 md:h-full md:w-1/2 md:pl-[4.2vw] md:pr-[15.5vw]"
        >
          {/* WebGL2 GradientWaves: ombak terus bergulir (speed 0.4), warna berubah saat di-scroll */}
          <div className="absolute inset-0 z-0">
            <GradientWaves
              scrollDriverRef={waveDriverRef}
              horizonColor="#0e59f9"
              shadowColor="#06329c"
              waveColor="#2e77ff"
              crestColor="#93c5fd"
              backgroundColor="#0e59f9"
              speed={0.4}
              amplitude={2.6}
              waveScale={0.62}
              waveRatio={0.9}
              swell={36}
              turbulence={20}
              tilt={64}
              zoom={1}
              height={5.5}
              fogDepth={15}
              relief={1}
              lightAngle={118}
              sheen={0.3}
              brightness={1.05}
              grain={0.12}
              intro={false}
              mouseInteraction
              parallaxStrength={0.12}
              mouseStrength={0.15}
              swellOnClick
            />
          </div>

          {/* Teks Judul di Sisi Kiri — menggunakan satuan vw/vh pada desktop agar identik di scale 100% & 125% */}
          <div className="pointer-events-none relative z-10 max-w-[480px] md:max-w-[42vw]">
            <div className="inline-flex items-start gap-2 md:gap-[0.45vw]">
              <h2
                ref={leftHeadingRef}
                className="font-display text-[28px] font-semibold leading-[1.08] tracking-[-0.035em] text-white sm:text-[34px] md:text-[2.6vw]"
              >
              Digitalize your business without any hussle
              </h2>
              <span
                ref={leftCountRef}
                className="font-numeric -mt-1 text-[14px] font-medium tracking-tight text-white/65 md:-mt-[0.25vh] md:text-[0.83vw]"
              >
                
              </span>
            </div>
            <p
              ref={leftSubRef}
              className="mt-3 text-[13.5px] leading-relaxed text-white/80 md:mt-[1.25vh] md:text-[0.78vw]"
            >
              
            </p>
          </div>
        </div>

        {/* ================================================================ */}
        {/* BELAHAN KANAN (50%): DAFTAR STEP-BY-STEP DI ATAS BIRU MENUIN     */}
        {/* ================================================================ */}
        <div className="relative flex h-[58%] w-full flex-col justify-center bg-[#0e59f9] px-6 sm:px-12 md:h-full md:w-1/2 md:pl-[10.8vw] md:pr-[4.2vw]">
          <div className="mx-auto w-full max-w-[400px] md:max-w-[20.8vw]">
            {STEP_SHOWCASE_ITEMS.map((item, idx) => (
              <div
                key={item.id}
                ref={(el) => {
                  stepItemRefs.current[idx] = el;
                }}
                className="py-4 sm:py-5 md:py-[2.3vh] will-change-[opacity]"
              >
                <div className="flex items-start gap-4 md:gap-[0.85vw]">
                  {/* Indikator Step Aktif */}
                  <div className="mt-1.5 flex shrink-0 items-center gap-1.5 md:mt-[0.65vh] md:gap-[0.32vw]">
                    <span
                      ref={(el) => {
                        stepDotRefs.current[idx] = el;
                      }}
                      className=" rounded-full bg-white/0"
                    />
                    <span className="font-numeric text-[11px] font-medium tracking-wider text-white/75 md:text-[0.58vw]">
                      {item.number}
                    </span>
                  </div>

                  {/* Judul & Deskripsi Step */}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-[17px] font-semibold leading-[1.25] tracking-[-0.02em] text-white sm:text-[20px] md:text-[1.14vw]">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/80 md:mt-[0.6vh] md:text-[0.7vw]">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================================================================ */}
        {/* MOCKUP TENGAH: BEZEL ATAS/BAWAH/SAMPING TETAP + FILMSTRIP SCROLL */}
        {/* ================================================================ */}
        <div
          ref={mockupParallaxRef}
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center will-change-transform"
        >
          <div
            ref={mockupShellRef}
            className="shadow-[0_28px_60px_-15px_rgba(7,29,84,0.45),0_10px_24px_-8px_rgba(15,23,42,0.22)] will-change-[width,height,border-radius,background-color]"
          >
            {/* Inner Viewport: menjaga agar bezel atas & bawah tetap diam dan tidak tertutup saat layar di-scroll */}
            <div
              ref={mockupViewportRef}
              className="relative h-full w-full overflow-hidden will-change-[border-radius]"
            >
              {/* Vertical Filmstrip Track */}
              <div
                ref={filmstripRef}
                className="flex w-full flex-col will-change-transform"
              >
                {STEP_SHOWCASE_ITEMS.map((item, idx) => (
                  <div
                    key={item.id}
                    ref={(el) => {
                      screenItemRefs.current[idx] = el;
                    }}
                    className="relative w-full shrink-0 overflow-hidden bg-white"
                  >
                    <Image
                      src={item.imageSrc}
                      alt={item.imageAlt}
                      fill
                      priority
                      sizes="(max-width: 768px) 360px, 580px"
                      className="object-cover object-center"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
