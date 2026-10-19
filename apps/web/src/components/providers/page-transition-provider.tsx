'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface PageTransitionContextType {
  navigateWithTransition: (href: string) => void;
  isTransitioning: boolean;
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined);

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetHref, setTargetHref] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const navigationStartTimeRef = React.useRef<number>(0);

  // Handle route change completion:
  // ONLY drop the curtain AFTER the new route has actually mounted in the DOM
  // AND the elegant liquid animation has finished its full duration.
  useEffect(() => {
    if (isTransitioning && targetHref) {
      const normalizedTarget = targetHref.split('?')[0].split('#')[0];
      const normalizedPath = pathname.split('?')[0].split('#')[0];

      // If we've reached the target pathname, the destination page is mounted!
      if (normalizedPath === normalizedTarget || (normalizedTarget !== '/' && normalizedPath.startsWith(normalizedTarget))) {
        const elapsed = Date.now() - navigationStartTimeRef.current;
        const MIN_ANIMATION_MS = 750; // Elegant Menuin logo liquid fill duration
        const delay = Math.max(0, MIN_ANIMATION_MS - elapsed) + 100;

        const timer = setTimeout(() => {
          setIsTransitioning(false);
          setTargetHref(null);
        }, delay);
        return () => clearTimeout(timer);
      }
    }
  }, [pathname, isTransitioning, targetHref]);

  // Safety fallback so transition never freezes permanently in case of total network disconnect
  useEffect(() => {
    if (isTransitioning) {
      const safetyTimer = setTimeout(() => {
        setIsTransitioning(false);
        setTargetHref(null);
      }, 8000);
      return () => clearTimeout(safetyTimer);
    }
  }, [isTransitioning]);

  const navigateWithTransition = (href: string) => {
    if (pathname === href) {
      return;
    }
    
    navigationStartTimeRef.current = Date.now();
    setTargetHref(href);
    setIsTransitioning(true);
    // Trigger router.push immediately in parallel so new route mounts under the curtain
    router.push(href);
  };

  return (
    <PageTransitionContext.Provider value={{ navigateWithTransition, isTransitioning }}>
      {children}
      
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-primary" 
          >
            {/* The Logo Container */}
            <div className="relative w-48 h-48 md:w-64 md:h-64">
              {/* Dimmed Background Logo */}
              <Image 
                src="/menuin-putih.png" 
                alt="Loading..." 
                fill 
                sizes="(max-width: 768px) 192px, 256px"
                className="object-contain opacity-25" 
                priority
              />
              
              {/* Liquid Fill Animated Logo */}
              <motion.div
                initial={{ clipPath: "inset(100% 0 0 0)" }}
                animate={{ clipPath: "inset(0% 0 0 0)" }}
                transition={{ 
                  duration: 0.65, 
                  ease: [0.45, 0, 0.15, 1],
                  delay: 0.08
                }}
                className="absolute inset-0"
              >
                <Image 
                  src="/menuin-putih.png" 
                  alt="Loading Full..." 
                  fill 
                  sizes="(max-width: 768px) 192px, 256px"
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
