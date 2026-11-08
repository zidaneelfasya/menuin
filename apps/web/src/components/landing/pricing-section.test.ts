import { describe, expect, it } from "vitest";
import { PricingSection as SectionFromPricing } from "./pricing";
import { PricingSection as SectionDirect } from "./pricing-section";
import { plans, planPrice } from "./pricing-data";

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
});
