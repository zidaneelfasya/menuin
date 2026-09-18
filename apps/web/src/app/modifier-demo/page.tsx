"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CustomizationModal,
  type Product,
  type ModifierGroup,
  type Modifier,
} from "@/components/shared/customization-modal";
import { ProductDetailModal } from "@/components/shared/product-detail-modal";
import { formatCurrency } from "@/lib/utils/format";
import {
  Smartphone,
  Palette,
  CheckCircle2,
  Coffee,
  Plus,
  ArrowRight,
  Info,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const BRAND_THEMES = [
  { name: "Biru Outlet", color: "#0E59F9" },
  { name: "Hijau Toko", color: "#16A34A" },
  { name: "Merah Resto", color: "#DC2626" },
  { name: "Amber Kafe", color: "#D97706" },
  { name: "Ungu Brand", color: "#7C3AED" },
];

const DEMO_PRODUCT: Product = {
  id: "prod-kopi-susu",
  name: "Kopi Susu Gula Aren",
  price: 25000,
  imageUrl:
    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
  modifierGroupIds: ["mg-size", "mg-ice", "mg-milk", "mg-shot"],
};

const DEMO_MODIFIER_GROUPS: ModifierGroup[] = [
  {
    id: "mg-size",
    name: "Ukuran Gelas",
    isRequired: true,
    minSelections: 1,
    maxSelections: 1,
    modifiers: [
      { id: "mod-reg", name: "Regular", price: 0 },
      { id: "mod-lrg", name: "Large", price: 5000 },
    ],
  },
  {
    id: "mg-ice",
    name: "Tingkat Es",
    isRequired: true,
    minSelections: 1,
    maxSelections: 1,
    modifiers: [
      { id: "mod-ice-norm", name: "Normal Ice", price: 0 },
      { id: "mod-ice-less", name: "Less Ice", price: 0 },
      { id: "mod-ice-none", name: "No Ice", price: 0 },
    ],
  },
  {
    id: "mg-milk",
    name: "Pilihan Susu",
    isRequired: false,
    minSelections: 0,
    maxSelections: 1,
    modifiers: [
      { id: "mod-milk-fresh", name: "Fresh Milk", price: 0 },
      { id: "mod-milk-oat", name: "Oat Milk", price: 8000 },
      { id: "mod-milk-almond", name: "Almond Milk", price: 10000 },
      { id: "mod-milk-soy", name: "Soy Milk", price: 6000 },
    ],
  },
  {
    id: "mg-shot",
    name: "Tambahan Espresso",
    isRequired: false,
    minSelections: 0,
    maxSelections: 3,
    modifiers: [
      { id: "mod-extra-shot", name: "Extra Shot Espresso", price: 6000 },
    ],
  },
];

export default function ModifierDemoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [themeColor, setThemeColor] = useState("#0E59F9");
  const [lastAddedResult, setLastAddedResult] = useState<{
    product: Product;
    modifiers: Modifier[];
    notes: string;
    quantity: number;
    total: number;
  } | null>(null);

  const handleAddToCart = (
    product: Product,
    selectedModifiers: Modifier[],
    notes: string,
    quantity: number
  ) => {
    let extra = 0;
    selectedModifiers.forEach((m) => (extra += Number(m.price)));
    const total = (Number(product.price) + extra) * quantity;

    setLastAddedResult({
      product,
      modifiers: selectedModifiers,
      notes,
      quantity,
      total,
    });

    toast.success(`${quantity}x ${product.name} berhasil ditambahkan!`, {
      description: `Total: ${formatCurrency(total)}`,
    });
  };

  return (
    <div
      style={{ "--outlet-primary": themeColor } as React.CSSProperties}
      className="min-h-screen bg-gray-50 text-gray-900 flex flex-col selection:bg-blue-100"
    >
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold shadow-xs transition-colors"
              style={{ backgroundColor: themeColor }}
            >
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-gray-900">
                  Demo Modal Modifier Storefront
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Mobile Touch UX
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                Pengujian interaksi sentuh penuh (full-row hit target) & bottom-sheet modal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/status-demo"
              className="text-xs font-semibold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all flex items-center gap-1.5"
            >
              <span>Demo Status Rive</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Banner Info */}
        <div className="mb-6 bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg text-white flex items-center justify-center shrink-0 transition-colors"
              style={{ backgroundColor: themeColor }}
            >
              <Info className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-blue-950">
                Setiap baris modifier memiliki area sentuh penuh (Full-Row Hit Target &ge; 48px)
              </p>
              <p className="text-xs text-blue-700">
                Ketuk di mana saja pada baris (teks, harga, maupun ruang kosong) untuk memilih tanpa perlu mengincar radio kecil.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-95 shrink-0"
            style={{ backgroundColor: themeColor }}
          >
            Buka Modal Modifier Sekarang
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls & Specifications Panel */}
          <div className="lg:col-span-5 space-y-4">
            {/* 1. Theme Color Selector Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Palette className="w-4 h-4 text-gray-600" />
                    Warna Brand Outlet
                  </h2>
                  <p className="text-xs text-gray-500">Uji adaptasi tema dinamis modal</p>
                </div>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                  {themeColor}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {BRAND_THEMES.map((theme) => {
                  const isSelected = themeColor === theme.color;
                  return (
                    <button
                      key={theme.color}
                      type="button"
                      onClick={() => setThemeColor(theme.color)}
                      className={`h-9 rounded-xl flex items-center justify-center transition-all border ${
                        isSelected
                          ? "ring-2 ring-offset-2 ring-gray-900 shadow-xs scale-105"
                          : "hover:scale-102 opacity-80 hover:opacity-100"
                      }`}
                      style={{
                        backgroundColor: theme.color,
                        borderColor: "rgba(0,0,0,0.1)",
                      }}
                      title={theme.name}
                      aria-label={theme.name}
                    >
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-white stroke-[2.5]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. UX Checklist Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs text-xs space-y-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Fitur UX Mobile yang Diimplementasikan
              </h3>
              <div className="space-y-2 text-gray-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Full-Row Click:</strong> Baris &ge; 48px tinggi merespons ketukan di seluruh area.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Bottom-Sheet Mobile:</strong> Menempel di dasar layar dengan sudut atas membulat.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Multi-Quantity Support:</strong> Ketuk ulang opsi multi-select (misal Extra Shot) untuk menambah jumlah &times;2, &times;3.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Sticky Primary CTA:</strong> Tombol pesanan selalu terlihat di bawah dengan kalkulasi total instan.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Touch Targets Nyaman:</strong> Tombol &minus; / + kuantitas utama &ge; 44px.
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Last Added Item Log */}
            {lastAddedResult && (
              <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl shadow-xs text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-emerald-900">
                  <span>Hasil Tambah ke Keranjang:</span>
                  <span className="font-mono">{formatCurrency(lastAddedResult.total)}</span>
                </div>
                <div className="text-emerald-800 space-y-1">
                  <p>
                    <strong>{lastAddedResult.quantity}x</strong> {lastAddedResult.product.name}
                  </p>
                  {lastAddedResult.modifiers.length > 0 && (
                    <p className="text-[11px] text-emerald-700">
                      Modifier: {lastAddedResult.modifiers.map((m) => m.name).join(", ")}
                    </p>
                  )}
                  {lastAddedResult.notes && (
                    <p className="text-[11px] text-emerald-700 italic">
                      Catatan: &ldquo;{lastAddedResult.notes}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Storefront Mobile Mockup Frame */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-sm bg-white rounded-[36px] border-8 border-gray-900 shadow-2xl overflow-hidden flex flex-col">
              {/* Speaker & Camera Notch */}
              <div className="bg-gray-900 py-2.5 px-6 flex items-center justify-center">
                <div className="w-16 h-3.5 bg-gray-800 rounded-full"></div>
              </div>

              {/* Mobile Header Bar */}
              <div className="bg-white px-4 py-3 border-b border-gray-150 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">Kedai Kopi Menuin</span>
                <span className="text-[10px] font-mono text-gray-400">12:30 PM</span>
              </div>

              {/* Storefront Product Preview */}
              <div className="p-4 bg-gray-50 flex-1 space-y-4">
                <div className="bg-white rounded-2xl border border-gray-150 shadow-xs overflow-hidden">
                  <div className="w-full h-44 bg-gray-100 relative overflow-hidden">
                    <img
                      src={DEMO_PRODUCT.imageUrl || ""}
                      alt={DEMO_PRODUCT.name}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className="absolute top-3 left-3 text-[10px] font-bold text-white px-2 py-0.5 rounded-md shadow-xs"
                      style={{ backgroundColor: themeColor }}
                    >
                      Best Seller
                    </span>

                    {/* Subtle Round Info Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDetailOpen(true);
                      }}
                      className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/35 hover:bg-black/55 text-white/95 backdrop-blur-md flex items-center justify-center shadow-xs transition-all active:scale-90 border border-white/20 cursor-pointer"
                      title="Lihat detail item"
                      aria-label="Lihat detail item"
                    >
                      <Info className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-base text-gray-900">
                      {DEMO_PRODUCT.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      Espresso house blend dipadukan susu segar creamy dan gula aren organik pilihan.
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="font-black text-base text-gray-900">
                        {formatCurrency(Number(DEMO_PRODUCT.price))}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-95 flex items-center gap-1"
                        style={{ backgroundColor: themeColor }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Kustomisasi</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Direct Trigger Card */}
                <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs text-center space-y-2">
                  <Coffee
                    className="w-6 h-6 mx-auto transition-colors"
                    style={{ color: themeColor }}
                  />
                  <p className="text-xs font-bold text-gray-800">
                    Uji Kemudahan Sentuh Mobile
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Klik tombol di bawah untuk membuka modal pemilihan modifier
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="w-full h-11 rounded-xl text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-95"
                    style={{ backgroundColor: themeColor }}
                  >
                    Buka Modal Kustomisasi
                  </button>
                </div>
              </div>

              {/* Mobile Home Indicator Bar */}
              <div className="bg-gray-50 pb-2.5 pt-1 flex justify-center">
                <div className="w-28 h-1 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* The Actual Customization Modal being tested */}
      <CustomizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={DEMO_PRODUCT}
        allModifierGroups={DEMO_MODIFIER_GROUPS}
        primaryColor={themeColor}
        onAddToCart={handleAddToCart}
      />

      {/* Item Detail Modal */}
      <ProductDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        product={{
          ...DEMO_PRODUCT,
          categoryName: "Signature Coffee",
          description: "Espresso house blend premium yang dipadukan dengan susu segar creamy dan sirup gula aren organik pilihan asli Jawa Barat. Memberikan harmoni rasa manis gurih yang lembut dan aroma kopi yang mendalam.",
        }}
        primaryColor={themeColor}
        onCustomize={() => {
          setIsDetailOpen(false);
          setIsModalOpen(true);
        }}
        onAddToCart={() => {
          setIsDetailOpen(false);
          toast.success(`${DEMO_PRODUCT.name} ditambahkan`);
        }}
      />
    </div>
  );
}
