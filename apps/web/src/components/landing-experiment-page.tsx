"use client";

import React from "react";
import StepMorphShowcase from "@/components/landing/step-morph-showcase";
import HeroScrollShowcase from "@/components/landing/hero-scroll-showcase";
import DeviceExportStory from "@/components/landing/device-export-story";

export default function LandingExperimentPage({
  isLoggedIn = false,
}: {
  isLoggedIn?: boolean;
}) {
  return (
    <>
      {/* HERO EKSPERIMEN: Pinned Logo menuin. + Scroll-Scrubbed Devices + Corner Texts */}
      <HeroScrollShowcase isLoggedIn={isLoggedIn} />

      {/* STEP-BY-STEP MORPH SHOWCASE — terinspirasi soliciabrown.com */}
      <StepMorphShowcase />

      {/* DEVICE EXPORT STORY (3D Model + Multi-device flow + FeatureGrid + FeatureTeaser + Pricing) */}
      <DeviceExportStory />
    </>
  );
}
