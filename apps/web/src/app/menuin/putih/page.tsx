import type { Metadata } from "next";
import { MenuinSplash } from "../menuin-splash";

export const metadata: Metadata = {
  title: "Menuin — Putih",
  description: "Menuin Logo — White Background",
};

export default function MenuinSubPutihPage() {
  return <MenuinSplash variant="putih" />;
}
