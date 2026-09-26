"use client";

import React, { useRef } from "react";
import Image from "next/image";
import {
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
 * Teks ringkas di atas, lalu foto presenter besar di tengah yang mengisi
 * sisa tinggi layar (terpotong di pinggang), dengan tombol CTA melayang di
 * atas badannya. Di sekeliling, tangkapan layar Menuin melayang di
 * kedalaman berbeda (terinspirasi "parallax hero images" Aceternity).
 *
 * Gerak mengikuti mouse tetap aktif walau reduced-motion menyala, karena
 * geraknya kecil dan dipicu pengguna sendiri; animasi masuk dan parallax
 * scroll yang dimatikan untuk reduced-motion.
 */

/* ------------------------------------------------------------------ */
/* Bingkai                                                             */
/* ------------------------------------------------------------------ */

function Browser({ src, alt, w, h, url }: { src: string; alt: string; w: number; h: number; url: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-black/[0.08] bg-white shadow-[0_24px_48px_-24px_rgba(15,23,42,0.35)]">
      <div className="flex items-center gap-1.5 border-b border-black/[0.06] bg-[#fafafa] px-2 py-1">
        <span className="flex gap-[3px]" aria-hidden="true">
          <span className="h-[5px] w-[5px] rounded-full bg-[#ff5f57]" />
          <span className="h-[5px] w-[5px] rounded-full bg-[#febc2e]" />
          <span className="h-[5px] w-[5px] rounded-full bg-[#28c840]" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded bg-white px-1.5 text-center text-[7px] leading-[12px] text-[#a1a1aa] ring-1 ring-black/[0.05]">
          {url}
        </span>
      </div>
      <Image src={src} alt={alt} width={w} height={h} sizes="280px" className="block h-auto w-full" />
    </div>
  );
}

function Phone({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="rounded-[20px] bg-[#0a0a0a] p-[4px] shadow-[0_24px_48px_-24px_rgba(15,23,42,0.5)] ring-1 ring-black/10">
      <div className="relative overflow-hidden rounded-[16px] bg-white">
        <span className="absolute left-1/2 top-1 z-10 h-[9px] w-[34px] -translate-x-1/2 rounded-full bg-[#0a0a0a]" />
        <div className="pt-4">
          <Image src={src} alt={alt} width={356} height={797} sizes="130px" className="block h-auto w-full" />
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

const layers: Layer[] = [
  {
    id: "laporan",
    className: "left-[3%] top-[15%] w-[clamp(200px,17vw,270px)]",
    depth: 0.7,
    rotate: -4,
    node: (
      <Browser src="/img/landing/journey/outlet-laporan.webp" alt="Laporan penjualan Menuin" w={1270} h={600} url="Laporan Penjualan" />
    ),
  },
  {
    id: "keranjang",
    className: "left-[17%] top-[40%] w-[clamp(96px,8vw,124px)]",
    depth: 1.4,
    rotate: 7,
    node: <Phone src="/img/landing/journey/tamu-keranjang.webp" alt="Keranjang pesanan tamu" />,
  },
  {
    id: "pesanan",
    className: "left-[4%] top-[70%] w-[clamp(210px,18vw,280px)]",
    depth: 1,
    rotate: 3,
    node: (
      <Browser src="/img/landing/journey/outlet-kolom-pesanan-baru.webp" alt="Papan Pesanan Masuk" w={1180} h={280} url="Pesanan Masuk" />
    ),
  },
  {
    id: "bayar",
    className: "right-[16%] top-[13%] w-[clamp(92px,7.5vw,118px)]",
    depth: 1.25,
    rotate: -7,
    node: <Phone src="/img/landing/journey/tamu-bayar.webp" alt="Pilihan pembayaran tamu" />,
  },
  {
    id: "meja",
    className: "right-[3%] top-[36%] w-[clamp(200px,17vw,260px)]",
    depth: 0.8,
    rotate: 4,
    node: (
      <Browser src="/img/landing/journey/outlet-meja-qr.webp" alt="Pengaturan Meja & QR Code" w={1140} h={620} url="Meja & QR Code" />
    ),
  },
  {
    id: "laptop",
    className: "right-[5%] top-[68%] w-[clamp(220px,19vw,300px)]",
    depth: 1.1,
    rotate: -3,
    node: (
      <Image
        src="/img/landing/dashboard-macbook.webp"
        alt="Dashboard Menuin di laptop"
        width={1800}
        height={1145}
        sizes="300px"
        className="h-auto w-full drop-shadow-[0_24px_32px_rgba(15,23,42,0.22)]"
      />
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
        initial={reduce ? false : { opacity: 0, scale: 0.85, y: 30 }}
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

  // Presenter & tablet ikut bergeser, lebih sedikit dari kartu di tepi.
  const personX = useTransform(mx, (v) => v * -10);
  const tabletX = useTransform(mx, (v) => v * -34);
  const tabletY = useTransform(my, (v) => v * -24);

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
    <section
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative flex h-[100svh] min-h-[640px] flex-col overflow-hidden bg-white pt-[88px] lg:min-h-[720px] lg:pt-[96px]"
    >
      {/* Cahaya lembut di belakang presenter */}
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

      {/* Presenter besar mengisi sisa layar */}
      <div className="relative z-10 mt-2 min-h-0 flex-1">
        <div className="absolute left-1/2 top-0 h-[150%] -translate-x-1/2">
        <motion.div
          style={{ x: personX }}
          initial={reduce ? false : { opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="h-full"
        >
          <Image
            src="/img/landing/hero/person.webp"
            alt="Pemilik outlet memperkenalkan Menuin"
            width={377}
            height={524}
            priority
            sizes="(max-width: 1024px) 80vw, 560px"
            className="h-full w-auto max-w-none"
          />
        </motion.div>
        </div>

        {/* Tablet kasir melayang di samping badan */}
        <div className="absolute left-1/2 top-[34%] w-[clamp(170px,21vw,320px)] translate-x-[16%]">
        <motion.div style={{ x: tabletX, y: tabletY }}>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 50, rotate: -16 }}
            animate={{ opacity: 1, y: 0, rotate: -9 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src="/img/landing/pos-ipad.webp"
              alt="Kasir Menuin di tablet"
              width={1800}
              height={1382}
              sizes="340px"
              className="h-auto w-full drop-shadow-[0_36px_40px_rgba(15,23,42,0.3)]"
            />
          </motion.div>
        </motion.div>
        </div>

        {/* Pudar ke putih di dasar hero */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/80 to-transparent" />

        {/* CTA melayang di atas badan presenter */}
        <div className="absolute inset-x-0 bottom-[6%] z-30 px-6">{actions}</div>
      </div>
    </section>
  );
}
