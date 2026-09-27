import React from "react";

/** Kepala halaman untuk halaman di navbar (Tentang, Fitur, Harga, dst.). */
export default function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-36 md:pb-20 md:pt-44">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(14,89,249,0.08),transparent)]"
      />
      <div className="relative mx-auto max-w-[860px] text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0E59F9]">{eyebrow}</p>
        <h1 className="mt-5 text-[clamp(34px,5vw,60px)] font-semibold leading-[1.04] tracking-[-0.045em] text-[#0a0a0a] text-balance">
          {title}
        </h1>
        {description && (
          <p className="mx-auto mt-6 max-w-[60ch] text-[16px] leading-relaxed text-[#52525b] md:text-[17px]">
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
