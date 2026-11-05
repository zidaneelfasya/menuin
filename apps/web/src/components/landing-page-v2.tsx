"use client";

import React from "react";
import OrderJourney from "@/components/landing/order-journey";
import ComparisonScroll from "@/components/landing/comparison-scroll";
import { HeroMousemoveMenuin } from "@/components/landing/hero-mousemove-menuin";
import FeatureTeaser from "@/components/landing/feature-teaser";
import { PricingSection } from "@/components/landing/pricing-section";

export default function LandingPageV2({
  isLoggedIn = false,
  userName = "",
}: {
  isLoggedIn?: boolean;
  userName?: string;
}) {
  return (
    <>
      {/* HERO WITH MOUSEMOVE PARALLAX */}
      <HeroMousemoveMenuin />

      {/* SEBELUM & SESUDAH — masalah jam sibuk yang hilang */}
      <ComparisonScroll />

      {/* CARA KERJA — dari scan QR sampai transaksi tercatat */}
      <OrderJourney />

      {/* CUPLIKAN FITUR — detail lengkap di /fitur */}
      <FeatureTeaser />

      {/* HARGA — card pricing dengan background putih */}
      <PricingSection />
    </>
  );
}
