import type { Metadata } from "next";
import { MenuinSplash } from "../menuin/menuin-splash";

export const metadata: Metadata = {
  title: "Menuin — Biru",
  description: "Menuin Logo — Blue Background",
};

export default function MenuinBiruPage() {
  return <MenuinSplash variant="biru" />;
}
