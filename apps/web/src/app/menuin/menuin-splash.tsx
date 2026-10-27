"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface MenuinSplashProps {
  variant?: "putih" | "biru";
}

export function MenuinSplash({ variant = "putih" }: MenuinSplashProps) {
  const [animationKey, setAnimationKey] = useState(0);
  const router = useRouter();

  const isBiru = variant === "biru";
  const bgColor = isBiru ? "bg-[#0b57fa]" : "bg-white";
  const logoSrc = isBiru ? "/menuin-white.png" : "/menuin.png";
  const dimmedOpacity = isBiru ? "opacity-25" : "opacity-20";

  // Keyboard shortcut listener:
  // Space/Enter: replay animation
  // P: go to /menuin-putih
  // B: go to /menuin-biru
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setAnimationKey((prev) => prev + 1);
      } else if (e.key.toLowerCase() === "p") {
        router.push("/menuin-putih");
      } else if (e.key.toLowerCase() === "b") {
        router.push("/menuin-biru");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <main
      onClick={() => setAnimationKey((prev) => prev + 1)}
      className={`fixed inset-0 z-50 flex items-center justify-center ${bgColor} select-none overflow-hidden cursor-pointer transition-colors duration-300`}
    >
      {/* The Logo Container - Pure Logo Only */}
      <div className="relative w-56 h-28 md:w-80 md:h-40 flex items-center justify-center">
        {/* Dimmed Background Logo */}
        <Image
          src={logoSrc}
          alt="Menuin"
          fill
          sizes="(max-width: 768px) 224px, 320px"
          className={`object-contain ${dimmedOpacity} pointer-events-none`}
          priority
        />

        {/* Liquid Fill Animated Logo */}
        <motion.div
          key={animationKey}
          initial={{ clipPath: "inset(100% 0 0 0)" }}
          animate={{ clipPath: "inset(0% 0 0 0)" }}
          transition={{
            duration: 0.7,
            ease: [0.45, 0, 0.15, 1],
            delay: 0.08,
          }}
          className="absolute inset-0 pointer-events-none"
        >
          <Image
            src={logoSrc}
            alt="Menuin Full"
            fill
            sizes="(max-width: 768px) 224px, 320px"
            className="object-contain"
            priority
          />
        </motion.div>
      </div>
    </main>
  );
}
