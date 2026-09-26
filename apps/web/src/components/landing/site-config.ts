/**
 * Konfigurasi bersama situs marketing (landing + halaman di navbar).
 */

export type NavItem = { label: string; href: string };

export const primaryNav: NavItem[] = [
  { label: "Tentang", href: "/tentang" },
  { label: "Fitur", href: "/fitur" },
  { label: "Harga", href: "/harga" },
  { label: "Hubungi kami", href: "/kontak" },
];

/** Isi dropdown "Lainnya". */
export const moreNav: NavItem[] = [
  { label: "Tanya jawab", href: "/faq" },
  { label: "Keamanan", href: "/keamanan" },
];

// TODO(sales): ganti dengan kontak resmi sebelum rilis.
export const CONTACT = {
  whatsappNumber: "628123456789",
  whatsappDisplay: "+62 812-3456-789",
  email: "halo@menuin.id",
};

export const whatsappLink = (text: string) =>
  `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(text)}`;
