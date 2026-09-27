import type { Metadata } from "next";
import FaqEditorial from "@/components/ui/faq-editorial";

export const metadata: Metadata = {
  title: "Tanya jawab - Menuin",
  description: "Pertanyaan yang paling sering ditanyakan pemilik outlet sebelum memakai Menuin.",
};

export default function FaqPage() {
  return (
    <div className="pt-16">
      <FaqEditorial />
    </div>
  );
}
