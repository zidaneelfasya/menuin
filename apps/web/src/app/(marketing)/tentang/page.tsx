import type { Metadata } from "next";
import PageHero from "@/components/landing/page-hero";
import AboutSection from "@/components/landing/about-section";
import AudienceGrid from "@/components/landing/audience-grid";

export const metadata: Metadata = {
  title: "Tentang - Menuin",
  description: "Menuin dibuat untuk membuat menjalankan dan mengembangkan bisnis F&B jadi lebih sederhana.",
};

export default function TentangPage() {
  return (
    <>
      <PageHero
        eyebrow="Tentang Menuin"
        title="Simple ways to run F&B."
        description="To make running and growing an F&B business simpler. Itu alasan Menuin dibuat: supaya pemilik outlet bisa fokus ke tamu dan menu, bukan ke nota dan rekap."
      />
      <AboutSection />
      <AudienceGrid />
    </>
  );
}
