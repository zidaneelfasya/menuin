import type { Metadata } from "next";
import PageHero from "@/components/landing/page-hero";
import FeatureShowcase from "@/components/landing/feature-showcase";
import ReportTypes from "@/components/landing/report-types";

export const metadata: Metadata = {
  title: "Fitur - Menuin",
  description: "Kasir POS, QR pesan dari meja, shift & kas, stok, promo, tim, multi-outlet, dan laporan dalam satu aplikasi.",
};

export default function FiturPage() {
  return (
    <>
      <PageHero
        eyebrow="Fitur"
        title="Semua yang dibutuhkan outlet, dalam satu aplikasi."
        description="Dari tamu memesan di meja sampai pemilik membaca laporan, setiap bagian operasional membaca data yang sama."
      />
      <FeatureShowcase />
      <ReportTypes />
    </>
  );
}
