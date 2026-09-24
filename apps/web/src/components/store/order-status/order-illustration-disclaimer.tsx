"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface OrderIllustrationDisclaimerProps {
  className?: string;
}

export function OrderIllustrationDisclaimer({ className = "" }: OrderIllustrationDisclaimerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className={`inline-flex items-center justify-center p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--outlet-primary,#2563eb)]/30 ${className}`}
          aria-label="Informasi nomor pesanan pada ilustrasi"
        >
          <Info className="w-3.5 h-3.5 stroke-[2.2]" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        sideOffset={6}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="z-50 w-64 p-3 bg-white/95 backdrop-blur-xs border border-gray-200/90 shadow-lg rounded-xl text-left"
      >
        <div className="flex items-start gap-2.5">
          <div className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-3 h-3 stroke-[2.5]" />
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Nomor pesanan pada ilustrasi hanya contoh dan tidak menunjukkan nomor pesanan Anda.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
