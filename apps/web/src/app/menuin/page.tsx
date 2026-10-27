import type { Metadata } from "next";
import { MenuinSplash } from "./menuin-splash";

export const metadata: Metadata = {
  title: "Menuin — Logo",
  description: "Menuin — Unified F&B Operating System",
};

export default function MenuinPage() {
  return <MenuinSplash variant="putih" />;
}
