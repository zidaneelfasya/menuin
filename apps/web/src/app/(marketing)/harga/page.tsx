import type { Metadata } from "next";
import PageHero from "@/components/landing/page-hero";
import { PricingCards, PricingTable } from "@/components/landing/pricing";
import FaqEditorial from "@/components/ui/faq-editorial";

export const metadata: Metadata = {
  title: "Harga - Menuin",
  description: "Langganan bulanan per outlet, tanpa kontrak tahunan dan tanpa komisi per transaksi.",
};

export default function HargaPage() {
  return (
    <>
      <PageHero
        eyebrow="Harga"
        title="Bayar bulanan, tanpa kontrak tahunan."
        description="Dihitung per outlet per bulan. Tidak ada biaya pemasangan dan tidak ada potongan komisi per transaksi."
      />
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-[1240px]">
          <PricingCards />
        </div>
      </section>
      <section className="border-t border-black/[0.06] px-6 py-24 md:py-28">
        <div className="mx-auto max-w-[1240px]">
          <h2 className="text-[clamp(26px,3.4vw,40px)] font-semibold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a]">
            Bandingkan fitur tiap paket
          </h2>
          <p className="mt-3 max-w-[60ch] text-[15.5px] leading-relaxed text-[#52525b]">
            Semua paket bisa dicoba 14 hari tanpa kartu kredit.
          </p>
          <div className="mt-10">
            <PricingTable />
          </div>
        </div>
      </section>
      <FaqEditorial />
    </>
  );
}
