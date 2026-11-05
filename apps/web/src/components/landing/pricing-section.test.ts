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
    expect(ids).toEqual(["kasir", "kasir-plus", "lengkap", "custom"]);

    plans.forEach((plan) => {
      expect(plan.name).toBeTruthy();
      expect(plan.tagline).toBeTruthy();
      expect(plan.bullets.length).toBeGreaterThan(0);
      expect(plan.cta.label).toBeTruthy();
      expect(plan.cta.href).toBeTruthy();
    });
  });

  it("calculates annual billing price correctly (10 months bill for 12 months with strikethrough original)", () => {
    const kasir = plans.find((p) => p.id === "kasir")!;
    expect(planPrice(kasir, "monthly")).toEqual({
      price: "Rp 49.900",
      period: "/bulan per outlet",
      original: undefined,
    });

    // annual is 10 * 49900 = 499000, struckthrough 12 * 49900 = 598800
    expect(planPrice(kasir, "annual")).toEqual({
      price: "Rp 499.000",
      period: "/tahun per outlet",
      original: "Rp 598.800",
    });

    const custom = plans.find((p) => p.id === "custom")!;
    expect(planPrice(custom, "monthly")).toEqual({
      price: "Hubungi kami",
      period: undefined,
      original: undefined,
    });
    expect(planPrice(custom, "annual")).toEqual({
      price: "Hubungi kami",
      period: undefined,
      original: undefined,
    });
  });

  it("filters to exactly 3 self-serve plans for the 3-column card grid", () => {
    const displayPlans = plans.filter((p) => p.id !== "custom");
    expect(displayPlans).toHaveLength(3);
    expect(displayPlans.map((p) => p.id)).toEqual(["kasir", "kasir-plus", "lengkap"]);
  });
});
