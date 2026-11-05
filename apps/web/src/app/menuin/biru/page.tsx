import type { Metadata } from "next";
import { MenuinSplash } from "../menuin-splash";

export const metadata: Metadata = {
  title: "Menuin — Biru",
  description: "Menuin Logo — Blue Background",
};

export default function MenuinSubBiruPage() {
  return <MenuinSplash variant="biru" />;
}
