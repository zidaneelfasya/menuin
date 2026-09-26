"use client";

import React, { useRef } from "react";
import Image from "next/image";
import {
  MotionConfig,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

/**
 * Hero parallax — setinggi satu layar.
 *
 * Teks ringkas di atas, lalu tangan memegang ponsel berisi aplikasi Menuin
 * di tengah yang mengisi sisa tinggi layar, dengan tombol CTA melayang di
 * bawahnya. Di sekeliling, mockup perangkat (ponsel, laptop) melayang
 * di kedalaman berbeda (terinspirasi "parallax hero images" Aceternity).
 *
 * Gerak mengikuti mouse tetap aktif walau reduced-motion menyala, karena
 * geraknya kecil dan dipicu pengguna sendiri; animasi masuk (lewat
 * MotionConfig) dan parallax scroll yang diredam untuk reduced-motion.
 */

/* ------------------------------------------------------------------ */
/* Bingkai                                                             */
/* ------------------------------------------------------------------ */

/** Tablet berbingkai CSS berisi tangkapan layar dashboard. */
function Tablet({ src, alt, w, h }: { src: string; alt: string; w: number; h: number }) {
  return (
    <div className="rounded-[18px] bg-[#111] p-[7px] shadow-[0_28px_50px_-24px_rgba(15,23,42,0.45)] ring-1 ring-black/20">
      <div className="aspect-[4/3] overflow-hidden rounded-[12px] bg-white">
        <Image src={src} alt={alt} width={w} height={h} sizes="300px" className="h-full w-full object-cover object-left-top" />
      </div>
    </div>
  );
}

/** HP berbingkai CSS berisi tangkapan layar aplikasi. */
function Phone({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="rounded-[22px] bg-[#111] p-[5px] shadow-[0_28px_50px_-24px_rgba(15,23,42,0.5)] ring-1 ring-black/20">
      <div className="relative overflow-hidden rounded-[17px] bg-white">
        <span className="absolute left-1/2 top-1 z-10 h-[10px] w-[38px] -translate-x-1/2 rounded-full bg-[#111]" />
        <div className="pt-4">
          <Image src={src} alt={alt} width={356} height={797} sizes="150px" className="block h-auto w-full" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lapisan parallax                                                    */
/* ------------------------------------------------------------------ */

type Layer = {
  id: string;
  className: string;
  depth: number;
  rotate: number;
  node: React.ReactNode;
};

// Cermin kiri–kanan: HP di atas, tablet di bawah pada kedua sisi.
const layers: Layer[] = [
  {
    id: "hp-kiri",
    className: "left-[12%] top-[16%] w-[clamp(108px,8.4vw,140px)]",
    depth: 1.3,
    rotate: -8,
    node: <Phone src="/img/landing/journey/tamu-keranjang.webp" alt="Keranjang pesanan tamu di ponsel" />,
  },
  {
    id: "tablet-kiri",
    className: "left-[3%] top-[54%] w-[clamp(230px,19vw,310px)]",
    depth: 0.9,
    rotate: 5,
    node: (
      <Image
        src="/img/landing/pos-ipad.webp"
        alt="Kasir Menuin di tablet"
        width={1800}
        height={1382}
        sizes="310px"
        className="h-auto w-full drop-shadow-[0_24px_32px_rgba(15,23,42,0.25)]"
      />
    ),
  },
  {
    id: "hp-kanan",
    className: "right-[12%] top-[16%] w-[clamp(108px,8.4vw,140px)]",
    depth: 1.2,
    rotate: 8,
    node: (
      <Image
        src="/img/landing/hero/katalog-phone.webp"
        alt="Katalog menu Menuin di ponsel"
        width={463}
        height={940}
        sizes="150px"
        className="h-auto w-full drop-shadow-[0_24px_32px_rgba(15,23,42,0.3)]"
      />
    ),
  },
  {
    id: "tablet-kanan",
    className: "right-[3%] top-[54%] w-[clamp(220px,18vw,295px)]",
    depth: 1,
    rotate: -5,
    node: (
      <Tablet src="/img/landing/journey/outlet-meja-qr.webp" alt="Pengaturan Meja & QR Code di tablet" w={1140} h={620} />
    ),
  },
];

function FloatingLayer({
  layer,
  index,
  mx,
  my,
  scroll,
  reduce,
}: {
  layer: Layer;
  index: number;
  mx: MotionValue<number>;
  my: MotionValue<number>;
  scroll: MotionValue<number>;
  reduce: boolean;
}) {
  const x = useTransform(mx, (v) => v * layer.depth * -42);
  const yMouse = useTransform(my, (v) => v * layer.depth * -30);
  const yScroll = useTransform(scroll, (v) => (reduce ? 0 : v * layer.depth * -220));
  const y = useTransform([yMouse, yScroll], ([a, b]) => (a as number) + (b as number));

  return (
    <motion.div className={`absolute ${layer.className}`} style={{ x, y }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.3 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
        style={{ rotate: layer.rotate }}
      >
        {layer.node}
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export default function HeroParallax({
  heading,
  actions,
}: {
  heading: React.ReactNode;
  actions: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = !!useReducedMotion();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 70, damping: 20, mass: 0.5 });
  const my = useSpring(rawY, { stiffness: 70, damping: 20, mass: 0.5 });

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Gambar tengah ikut bergeser sedikit, lebih pelan dari kartu di tepi.
  const personX = useTransform(mx, (v) => v * -10);

  const onMove = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    rawX.set(((e.clientX - r.left) / r.width) * 2 - 1);
    rawY.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const onLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    // reducedMotion="user": animasi masuk jadi instan untuk reduced-motion,
    // tanpa membedakan markup server dan klien (penyebab hydration error).
    <MotionConfig reducedMotion="user">
    <section
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative flex h-[100svh] min-h-[640px] flex-col overflow-hidden bg-white pt-[88px] lg:min-h-[720px] lg:pt-[96px]"
    >
      {/* Cahaya lembut di belakang ponsel */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-20%] left-1/2 h-[80vh] w-[80vh] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(14,89,249,0.14),transparent)]"
      />

      {/* Kartu melayang — hanya desktop */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        {layers.map((l, i) => (
          <FloatingLayer key={l.id} layer={l} index={i} mx={mx} my={my} scroll={scrollYProgress} reduce={reduce} />
        ))}
      </div>

      {/* Teks */}
      <div className="relative z-20 mx-auto w-full max-w-[860px] shrink-0 px-6">{heading}</div>

      {/* Tangan memegang ponsel berisi aplikasi Menuin, mengisi sisa layar */}
      <div className="relative z-10 mt-2 min-h-0 flex-1">
        <div className="absolute left-1/2 top-0 h-[92%] -translate-x-1/2">
          <motion.div
            style={{ x: personX }}
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="h-full [mask-image:linear-gradient(to_bottom,black_72%,transparent)]"
          >
            <Image
              src="/img/landing/hero/hands-phone.webp"
              alt="Tamu memesan lewat katalog Menuin di ponselnya"
              width={1594}
              height={1679}
              priority
              sizes="(max-width: 1024px) 90vw, 640px"
              className="h-full w-auto max-w-none"
            />
          </motion.div>
        </div>

        {/* Pudar ke putih di dasar hero */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/80 to-transparent" />

        {/* CTA melayang di bawah ponsel */}
        <div className="absolute inset-x-0 bottom-[6%] z-30 px-6">{actions}</div>
      </div>
    </section>
    </MotionConfig>
  );
}
