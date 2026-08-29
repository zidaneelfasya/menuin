"use client";

import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "What is MENUIN and how does it help my restaurant or cafe?",
    answer:
      "MENUIN is an all-in-one cloud POS & QR self-ordering platform designed for modern F&B businesses. It seamlessly connects customer table QR ordering, cashier POS, kitchen display system (KDS), real-time inventory management, and automated sales reporting in one unified dashboard.",
  },
  {
    question: "Do customers need to download an application to order from tables?",
    answer:
      "No. Customers simply scan the table QR code using their smartphone camera to open your branded digital menu directly in their browser. They can select items, customize options, and pay instantly via QRIS or cash without any app downloads or registrations.",
  },
  {
    question: "How does the Kitchen Display System (KDS) and printer work?",
    answer:
      "Orders placed via QR codes or cashier POS are routed instantly in real-time to your kitchen display screen (KDS) or printed automatically via Bluetooth/LAN thermal receipt printers with full table numbers and item notes.",
  },
  {
    question: "Can I manage multiple staff roles and cashier shifts?",
    answer:
      "Yes. You can assign role-based permissions for Cashiers, Waitstaff, Kitchen Chefs, and Managers. The system tracks individual cashier shifts, cash drawer balances, and staff sales logs with full security.",
  },
  {
    question: "Is it suitable for multi-branch or chain restaurant operations?",
    answer:
      "Absolutely. With our multi-outlet management, you can monitor live sales, manage centralized master menus, adjust branch-specific pricing, and transfer inventory across all your outlets from one single owner dashboard.",
  },
  {
    question: "Can I cancel or pause my subscription at any time?",
    answer:
      "Yes. We operate on a flexible monthly renewal model with no fixed-term contracts or hidden cancellation fees. You have full freedom to upgrade, downgrade, or cancel your plan anytime.",
  },
  {
    question: "What payment methods are supported for customer checkout?",
    answer:
      "MENUIN supports automated dynamic QRIS (BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, Dana) with instant payment verification, as well as debit/credit cards and traditional cash payments.",
  },
  {
    question: "How do I get started and is hardware setup included?",
    answer:
      "You can sign up online and start setting up your digital menu in under 5 minutes. If you need assistance, our support team provides free onboarding guidance, thermal printer setup assistance, and staff training.",
  },
];

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
            <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-black tracking-tight text-slate-900 leading-[1.1]">
              Frequently Asked Questions.
            </h2>
            <p className="text-slate-500 text-sm sm:text-[15px] mt-4 leading-relaxed max-w-sm">
              Everything you need to know about MENUIN POS, QR self-ordering, and billing.
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
                    <span className="text-[15px] sm:text-[16.5px] font-bold text-slate-900 group-hover:text-[#0E59F9] transition-colors pr-6 leading-snug">
                      {faq.question}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Subtle Open Badge on Desktop Hover */}
                      <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#0E59F9] opacity-0 group-hover:opacity-100 transition-opacity">
                        {isOpen ? "CLOSE" : "OPEN"}
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
