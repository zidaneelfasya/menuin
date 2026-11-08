"use client";

import React, { useCallback, useEffect, useState } from "react";
import StepMorphShowcase from "@/components/landing/step-morph-showcase";
import HeroScrollShowcase from "@/components/landing/hero-scroll-showcase";
import DeviceExportStory from "@/components/landing/device-export-story";
import ExperimentFaq from "@/components/landing/experiment-faq";
import ExperimentLoader from "@/components/landing/experiment-loader";
import { loaderProgress } from "@/components/landing/experiment-loader-motion";

export default function LandingExperimentPage({
  isLoggedIn = false,
}: {
  isLoggedIn?: boolean;
}) {
  const [sceneReady, setSceneReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [assets, setAssets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [canContinue, setCanContinue] = useState(false);
  const onSceneReady = useCallback(() => setSceneReady(true), []);
  const onAssetProgress = useCallback((progress: number) => setAssets(current => Math.max(current, progress)), []);
  const onSceneError = useCallback(() => setCanContinue(true), []);
  const onLoadingComplete = useCallback(() => setLoading(false), []);

  useEffect(() => {
    let cancelled = false;
    void document.fonts.ready.then(() => { if (!cancelled) setFontsReady(true); });
    const timeout = window.setTimeout(() => setCanContinue(true), 12000);
    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, []);

  return (
    <>
      {loading && <ExperimentLoader progress={loaderProgress(assets, fontsReady, sceneReady)} ready={fontsReady && sceneReady} canContinue={canContinue} onComplete={onLoadingComplete} />}
      {/* HERO EKSPERIMEN: Pinned Logo menuin. + Scroll-Scrubbed Devices + Corner Texts */}
      <HeroScrollShowcase isLoggedIn={isLoggedIn} loading={loading} onSceneReady={onSceneReady} onAssetProgress={onAssetProgress} onSceneError={onSceneError} />

      {/* STEP-BY-STEP MORPH SHOWCASE — terinspirasi soliciabrown.com */}
      <StepMorphShowcase />

      {/* DEVICE EXPORT STORY (3D Model + Multi-device flow + FeatureGrid + FeatureTeaser + Pricing) */}
      <DeviceExportStory />
      <ExperimentFaq />
    </>
  );
}
