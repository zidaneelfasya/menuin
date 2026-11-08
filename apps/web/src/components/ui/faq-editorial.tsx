"use client";

import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";

import { faqData } from "@/components/landing/faq-data";

export default function FaqEditorial() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full bg-white text-slate-900 pt-24 md:pt-36 pb-36 md:pb-52 px-6 sm:px-10 lg:px-14 border-t border-slate-200" id="faq">
      <div className="mx-auto max-w-[1360px]">
        
        {/* Main 2-Column Split Layout matching the exact reference */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Clean White & Black Editorial Heading with Blue Accent */}
          <div className="lg:col-span-4 pr-0 lg:pr-6">
            <h2 className="text-[clamp(30px,4.2vw,48px)] font-semibold tracking-[-0.04em] text-[#0a0a0a] leading-[1.05]">
              Tanya jawab.
            </h2>
            <p className="text-slate-500 text-sm sm:text-[15px] mt-4 leading-relaxed max-w-sm">
              Hal-hal yang paling sering ditanyakan pemilik usaha sebelum mulai memakai Menuin.
            </p>
          </div>

          {/* Right Column: Clean Accordion Rows with Full-Width Dividers in Pure White, Black & Blue */}
          <div className="lg:col-span-8 border-t border-slate-200">
            {faqData.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="border-b border-slate-200 transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full py-4 sm:py-5 flex items-center justify-between text-left group cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="text-[15px] sm:text-[16.5px] font-medium tracking-[-0.01em] text-[#0a0a0a] group-hover:text-[#0E59F9] transition-colors pr-6 leading-snug">
                      {faq.question}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Subtle Open Badge on Desktop Hover */}
                      <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 group-hover:text-[#0E59F9] opacity-0 group-hover:opacity-100 transition-opacity">
                        {isOpen ? "TUTUP" : "BUKA"}
                      </span>
                      
                      {/* Minimalist Plus / Minus Indicator */}
                      <span className="w-6 h-6 flex items-center justify-center text-slate-900 group-hover:text-[#0E59F9] transition-all">
                        {isOpen ? (
                          <Minus className="w-4 h-4 text-[#0E59F9] transition-transform duration-200" />
                        ) : (
                          <Plus className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
                        )}
                      </span>
                    </div>
                  </button>

                  {/* Smooth Animated Answer Body */}
                  {isOpen && (
                    <div className="pb-5 sm:pb-6 pt-1 text-slate-600 text-sm sm:text-[14.5px] leading-relaxed max-w-2xl pr-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
