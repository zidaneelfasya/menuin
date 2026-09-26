import type { Metadata } from "next";
import PageHero from "@/components/landing/page-hero";
import SecuritySection from "@/components/landing/security-section";

export const metadata: Metadata = {
  title: "Keamanan - Menuin",
  description: "Cara Menuin menjaga pembayaran dan data outlet Anda.",
};

export default function KeamananPage() {
  return (
    <>
      <PageHero
        eyebrow="Keamanan"
        title="Dibangun untuk dipercaya setiap hari."
        description="Pembayaran diproses penyelenggara berizin, data tiap outlet disimpan terpisah, dan setiap perubahan penting tercatat."
      />
      <SecuritySection />
    </>
  );
}
