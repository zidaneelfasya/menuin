import type { Metadata } from "next";
import { MenuinSplash } from "../menuin/menuin-splash";

export const metadata: Metadata = {
  title: "Menuin — Putih",
  description: "Menuin Logo — White Background",
};

export default function MenuinPutihPage() {
  return <MenuinSplash variant="putih" />;
}
