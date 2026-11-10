import { describe, expect, it } from "vitest";
import { PricingSection as SectionFromPricing } from "./pricing";
import { PricingSection as SectionDirect } from "./pricing-section";
import { plans, planPrice, comparison } from "./pricing-data";

describe("PricingSection & Pricing Data", () => {
  it("exports PricingSection correctly from both entry points", () => {
    expect(SectionDirect).toBeDefined();
    expect(SectionFromPricing).toBeDefined();
    expect(SectionDirect).toBe(SectionFromPricing);
  });

  it("provides all 4 plans with correct id, name, and CTA URLs", () => {
    expect(plans).toHaveLength(4);
    const ids = plans.map((p) => p.id);
    expect(ids).toEqual(["basic", "pro", "promax", "custom"]);

    plans.forEach((plan) => {
      expect(plan.name).toBeTruthy();
      expect(plan.tagline).toBeTruthy();
      expect(plan.bullets.length).toBeGreaterThan(0);
      expect(plan.cta.label).toBeTruthy();
      expect(plan.cta.href).toBeTruthy();
    });
  });

  it("calculates annual billing price correctly (10 months bill for 12 months with strikethrough original)", () => {
    const basic = plans.find((p) => p.id === "basic")!;
    expect(planPrice(basic, "monthly")).toEqual({
      price: "Rp 49.900",
      period: "/bulan per outlet",
      original: undefined,
      savingsPercent: undefined,
    });

    // annual is 10 * 49900 = 499000, struckthrough 12 * 49900 = 598800
    expect(planPrice(basic, "annual")).toEqual({
      price: "Rp 499.000",
      period: "/tahun per outlet",
      original: "Rp 598.800",
      savingsPercent: "Hemat 17%",
    });

    const pro = plans.find((p) => p.id === "pro")!;
    expect(planPrice(pro, "monthly")).toEqual({
      price: "Rp 99.900",
      period: "/bulan per outlet",
      original: undefined,
      savingsPercent: undefined,
    });
    expect(planPrice(pro, "annual")).toEqual({
      price: "Rp 999.000",
      period: "/tahun per outlet",
      original: "Rp 1.198.800",
      savingsPercent: "Hemat 17%",
    });

    const promax = plans.find((p) => p.id === "promax")!;
    expect(planPrice(promax, "monthly")).toEqual({
      price: "Rp 149.900",
      period: "/bulan per outlet",
      original: undefined,
      savingsPercent: undefined,
    });
    expect(planPrice(promax, "annual")).toEqual({
      price: "Rp 1.499.000",
      period: "/tahun per outlet",
      original: "Rp 1.798.800",
      savingsPercent: "Hemat 17%",
    });

    // quarterly (3 months)
    expect(planPrice(basic, "quarterly")).toEqual({
      price: "Rp 134.900",
      period: "/3 bulan per outlet",
      original: "Rp 149.700",
      savingsPercent: "Hemat 10%",
    });
    expect(planPrice(pro, "quarterly")).toEqual({
      price: "Rp 269.900",
      period: "/3 bulan per outlet",
      original: "Rp 299.700",
      savingsPercent: "Hemat 10%",
    });
    expect(planPrice(promax, "quarterly")).toEqual({
      price: "Rp 399.900",
      period: "/3 bulan per outlet",
      original: "Rp 449.700",
      savingsPercent: "Hemat 11%",
    });

    const custom = plans.find((p) => p.id === "custom")!;
    expect(planPrice(custom, "monthly")).toEqual({
      price: "Hubungi kami",
      period: undefined,
      original: undefined,
      savingsPercent: undefined,
    });
    expect(planPrice(custom, "quarterly")).toEqual({
      price: "Hubungi kami",
      period: undefined,
      original: undefined,
      savingsPercent: undefined,
    });
    expect(planPrice(custom, "annual")).toEqual({
      price: "Hubungi kami",
      period: undefined,
      original: undefined,
      savingsPercent: undefined,
    });
  });

  it("filters to exactly 3 self-serve plans for the 3-column card grid", () => {
    const displayPlans = plans.filter((p) => p.id !== "custom");
    expect(displayPlans).toHaveLength(3);
    expect(displayPlans.map((p) => p.id)).toEqual(["basic", "pro", "promax"]);
  });

  it("satisfies all specific tier checklist & naming requirements", () => {
    const basic = plans.find((p) => p.id === "basic")!;
    const pro = plans.find((p) => p.id === "pro")!;
    const promax = plans.find((p) => p.id === "promax")!;

    // 1. Basic: QRIS item does NOT have isNew: true (same checkmark style as other basic items)
    const qrisBasic = basic.features.find((f) => f.text.includes("QRIS"));
    expect(qrisBasic).toBeDefined();
    expect(qrisBasic?.isNew).toBeFalsy();

    // 2. Basic: Kelola produk dan kategori (without 'katalog')
    expect(basic.bullets).toContain("Kelola produk dan kategori");
    expect(basic.bullets).not.toContain("Kelola katalog produk dan kategori");

    // 3. Basic: Ekspor laporan ke PDF & Excel is in Basic
    expect(basic.bullets).toContain("Ekspor laporan ke PDF & Excel");

    // 4. Pro: Kelola Stok Bahan dan Gudang
    expect(pro.bullets).toContain("Kelola Stok Bahan dan Gudang");
    expect(pro.featured).toContain("Kelola Stok Bahan dan Gudang");

    // 5. Pro: Tambah hingga 5 perangkat kasir aktif, low stock alerts, audit mutasi, PIN
    expect(pro.bullets).toContain("Tambah hingga 5 perangkat kasir aktif");
    expect(pro.bullets).toContain("Peringatan otomatis stok bahan baku menipis (Low stock alert)");
    expect(pro.bullets).toContain("Riwayat mutasi & audit stok bahan keluar-masuk");
    expect(pro.bullets).toContain("Akses cepat PIN staf kasir untuk keamanan transaksi");
    expect(pro.bullets).toContain("Impor & ekspor massal data produk via Excel");

    // Pro is noticeably longer than Basic
    expect(pro.features.length).toBeGreaterThanOrEqual(14);
    expect(pro.features.length).toBeGreaterThan(basic.features.length);

    // 6. Promax: Removed operational checklist sync, onboarding priority, multi-role
    expect(promax.bullets.some((b) => b.includes("Checklist item pesanan operasional"))).toBe(false);
    expect(promax.bullets.some((b) => b.includes("Prioritas dukungan teknis"))).toBe(false);
    expect(promax.bullets.some((b) => b.includes("Hak akses multi-peran"))).toBe(false);

    // 7. Promax: Card is tall with at least 17 items and noticeably longer than Pro
    expect(promax.features.length).toBeGreaterThanOrEqual(17);
    expect(promax.features.length).toBeGreaterThan(pro.features.length);

    // 8. Comparison table validation
    const devicesRow = comparison
      .flatMap((g) => g.rows)
      .find((r) => r.label === "Perangkat kasir aktif");
    expect(devicesRow?.values).toEqual(["1", "Hingga 5", "Tanpa batas", "Tanpa batas"]);

    const exportRow = comparison
      .flatMap((g) => g.rows)
      .find((r) => r.label === "Ekspor laporan ke PDF & Excel");
    expect(exportRow?.values).toEqual([true, true, true, true]);
  });
});
