import type { Metadata } from "next";
import PageHero from "@/components/landing/page-hero";
import ContactForm from "@/components/landing/contact-form";

export const metadata: Metadata = {
  title: "Hubungi kami - Menuin",
  description: "Tanya soal Menuin, minta demo, atau diskusikan paket Enterprise.",
};

export default function KontakPage() {
  return (
    <>
      <PageHero
        eyebrow="Hubungi kami"
        title="Ada pertanyaan? Kami bantu."
        description="Minta demo, tanya soal paket, atau diskusikan kebutuhan outlet Anda. Biasanya kami membalas di hari yang sama."
      />
      <section className="px-6 pb-24 md:pb-32">
        <div className="mx-auto max-w-[1240px]">
          <ContactForm />
        </div>
      </section>
    </>
  );
}
