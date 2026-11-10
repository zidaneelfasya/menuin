export const PREVIEW_DEVICES = [
  {
    label: "Phone",
    image: "/landing/features/storefront-menu-story.jpg",
    ratio: 73.35 / 159.35,
    widthScale: 0.86,
    radius: 48,
    bezel: 5.5,
    rim: 3.6,
    crop: [1, 1],
    caption: "Storefront — pesan langsung dari ponsel pelanggan.",
    description: ["Pelanggan menjelajahi katalog produk dan membuat pesanan melalui storefront.", "Katalog produk, keranjang, dan status pesanan tersedia dalam satu alur."],
  },
  {
    label: "Tab",
    image: "/img/landing/pos-ipad.webp",
    ratio: 4 / 3,
    widthScale: 0.70,
    radius: 20,
    bezel: 10,
    rim: 2.6,
    crop: [0.928, 0.904],
    caption: "POS kasir — kelola pesanan di layar tablet.",
    description: ["Kasir memilih produk, mengatur pesanan, dan memproses pembayaran.", "Layar yang lebih luas membantu tim melayani transaksi di outlet."],
  },
  {
    label: "Laptop",
    image: "/landing/features/dashboard.png",
    ratio: 16 / 10,
    widthScale: 0.86,
    radius: 12,
    bezel: 7,
    rim: 2.2,
    crop: [1, 1],
    caption: "Dashboard — lihat gambaran bisnis dari laptop.",
    description: ["Pantau ringkasan penjualan, transaksi, dan produk terlaris.", "Dashboard menyatukan informasi operasional agar pemilik dapat mengikuti perkembangan outlet."],
  },
] as const;

export const STORY_PICTURES = [
  "/landing/cases/01-restaurant.jpg", "/landing/cases/03-coffeeshop.jpg",
  "/landing/features/storefront-status.jpg", "/landing/features/orders-kds.png",
  "/landing/cases/02-retail.jpg", "/landing/features/dashboard.png",
  "/landing/cases/04-multioutlet.jpg", "/img/landing/journey/tamu-keranjang.webp",
] as const;

// All three layouts share these assets; only the spatial arrangement changes.
export const GALLERY_IMAGES = [...new Set<string>([
  ...PREVIEW_DEVICES.map(device => device.image),
  "/landing/features/storefront-cart-story.jpg",
  ...STORY_PICTURES,
])];
export const GALLERY_IMAGE_ORDER = [0, 3, 4, 2, 5, 6, 7, 1, 8, 9, 10] as const;
