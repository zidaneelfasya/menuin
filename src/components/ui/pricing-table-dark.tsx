"use client";

import React from "react";
import Link from "next/link";

export default function PricingTableDark() {
  const plans = [
    {
      name: "Pro",
      price: "Rp199k",
      period: "/mo",
      isCustomPrice: false,
      ctaText: "Inquire Now",
      ctaLink: "/auth/signup?plan=pro",
      features: [
        "Fast Cloud POS & Receipt Printing",
        "Unlimited QR Code Table Self-Ordering",
        "Automated Dynamic QRIS Payment",
        "Kitchen Display System (KDS Dapur)",
        "Multi-Staff & Role-Based Access Control",
        "Live Inventory & Low Stock Alerts",
        "Real-Time Sales, Shift & Profit Reports",
        "Bluetooth & LAN Cashier Printer Integration",
        "Real-Time Excel & PDF Data Export",
      ],
    },
    {
      name: "Custom",
      price: "Custom",
      period: "",
      isCustomPrice: true,
      ctaText: "Inquire Now",
      ctaLink: "https://wa.me/628123456789?text=Hello%20MENUIN,%20I%20am%20interested%20in%20the%20Custom%20Enterprise%20Plan",
      features: [
        "Unlimited Outlets & Multi-Branch Network",
        "Everything in Pro Plan Included",
        "Custom Domain & White-Label Branding",
        "Full API & External ERP Integrations",
        "Dedicated Account Manager & Onboarding",
        "24/7 Priority Support (99.9% SLA)",
        "Custom Hardware Setup & Staff Training",
        "Custom Feature Development on Demand",
        "Full Historical Data & Menu Migration",
      ],
    },
  ];

  return (
    <section className="w-full bg-white text-slate-900 py-20 md:py-28 px-6 sm:px-10 lg:px-14" id="pricing">
      <div className="mx-auto max-w-[1320px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start">
          
          {/* Column 1: Editorial Typographic Header (Spans 4 cols on lg) */}
          <div className="lg:col-span-4 pr-0 lg:pr-6">
            <div className="space-y-1">
              <h2 className="text-[clamp(32px,3.8vw,48px)] font-black leading-[1.05] tracking-[-0.045em] text-slate-900">
                Monthly Renewal,
              </h2>
              <h2 className="text-[clamp(32px,3.8vw,48px)] font-black leading-[1.05] tracking-[-0.045em] text-[#0E59F9]">
                No Fixed Term Contracts
              </h2>
            </div>

            <p className="text-slate-500 text-sm sm:text-[15px] mt-6 leading-relaxed">
              Flexible monthly subscription without long-term commitments. Digitize orders, cashier POS, tables, kitchen display, and stock in one unified platform.
            </p>

            <div className="mt-8 pt-8 border-t border-slate-100 flex items-center gap-3 text-xs font-semibold text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0E59F9] animate-pulse" />
              <span>Instant Activation & Free Setup Support</span>
            </div>
          </div>

          {/* Column 2 & 3: Pro (199k) & Custom (Spans 8 cols on lg) */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="flex flex-col justify-between p-7 sm:p-8 rounded-3xl bg-slate-50/70 border border-slate-200/80 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
              >
                
                {/* Plan Details */}
                <div>
                  <div className="mb-2">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                      {plan.name}
                    </h3>
                  </div>

                  {/* Price display */}
                  <div className="flex items-baseline gap-1.5 mb-8">
                    <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-none">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-slate-500 text-sm font-semibold">
                        {plan.period}
                      </span>
                    )}
                  </div>

                  {/* Feature Rows with clean horizontal divider lines */}
                  <div className="border-t border-slate-200/90">
                    {plan.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="py-3 border-b border-slate-200/90 text-[13px] sm:text-[13.5px] text-slate-700 font-medium leading-relaxed"
                      >
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom CTA Button */}
                <div className="pt-8 mt-4">
                  <Link
                    href={plan.ctaLink}
                    className="inline-flex items-center gap-3 group hover:opacity-85 transition-opacity"
                  >
                    <span className="w-8 h-8 rounded-full bg-[#0E59F9] text-white flex items-center justify-center text-xs font-black shadow-md shadow-blue-500/20 group-hover:scale-105 group-hover:translate-x-0.5 transition-all">
                      &gt;
                    </span>
                    <span className="text-sm font-bold text-slate-900 tracking-wide group-hover:text-[#0E59F9] transition-colors">
                      {plan.ctaText}
                    </span>
                  </Link>
                </div>

              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
