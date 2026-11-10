"use client";

import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { clamp, deviceArrival, deviceCopyReveal, deviceLandingStrength, extendedStoryProgress, fallbackEntrance, getFormatFrames, laptopNotchProgress, lerp, phase, phoneIslandRetraction, pickerPose, previewSize, pricingScrollOffset, sampleStory, sampleExtendedStory, screenTransition, storyProgress, storyScrollPosition, type FormatIndex, type StoryLayout } from "./device-story-motion";
import { PREVIEW_DEVICES } from "./device-story-devices";
import { attachProgressiveFormatScroll } from "./device-story-progressive-scroll";
import type { DeviceStoryRenderer } from "./device-story-renderer";
import { CSS_VARS, FeatureGridCards, FeatureGridHeader } from "./feature-grid-minimal";
import { FeatureTeaserHeader, FeatureTeaserBody } from "./feature-teaser";
import { PricingHeader } from "./pricing-section";
import { PricingCards } from "./pricing-cards";
import { cn } from "@/lib/utils";
import styles from "./device-export-story.module.css";

const SCREEN_COPY = [
  ["Katalog produk digital tersedia langsung di ponsel pelanggan.", "Pelanggan dapat menjelajahi katalog produk dan menambahkan pesanan tanpa perlu menunggu staf."],
  ["Semua pilihan terkumpul dalam satu keranjang.", "Pelanggan dapat memeriksa rincian, memilih modifier, dan mengisi data sebelum melanjutkan pembayaran."],
  ["Pantau perjalanan pesanan secara langsung.", "Pelanggan dapat melihat setiap tahap, dari pesanan diterima dan disiapkan hingga selesai."],
];

