'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface PageTransitionContextType {
  navigateWithTransition: (href: string) => void;
  prefetchRoute: (href: string) => void;
  isTransitioning: boolean;
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined);

// Symmetrical transition timing for curtain entrance (masuk) and exit (keluar)
// 380ms provides a crisp, purposeful sweep without sluggishness
const CURTAIN_TRANSITION = {
  duration: 0.38,
  ease: [0.4, 0, 0.2, 1] as const,
};

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isCurtainCovered, setIsCurtainCovered] = useState(false);
  const [targetHref, setTargetHref] = useState<string | null>(null);
  const [isAnimationFinished, setIsAnimationFinished] = useState(false);
  const [isRouteReady, setIsRouteReady] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  const pathname = usePathname();
  const router = useRouter();

  // Trigger logo fill animation ONLY after the curtain has fully covered the screen (380ms)
  useEffect(() => {
    if (isTransitioning) {
      const curtainTimer = setTimeout(() => {
        setIsCurtainCovered(true);
      }, 380);
      return () => clearTimeout(curtainTimer);
    } else {
      setIsCurtainCovered(false);
    }
  }, [isTransitioning]);

  // Gate 2: Listen for target route mounting in DOM
  useEffect(() => {
    if (isTransitioning && targetHref) {
      const normalizedTarget = targetHref.split('?')[0].split('#')[0].replace(/\/$/, '');
      const normalizedPath = pathname.split('?')[0].split('#')[0].replace(/\/$/, '');

      if (normalizedPath === normalizedTarget) {
        setIsRouteReady(true);
      }
    }
  }, [pathname, isTransitioning, targetHref]);

  // Dual-Gate Completion: Only lift curtain when BOTH animation has completed AND route is mounted
  useEffect(() => {
    if (isTransitioning && isAnimationFinished && isRouteReady) {
      // Settle beat (100ms) so user perceives the solid white filled logo before curtain exits
      const settleTimer = setTimeout(() => {
        setIsTransitioning(false);
        setIsCurtainCovered(false);
        setTargetHref(null);
        setIsAnimationFinished(false);
        setIsRouteReady(false);
      }, 100);

      return () => clearTimeout(settleTimer);
    }
  }, [isTransitioning, isAnimationFinished, isRouteReady]);

  // Backup animation timer: Guarantees Gate 1 completes even if browser throttles animation frames in background
  useEffect(() => {
    if (isTransitioning && !isAnimationFinished) {
      const backupTimer = setTimeout(() => {
        setIsAnimationFinished(true);
      }, 1400);
      return () => clearTimeout(backupTimer);
    }
  }, [isTransitioning, isAnimationFinished]);

  // Safety fallback: Never trap user in case of severe network disconnect
  useEffect(() => {
    if (isTransitioning) {
      const safetyTimer = setTimeout(() => {
        setIsTransitioning(false);
        setIsCurtainCovered(false);
        setTargetHref(null);
        setIsAnimationFinished(false);
        setIsRouteReady(false);
      }, 4000);
      return () => clearTimeout(safetyTimer);
    }
  }, [isTransitioning]);

  const prefetchRoute = useCallback((href: string) => {
    try {
      router.prefetch(href);
    } catch {
      // Ignore prefetch errors
    }
  }, [router]);

  const navigateWithTransition = useCallback((href: string) => {
    const normalizedTarget = href.split('?')[0].split('#')[0].replace(/\/$/, '');
    const normalizedCurrent = pathname.split('?')[0].split('#')[0].replace(/\/$/, '');

    // Ignore click if already on identical page
    if (normalizedCurrent === normalizedTarget && href === pathname) {
      return;
    }

    // Ignore redundant click if already transitioning to identical target
    if (isTransitioning && targetHref === href) {
      return;
    }

    // Reset all transition and animation states
    setIsCurtainCovered(false);
    setIsAnimationFinished(false);
    setIsRouteReady(false);
    setAnimationKey((prev) => prev + 1);
    setTargetHref(href);
    setIsTransitioning(true);

    // Parallel Background Routing: Trigger navigation immediately so server fetch runs concurrently
    router.push(href);
  }, [pathname, isTransitioning, targetHref, router]);

  return (
    <PageTransitionContext.Provider value={{ navigateWithTransition, prefetchRoute, isTransitioning }}>
      {children}
      
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            key="page-transition-curtain"
            initial={{ y: "100%" }}
            animate={{ 
              y: "0%", 
              transition: CURTAIN_TRANSITION 
            }}
            exit={{ 
              y: "-100%", 
              transition: CURTAIN_TRANSITION 
            }}
            onAnimationComplete={(definition: any) => {
              if (definition?.y === "0%") {
                setIsCurtainCovered(true);
              }
            }}
            style={{ willChange: "transform" }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b57fa] select-none overflow-hidden" 
          >
            {/* The Logo Container - matching exact /menuin-biru visual presentation */}
            <div className="relative w-56 h-28 md:w-80 md:h-40 flex items-center justify-center">
              {/* Dimmed Background Logo ("Logo Kosong" Base Outline) */}
              <Image 
                src="/menuin-white.png" 
                alt="Menuin" 
                fill 
                sizes="(max-width: 768px) 224px, 320px"
                className="object-contain opacity-25 pointer-events-none" 
                priority
              />
              
              {/* Liquid Fill Animated Foreground ("Terisi Penuh Warna Putih") */}
              {/* Starts rising ONLY when the curtain has completely covered the screen */}
              <motion.div
                key={animationKey}
                initial={{ clipPath: "inset(100% 0 0 0)" }}
                animate={{ 
                  clipPath: isCurtainCovered ? "inset(0% 0 0 0)" : "inset(100% 0 0 0)" 
                }}
                exit={{ clipPath: "inset(0% 0 0 0)" }}
                transition={{ 
                  duration: 0.65, 
                  ease: [0.45, 0, 0.15, 1],
                  delay: isCurtainCovered ? 0.05 : 0
                }}
                onAnimationComplete={() => {
                  if (isCurtainCovered) {
                    setIsAnimationFinished(true);
                  }
                }}
                className="absolute inset-0 pointer-events-none"
              >
                <Image 
                  src="/menuin-white.png" 
                  alt="Menuin Full" 
                  fill 
                  sizes="(max-width: 768px) 224px, 320px"
                  className="object-contain" 
                  priority
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransitionContext.Provider>
  );
}

export function usePageTransition() {
  const context = useContext(PageTransitionContext);
  if (context === undefined) {
    throw new Error("usePageTransition must be used within a PageTransitionProvider");
  }
  return context;
}
