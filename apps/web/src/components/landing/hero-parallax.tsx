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
 * Hero parallax — headline di tengah, dikelilingi tangkapan layar Menuin
 * yang melayang di kedalaman berbeda (terinspirasi "parallax hero images"
 * Aceternity).
 *
 * Setiap lapisan punya `depth`: makin besar, makin jauh ia bergeser saat
 * mouse bergerak dan saat halaman di-scroll, sehingga terasa ada ruang.
 * Di tengah, di belakang teks, berdiri foto orang dengan tablet kasir
 * melayang di depannya.
 *
 * Di bawah lg kartu samping disembunyikan; orang + tablet tampil di bawah
 * teks. Reduced-motion mematikan semua gerak.
 */

/* ------------------------------------------------------------------ */
/* Bingkai                                                             */
/* ------------------------------------------------------------------ */

function Browser({ src, alt, w, h, url }: { src: string; alt: string; w: number; h: number; url: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_30px_60px_-30px_rgba(15,23,42,0.4)]">
      <div className="flex items-center gap-2 border-b border-black/[0.06] bg-[#fafafa] px-2.5 py-1.5">
        <span className="flex gap-1" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff5f57]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#febc2e]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded bg-white px-2 py-0.5 text-center text-[8.5px] text-[#a1a1aa] ring-1 ring-black/[0.05]">
          {url}
        </span>
      </div>
      <Image src={src} alt={alt} width={w} height={h} sizes="380px" className="block h-auto w-full" />
    </div>
  );
}