export default function DeviceExportStory() {
  const rootRef = useRef<HTMLElement>(null);
  const selectDevice = useRef<((index: FormatIndex) => void) | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const controller = new AbortController();
      const find = <T extends Element = HTMLElement>(key: string) => root.querySelector<T>(`[data-${key}]`)!;
      const track = find<HTMLElement>("track");
      const stage = find<HTMLElement>("stage");
      const phone = find<HTMLElement>("phone-anchor");
      const entranceFallback = find<HTMLElement>("entrance-fallback");
      const room = find<HTMLElement>("preview-room");
      const canvas = find<HTMLCanvasElement>("canvas");
      const deviceCopy = find<HTMLElement>("device-copy");
      const deviceLetters = Array.from(root.querySelectorAll<HTMLElement>("[data-device-letter]"));
      const deviceDescription = find<HTMLElement>("device-description");
      const descriptions = Array.from(root.querySelectorAll<HTMLElement>("[data-screen-description]"));
      const heading = find<HTMLElement>("export-heading");
      const lower = find<HTMLElement>("export-lower");
      const output = find<HTMLElement>("export");
      const next = find<HTMLElement>("next");
      const nextTitle = find<HTMLElement>("next-title");
      const nextContent = find<HTMLElement>("next-content");
      const teaser = find<HTMLElement>("teaser");
      const teaserTitle = find<HTMLElement>("teaser-title");
      const teaserContent = find<HTMLElement>("teaser-content");
      const pricing = find<HTMLElement>("pricing");
      const pricingTitle = find<HTMLElement>("pricing-title");
      const pricingContent = find<HTMLElement>("pricing-content");
      const pill = find<HTMLElement>("pill");
      const pillLabels = find<HTMLElement>("pill-labels");
      const labels = Array.from(root.querySelectorAll<HTMLElement>("[data-device-option]"));
      const fallback = find<HTMLElement>("preview-fallback");
      const island = find<HTMLElement>("preview-island");
      const notch = find<HTMLElement>("preview-notch");
      const fallbackImage = fallback.querySelector("img")!;
      const previewCaption = find<HTMLElement>("preview-caption");
      const previewDescriptions = Array.from(root.querySelectorAll<HTMLElement>("[data-preview-description]"));
      let layout: StoryLayout;
      let engine: DeviceStoryRenderer | null = null;
      let requested = false;
      let visible = false;
      let dirty = true;
      let progress = 0;
      let lastProgress = -1;
      let scrollProgress = 0;
      let scrollDistance = 0;
      let deviceScrollDistance = 0;
      let physicalScrollProgress = 0;
      let lastScrollProgress = -1;
      let formatPosition = 0;
      let galleryPosition = 0;
      const landing = { amount: 0 };
      let landingMotion: gsap.core.Animation | null = null;
      let landingReturning = false;
      let selectedFormat = 0;
      let ratios: ReturnType<typeof attachProgressiveFormatScroll> | null = null;
      let descriptionIndex = -1;
      let previewIndex = -1;
      let labelBoxes: { left: number; width: number }[] = [];

      const measure = () => {
        const s = stage.getBoundingClientRect(), p = phone.getBoundingClientRect(), r = room.getBoundingClientRect();
        layout = {
          width: s.width, height: s.height,
          phone: { x: p.left + p.width / 2 - s.left, y: p.top + p.height / 2 - s.top, height: p.height },
          preview: { x: r.left + r.width / 2 - s.left, y: r.top + r.height / 2 - s.top, width: r.width, height: r.height },
        };
        labelBoxes = labels.map(label => ({ left: label.offsetLeft, width: label.offsetWidth }));
        engine?.resize(layout);
        dirty = true;
      };
      const show = (el: HTMLElement, opacity: number) => {
        el.style.opacity = opacity.toFixed(4);
        el.style.visibility = opacity > 0.001 ? "visible" : "hidden";
      };
      const render = (time: number) => {
        if (!layout || document.hidden || (!visible && !dirty)) return;
        const ext = sampleExtendedStory(scrollProgress);
        const frame = ext.story;
        const redraw = dirty || scrollProgress !== lastScrollProgress || progress !== lastProgress;
        if (redraw) {
          show(deviceCopy, progress >= 0.33 ? 1 - phase(progress, 0.51, 0.55) : 0);
          deviceLetters.forEach((letter, index) => {
            const reveal = phase(progress, 0.33 + index * 0.0015, 0.349 + index * 0.0015);
            letter.style.opacity = String(reveal);
            letter.style.transform = `translateY(${(1 - reveal) * 0.24}em)`;
          });
          const descriptionReveal = phase(progress, 0.365, 0.39);
          show(deviceDescription, descriptionReveal);
          deviceDescription.style.transform = `translateY(${(1 - descriptionReveal) * 18}px)`;
          const screen = screenTransition(frame.sheet);
          const activeScreen = screen.stage + (screen.rise >= 0.5 ? 1 : 0);
          if (activeScreen !== descriptionIndex) {
            descriptions.forEach((description, index) => { description.textContent = SCREEN_COPY[activeScreen][index]; });
            descriptionIndex = activeScreen;
          }
          show(output, frame.exportAlpha);
          heading.style.transform = `translateY(${(1 - frame.exportEntrance) * 40}px)`;
          lower.style.transform = `translateY(${(1 - frame.exportEntrance) * 65}px)`;
          const size = previewSize(formatPosition, layout.preview.width, layout.preview.height, galleryPosition, landing.amount);
          const phoneBlend = 1 - clamp(galleryPosition, 0, 1);
          const activePhoneExtension = 14 * clamp(layout.preview.height / 720, 0.65, 1) * phoneBlend;
          fallback.style.width = `${size.width}px`; fallback.style.height = `${size.height + activePhoneExtension}px`;
          fallback.style.borderWidth = `${size.bezel}px`; fallback.style.borderRadius = `${size.radius + size.bezel}px`;
          fallback.style.filter = `brightness(${1 - frame.exportDarken})`;
          const islandRetraction = phoneIslandRetraction(galleryPosition);
          island.style.transform = `translateX(-50%) translateY(${-175.2 * islandRetraction}%) scaleX(${1 - 0.2 * islandRetraction})`;
          island.style.backgroundColor = `rgb(${16 * islandRetraction} ${17 * islandRetraction} ${20 * islandRetraction})`;
          const selection = pickerPose(progress, galleryPosition);
          const notchGrowth = laptopNotchProgress(selection.index, selection.focus);
          notch.style.transform = `translateX(-50%) scale(${0.65 + 0.35 * notchGrowth}, ${notchGrowth})`;
          const pillPosition = clamp(size.pill, 0, 2);
          const a = Math.floor(pillPosition), b = Math.min(2, a + 1), t = pillPosition - a;
          if (labelBoxes.length) {
            const left = lerp(labelBoxes[a].left, labelBoxes[b].left, t);
            pill.style.width = `${lerp(labelBoxes[a].width, labelBoxes[b].width, t)}px`;
            pill.style.transform = `translateX(${left}px)`;
            pillLabels.style.transform = `translateX(${-left}px)`;
          }
          labels.forEach((label, index) => {
            label.dataset.selected = String(index === selectedFormat);
            label.setAttribute("aria-pressed", String(index === selectedFormat));
          });
          if (selectedFormat !== previewIndex) {
            const device = PREVIEW_DEVICES[selectedFormat];
            fallbackImage.src = device.image;
            fallbackImage.style.transform = selectedFormat === 1 ? "scale(1.08)" : "none";
            previewCaption.textContent = device.caption;
            previewDescriptions.forEach((description, index) => { description.textContent = device.description[index]; });
            root.dataset.device = device.label.toLowerCase();
            previewIndex = selectedFormat;
          }
          const copyReveal = deviceCopyReveal(formatPosition);
          [previewCaption, ...previewDescriptions].forEach(el => {
            el.style.opacity = String(copyReveal);
            el.style.transform = `translateY(${(1 - copyReveal) * 6}px)`;
          });

          // SCENE 3: Feature Grid Minimal
          show(next, ext.gridVisible ? ext.gridAlpha : 0);
          next.style.pointerEvents = ext.gridInteractive ? "auto" : "none";
          nextTitle.style.transform = `translateY(${(1 - frame.nextTitle) * layout.height * 0.95}px)`;
          nextContent.style.transform = `translateY(${(1 - frame.nextContent) * layout.height * 0.95}px)`;

          // SCENE 4: Feature Teaser
          show(teaser, ext.teaserVisible ? ext.teaserAlpha : 0);
          teaser.style.pointerEvents = ext.teaserInteractive ? "auto" : "none";
          teaserTitle.style.transform = `translateY(${(1 - ext.teaserTitle) * layout.height * 0.95}px)`;
          teaserContent.style.transform = `translateY(${(1 - ext.teaserContent) * layout.height * 0.95}px)`;

          // SCENE 5: Pricing Section
          show(pricing, ext.pricingVisible ? ext.pricingAlpha : 0);
          pricing.style.pointerEvents = ext.pricingInteractive ? "auto" : "none";
          pricing.style.transform = `translateY(${ext.pricingVisible ? pricingScrollOffset(physicalScrollProgress, scrollDistance) : 0}px)`;
          pricingTitle.style.transform = `translateY(${(1 - ext.pricingTitle) * layout.height * 0.95}px)`;
          pricingContent.style.transform = `translateY(${(1 - ext.pricingContent) * layout.height * 0.95}px)`;

          const fallbackEntranceState = fallbackEntrance(frame);
          show(entranceFallback, fallbackEntranceState.logo);
          root.style.setProperty("--phone-alpha", String(fallbackEntranceState.phone));
          root.dataset.progress = progress.toFixed(4);
          root.dataset.scrollProgress = scrollProgress.toFixed(4);
          root.dataset.format = formatPosition.toFixed(5);
          root.dataset.formatGoal = galleryPosition.toFixed(5);
          root.dataset.gallery = selection.gallery < 0.5 ? "wall" : selection.gallery < 1.5 ? "carousel" : "orbit";
          root.dataset.galleryFocus = selection.focus.toFixed(4);
          dirty = false;
        }
        // Only the handset's small idle motion needs redraws at rest.
        if (visible && (frame.phoneAlpha > 0 || redraw)) engine?.render(frame, galleryPosition, formatPosition, time, landing.amount);
        lastProgress = progress;
        lastScrollProgress = scrollProgress;
      };
      const load = async () => {
        if (requested) return;
        requested = true;
        try {
          const { createDeviceStoryRenderer } = await import("./device-story-renderer");
          if (controller.signal.aborted) return;
          engine = await createDeviceStoryRenderer(canvas, controller.signal);
          if (controller.signal.aborted) { engine.dispose(); return; }
          engine.resize(layout);
          engine.render(sampleStory(progress), galleryPosition, formatPosition, gsap.ticker.time);
          root.dataset.renderer = "ready";
          dirty = true;
        } catch (error) {
          if (!controller.signal.aborted) {
            root.dataset.renderer = "fallback";
            console.warn("Device story uses its image fallback.", error);
          }
        }
      };
      root.dataset.animated = "true";
      root.style.setProperty("--phone-alpha", "0");
      const trigger = ScrollTrigger.create({
        trigger: track, start: "top top", end: "bottom bottom",
        onUpdate: self => {
          physicalScrollProgress = self.progress;
          scrollProgress = extendedStoryProgress(physicalScrollProgress, scrollDistance, deviceScrollDistance);
          const ext = sampleExtendedStory(scrollProgress);
          progress = ext.deviceProgress;
          ratios?.sync(progress);
          dirty = true;
        },
        onRefresh: self => {
          physicalScrollProgress = self.progress;
          scrollDistance = self.end - self.start;
          const removedViewports = Number.parseFloat(getComputedStyle(track).getPropertyValue("--story-scroll-cut")) || 0;
          deviceScrollDistance = 0.52 * (scrollDistance + removedViewports * stage.clientHeight);
          scrollProgress = extendedStoryProgress(physicalScrollProgress, scrollDistance, deviceScrollDistance);
          const ext = sampleExtendedStory(scrollProgress);
          progress = ext.deviceProgress;
          measure();
          ratios?.sync(progress, true);
        },
      });
      physicalScrollProgress = trigger.progress;
      scrollDistance = trigger.end - trigger.start;
      const removedViewports = Number.parseFloat(getComputedStyle(track).getPropertyValue("--story-scroll-cut")) || 0;
      deviceScrollDistance = 0.52 * (scrollDistance + removedViewports * stage.clientHeight);
      scrollProgress = extendedStoryProgress(physicalScrollProgress, scrollDistance, deviceScrollDistance);
      progress = sampleExtendedStory(scrollProgress).deviceProgress;
      // The picker gets extra scroll distance without slowing the preceding phone scenes.
      const positionAt = (p: number) => trigger.start + storyScrollPosition(p) * deviceScrollDistance;
      ratios = attachProgressiveFormatScroll(progress, positionAt, (gallery, format, selected, refresh, velocity) => {
        if (refresh) {
          landingMotion?.kill(); landingMotion = null; landing.amount = 0; landingReturning = false;
        } else if (deviceArrival(galleryPosition, gallery, false)) {
          landingMotion?.kill(); landingMotion = null; landingReturning = false;
          const strength = deviceLandingStrength(velocity);
          if (strength > 0.0001) {
            landingMotion = gsap.timeline({ onUpdate: () => { dirty = true; }, onComplete: () => { landingMotion = null; } })
              .to(landing, { amount: strength, duration: 0.13, ease: "power2.out" })
              .to(landing, { amount: 0, duration: 0.3, ease: "power2.out" });
          } else landing.amount = 0;
        } else if (gallery !== galleryPosition && landingMotion && !landingReturning) {
          landingMotion.kill(); landingReturning = true;
          landingMotion = gsap.to(landing, { amount: 0, duration: 0.14, ease: "power2.out", onUpdate: () => { dirty = true; }, onComplete: () => { landingMotion = null; landingReturning = false; } });
        }
        galleryPosition = gallery; formatPosition = format; selectedFormat = selected; dirty = true;
      });
      selectDevice.current = index => ratios?.select(index);
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) { dirty = true; void load(); }
      }, { rootMargin: "800px" });
      observer.observe(root);
      const resize = new ResizeObserver(measure); resize.observe(stage);
      const visibility = () => { if (!document.hidden) dirty = true; };
      document.addEventListener("visibilitychange", visibility);
      const lost = () => { root.dataset.renderer = "fallback"; engine?.dispose(); engine = null; dirty = true; };
      canvas.addEventListener("webglcontextlost", lost);
      gsap.ticker.add(render);
      void document.fonts.ready.then(() => { if (!controller.signal.aborted) { measure(); ScrollTrigger.refresh(); } });
      render(gsap.ticker.time);
      return () => {
        ratios?.dispose(); landingMotion?.kill(); controller.abort(); engine?.dispose(); trigger.kill(); resize.disconnect(); observer.disconnect(); gsap.ticker.remove(render);
        document.removeEventListener("visibilitychange", visibility); canvas.removeEventListener("webglcontextlost", lost);
        delete root.dataset.animated; delete root.dataset.renderer; delete root.dataset.progress;
        delete root.dataset.format; delete root.dataset.formatGoal; root.style.removeProperty("--phone-alpha");
        delete root.dataset.device;
        delete root.dataset.gallery; delete root.dataset.galleryFocus;
        selectDevice.current = null;
        descriptions.forEach((description, index) => { description.textContent = SCREEN_COPY[0][index]; });
        deviceLetters.forEach(letter => letter.removeAttribute("style"));
        deviceDescription.removeAttribute("style");
        [entranceFallback, deviceCopy, output, heading, lower, next, nextTitle, nextContent, teaser, teaserTitle, teaserContent, pricing, pricingTitle, pricingContent, fallback, pill, pillLabels].forEach(el => el.removeAttribute("style"));
        island.removeAttribute("style");
        notch.removeAttribute("style");
        [previewCaption, ...previewDescriptions].forEach(el => el.removeAttribute("style"));
      };
    });
    mm.add("(prefers-reduced-motion: reduce)", () => {
      const room = root.querySelector<HTMLElement>("[data-preview-room]")!;
      const fallback = root.querySelector<HTMLElement>("[data-preview-fallback]")!;
      const island = root.querySelector<HTMLElement>("[data-preview-island]")!;
      const notch = root.querySelector<HTMLElement>("[data-preview-notch]")!;
      const image = fallback.querySelector("img")!;
      const labels = Array.from(root.querySelectorAll<HTMLElement>("[data-device-option]"));
      const pill = root.querySelector<HTMLElement>("[data-pill]")!;
      const pillLabels = root.querySelector<HTMLElement>("[data-pill-labels]")!;
      let selected: FormatIndex = 0;
      const choose = (index: FormatIndex) => {
        selected = index;
        const bounds = room.getBoundingClientRect();
        const frame = getFormatFrames(bounds.width, bounds.height)[index];
        fallback.style.width = `${frame.width}px`; fallback.style.height = `${frame.height}px`;
        fallback.style.borderWidth = `${frame.bezel}px`; fallback.style.borderRadius = `${frame.radius + frame.bezel}px`;
        image.src = PREVIEW_DEVICES[index].image;
        const islandRetraction = phoneIslandRetraction(index);
        island.style.transform = `translateX(-50%) translateY(${-175.2 * islandRetraction}%) scaleX(${1 - 0.2 * islandRetraction})`;
        const notchGrowth = laptopNotchProgress(index, 1);
        notch.style.transform = `translateX(-50%) scale(${0.65 + 0.35 * notchGrowth}, ${notchGrowth})`;
        image.style.transform = index === 1 ? "scale(1.08)" : "none";
        labels.forEach((label, i) => { label.dataset.selected = String(i === index); label.setAttribute("aria-pressed", String(i === index)); });
        pill.style.width = `${labels[index].offsetWidth}px`; pill.style.transform = `translateX(${labels[index].offsetLeft}px)`;
        pillLabels.style.transform = `translateX(${-labels[index].offsetLeft}px)`;
        root.querySelector<HTMLElement>("[data-preview-caption]")!.textContent = PREVIEW_DEVICES[index].caption;
        root.querySelectorAll<HTMLElement>("[data-preview-description]").forEach((description, i) => { description.textContent = PREVIEW_DEVICES[index].description[i]; });
      };
      selectDevice.current = choose;
      const resize = new ResizeObserver(() => choose(selected)); resize.observe(room);
      choose(0);
      return () => { resize.disconnect(); island.removeAttribute("style"); notch.removeAttribute("style"); selectDevice.current = null; };
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={rootRef} id="device-export-story" className={styles.story} aria-label="Menuin di setiap perangkat">
      <div className={styles.track} data-track>
      <div className={styles.stage} data-stage>
        <canvas className={styles.canvas} data-canvas aria-hidden="true" />
        <div className={styles.entranceLogoFallback} data-entrance-fallback aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/landing/hero/menuin-wordmark.png" alt="Menuin" width={1271} height={258} />
        </div>
        <div className={styles.phoneAnchor} data-phone-anchor aria-hidden="true">
          <div className={styles.phoneFallback}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/landing/features/storefront-menu-story.jpg" alt="" width={590} height={1280} loading="lazy" />
          </div>
        </div>
        <div className={styles.deviceCopy} data-device-copy>
          <h2 className={styles.deviceHeading} aria-label="Storefront Self-order">
            <span className={styles.headingLine} aria-hidden="true">{Array.from("Storefront", (letter, index) => <span key={index} data-device-letter>{letter}</span>)}</span>
            <span className={`${styles.headingLine} ${styles.arrowLine}`} aria-hidden="true"><span className={styles.headingArrow} data-device-letter><ArrowRight /></span>{Array.from("Self-order", (letter, index) => <span key={index} data-device-letter>{letter}</span>)}</span>
          </h2>
          <div className={styles.deviceDescription} data-device-description>
            <p data-screen-description>{SCREEN_COPY[0][0]}</p>
            <p data-screen-description>{SCREEN_COPY[0][1]}</p>
          </div>
        </div>
        <div className={styles.exportScene} data-export>
          <div className={styles.exportWords}>
            <h2 data-export-heading>Satu alur.<br /><span className={styles.arrowLine}><ArrowRight aria-hidden="true" /> Semua layar.</span></h2>
            <div className={styles.exportLower} data-export-lower>
              <div className={styles.deviceSwitch} role="group" aria-label="Pilih ukuran perangkat">
                <span className={styles.pill} data-pill aria-hidden="true"><span className={styles.pillLabels} data-pill-labels>{PREVIEW_DEVICES.map(device => <span key={device.label}>{device.label}</span>)}</span></span>
                {PREVIEW_DEVICES.map((device, index) => <button key={device.label} type="button" data-device-option data-selected={index === 0} aria-pressed={index === 0} onClick={() => selectDevice.current?.(index as FormatIndex)}>{device.label}</button>)}
              </div>
              <p className={styles.formatCaption} data-preview-caption>{PREVIEW_DEVICES[0].caption}</p>
              <div className={styles.exportDescription}>
                <p data-preview-description>{PREVIEW_DEVICES[0].description[0]}</p>
                <p data-preview-description>{PREVIEW_DEVICES[0].description[1]}</p>
              </div>
            </div>
          </div>
          <div className={styles.previewRoom} data-preview-room aria-hidden="true">
            <div className={styles.previewFallback} data-preview-fallback>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PREVIEW_DEVICES[0].image} alt="" width={590} height={1280} loading="lazy" />
              <span className={styles.previewIsland} data-preview-island />
              <span className={styles.previewNotch} data-preview-notch />
            </div>
          </div>
        </div>
        {/* SCENE 3: Feature Grid Minimal */}
        <section className={cn(styles.nextScene, CSS_VARS)} data-next aria-labelledby="devices-heading">
          <div className={styles.nextHeading} data-next-title>
            <FeatureGridHeader />
          </div>
          <div className={styles.nextGrid} data-next-content>
            <FeatureGridCards />
          </div>
        </section>

        {/* SCENE 4: Feature Teaser */}
        <section className={cn(styles.teaserScene, CSS_VARS)} data-teaser aria-labelledby="features-teaser-heading">
          <div className={styles.teaserHeading} data-teaser-title>
            <FeatureTeaserHeader />
          </div>
          <div className={styles.teaserContent} data-teaser-content>
            <FeatureTeaserBody />
          </div>
        </section>

      </div>
      </div>
        {/* SCENE 5: Pricing Section */}
        <section className={cn(styles.pricingScene, CSS_VARS)} data-pricing aria-labelledby="pricing-heading">
          <div className={styles.pricingHeading} data-pricing-title>
            <PricingHeader />
          </div>
          <div className={styles.pricingContent} data-pricing-content>
            <PricingCards />
          </div>
        </section>
    </section>
  );
}
