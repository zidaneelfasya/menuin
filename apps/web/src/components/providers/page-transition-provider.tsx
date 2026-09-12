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

  // Handle route change completion
  useEffect(() => {
    if (isTransitioning && targetHref) {
      // If we've reached the target pathname, end the transition
      if (pathname === targetHref || pathname.startsWith(targetHref)) {
        // Small delay to ensure render is complete
        const timer = setTimeout(() => {
          setIsTransitioning(false);
          setTargetHref(null);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [pathname, isTransitioning, targetHref]);

  const navigateWithTransition = (href: string) => {
    if (pathname === href) {
      // User requested: dibiarkan saja (ignore if same page)
      return;
    }
    
    setTargetHref(href);
    setIsTransitioning(true);
  };

  const handleFillComplete = () => {
    if (targetHref) {
      router.push(targetHref);
    }
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
            // Using primary color which corresponds to the brand's blue
            className="fixed inset-0 z-[100] flex items-center justify-center bg-primary" 
          >
            {/* The Logo Container */}
            <div className="relative w-48 h-48 md:w-64 md:h-64">
              {/* Dimmed Background Logo */}
              <Image 
                src="/menuin-putih.png" 
                alt="Loading..." 
                fill 
                className="object-contain opacity-20" 
                priority
              />
              
              {/* Liquid Fill Animated Logo */}
              <motion.div
                initial={{ clipPath: "inset(100% 0 0 0)" }}
                animate={{ clipPath: "inset(0% 0 0 0)" }}
                transition={{ 
                  duration: 0.8, 
                  ease: [0.45, 0, 0.15, 1],
                  delay: 0.2 // Wait for the overlay to slide up first
                }}
                onAnimationComplete={handleFillComplete}
                className="absolute inset-0"
              >
                <Image 
                  src="/menuin-putih.png" 
                  alt="Loading Full..." 
                  fill 
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