function Phone({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="rounded-[26px] bg-[#0a0a0a] p-[5px] shadow-[0_30px_60px_-30px_rgba(15,23,42,0.55)] ring-1 ring-black/10">
      <div className="relative overflow-hidden rounded-[21px] bg-white">
        <span className="absolute left-1/2 top-1.5 z-10 h-[12px] w-[44px] -translate-x-1/2 rounded-full bg-[#0a0a0a]" />
        <div className="pt-5">
          <Image src={src} alt={alt} width={356} height={797} sizes="180px" className="block h-auto w-full" />
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
    className: "left-[2%] top-[12%] w-[min(25vw,340px)]",
    depth: 0.6,
    rotate: -3,
    node: (
      <Browser
        src="/img/landing/journey/outlet-laporan.webp"
        alt="Laporan penjualan Menuin"
        w={1270}
        h={600}
        url="Laporan Penjualan"
      />
    ),
  },
  {
    id: "keranjang",
    className: "left-[11%] top-[42%] w-[min(12vw,170px)]",
    depth: 1.25,
    rotate: 6,
    node: <Phone src="/img/landing/journey/tamu-keranjang.webp" alt="Keranjang pesanan tamu" />,
  },
  {
    id: "pesanan",
    className: "left-[2%] top-[70%] w-[min(26vw,360px)]",
    depth: 0.85,
    rotate: 2,
    node: (
      <Browser
        src="/img/landing/journey/outlet-kolom-pesanan-baru.webp"
        alt="Papan Pesanan Masuk"
        w={1180}
        h={280}
        url="Pesanan Masuk"
      />
    ),
  },
  {
    id: "bayar",
    className: "right-[14%] top-[10%] w-[min(11vw,160px)]",
    depth: 1.1,
    rotate: -6,
    node: <Phone src="/img/landing/journey/tamu-bayar.webp" alt="Pilihan pembayaran tamu" />,
  },
  {
    id: "meja",
    className: "right-[1%] top-[38%] w-[min(24vw,330px)]",
    depth: 0.7,
    rotate: 3,
    node: (
      <Browser
        src="/img/landing/journey/outlet-meja-qr.webp"
        alt="Pengaturan Meja & QR Code"
        w={1140}
        h={620}
        url="Meja & QR Code"
      />
    ),
  },
  {
    id: "laptop",
    className: "right-[3%] top-[68%] w-[min(27vw,380px)]",
    depth: 0.95,
    rotate: -2,
    node: (
      <Image
        src="/img/landing/dashboard-macbook.webp"
        alt="Dashboard Menuin di laptop"
        width={1800}
        height={1145}
        sizes="380px"
        className="h-auto w-full drop-shadow-[0_30px_40px_rgba(15,23,42,0.25)]"
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
  still,
}: {
  layer: Layer;
  index: number;
  mx: MotionValue<number>;
  my: MotionValue<number>;
  scroll: MotionValue<number>;
  still: boolean;
}) {
  const x = useTransform(mx, (v) => (still ? 0 : v * layer.depth * 28));
  const yMouse = useTransform(my, (v) => (still ? 0 : v * layer.depth * 20));
  const yScroll = useTransform(scroll, (v) => (still ? 0 : v * layer.depth * -160));
  const y = useTransform([yMouse, yScroll], ([a, b]) => (a as number) + (b as number));

  return (
    <motion.div
      className={`absolute z-0 ${layer.className}`}
      style={{ x, y, rotate: layer.rotate }}
      initial={still ? false : { opacity: 0, scale: 0.9, y: 40 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.35 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
    >
      {layer.node}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Orang + tablet                                                      */
/* ------------------------------------------------------------------ */

function Presenter({
  mx,
  my,
  still,
  className = "",
}: {
  mx: MotionValue<number>;
  my: MotionValue<number>;
  still: boolean;
  className?: string;
}) {
  const px = useTransform(mx, (v) => (still ? 0 : v * 8));
  const tx = useTransform(mx, (v) => (still ? 0 : v * 34));
  const ty = useTransform(my, (v) => (still ? 0 : v * 22));

  return (
    <div className={`pointer-events-none relative ${className}`}>
      <motion.div
        style={{ x: px }}
        initial={still ? false : { opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto w-full [mask-image:linear-gradient(to_bottom,black_70%,transparent)]"
      >
        <Image
          src="/img/landing/hero/person.webp"
          alt="Pemilik outlet memperkenalkan Menuin"
          width={377}
          height={524}
          priority
          sizes="(max-width: 1024px) 64vw, 340px"
          className="h-auto w-full"
        />
      </motion.div>

      {/* Tablet kasir melayang di depan badan */}
      <motion.div
        style={{ x: tx, y: ty }}
        initial={still ? false : { opacity: 0, y: 60, rotate: -14 }}
        animate={{ opacity: 1, rotate: -8 }}
        transition={{ duration: 1, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-[6%] left-[38%] w-[105%]"
      >
        <Image
          src="/img/landing/pos-ipad.webp"
          alt="Kasir Menuin di tablet"
          width={1800}
          height={1382}
          sizes="(max-width: 1024px) 70vw, 460px"
          className="h-auto w-full drop-shadow-[0_40px_50px_rgba(15,23,42,0.35)]"
        />
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export default function HeroParallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const still = !!reduce;

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 60, damping: 18, mass: 0.6 });
  const my = useSpring(rawY, { stiffness: 60, damping: 18, mass: 0.6 });

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const onMove = (e: React.MouseEvent) => {
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
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative overflow-hidden px-6 pt-28 lg:pt-0"
    >
      {/* Cahaya lembut di belakang */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[38%] h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(14,89,249,0.10),transparent)]"
      />

      {/* Kartu melayang — hanya desktop */}
      <div className="absolute inset-0 hidden lg:block">
        {layers.map((l, i) => (
          <FloatingLayer key={l.id} layer={l} index={i} mx={mx} my={my} scroll={scrollYProgress} still={still} />
        ))}
      </div>

      {/* Teks */}
      <div className="relative z-20 mx-auto max-w-[760px] lg:pt-[112px]">
        {/* Kabut putih tipis supaya teks tetap terbaca di atas foto */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-16 -inset-y-10 -z-10 hidden bg-[radial-gradient(closest-side,rgba(255,255,255,0.92),rgba(255,255,255,0.6)_60%,transparent)] lg:block"
        />
        {children}
      </div>

      {/* Orang + tablet: berdiri tepat di bawah teks, kepalanya menyelip
          sedikit di belakang baris terakhir. */}
      <div className="relative z-10 mx-auto mt-4 w-[min(64vw,300px)] -translate-x-[10%] lg:mt-6 lg:w-[340px]">
        <Presenter mx={mx} my={my} still={still} />
      </div>
    </section>
  );
}
