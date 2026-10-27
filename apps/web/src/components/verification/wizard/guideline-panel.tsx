'use client';

import * as React from 'react';
import { useGuideline } from './guideline-context';
import { GUIDELINES_MAP, type GuidelineItem } from './guidelines';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  CreditCard,
  UserRound,
  Building2,
  Store,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function GuidelinePanel({ className }: { className?: string }) {
  const { activeKey, defaultStepKey } = useGuideline();

  const currentItem: GuidelineItem =
    GUIDELINES_MAP[activeKey] ||
    GUIDELINES_MAP[defaultStepKey] ||
    GUIDELINES_MAP['step-1-default'];

  return (
    <aside
      className={cn(
        'w-[340px] flex-shrink-0 bg-white border-l border-slate-100 shadow-[-4px_0_16px_rgba(0,0,0,0.03)] p-5 overflow-y-auto no-scrollbar',
        className
      )}
    >
      <div className="space-y-4">
        {/* Eyebrow */}
        <div className="pb-2 border-b border-slate-100 font-sans">
          <span className="text-[11px] font-semibold text-slate-500 block font-sans">
            Panduan Pengisian
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-4 font-sans"
          >
            {/* Title & Description */}
            <div>
              <h3 className="text-base font-semibold text-slate-900 font-sans">
                {currentItem.title}
              </h3>
              {currentItem.description && (
                <p className="text-xs text-slate-500 mt-1 leading-relaxed font-sans">
                  {currentItem.description}
                </p>
              )}
            </div>

            {/* Sample Illustration Card (if applicable) */}
            {currentItem.sampleType && currentItem.sampleType !== 'NONE' && (
              <SampleIllustrationCard type={currentItem.sampleType} />
            )}

            {/* Numbered Points Checklist */}
            <div className="space-y-2 pt-1 font-sans">
              <span className="text-[11px] font-semibold text-slate-700 font-sans block">
                Ketentuan &amp; Tips:
              </span>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed font-sans">
                {currentItem.points.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-50 text-[#0e59f9] text-[10px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Note box */}
            {currentItem.note && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border-none shadow-xs text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700 block mb-0.5">Catatan:</span>
                {currentItem.note}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  );
}

function SampleIllustrationCard({
  type,
}: {
  type: 'NIB' | 'NPWP' | 'KTP' | 'BANK' | 'STOREFRONT' | 'CASHIER';
}) {
  return (
    <div className="rounded-2xl border-none shadow-sm-md bg-[#F9FBFF] p-4 relative overflow-hidden select-none">
      {/* Watermark "CONTOH" */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.08] rotate-[-25deg]">
        <span className="text-4xl font-semibold text-slate-900">
          CONTOH RESMI
        </span>
      </div>

      <div className="relative z-10 space-y-2">
        {type === 'NIB' && (
          <div className="bg-white rounded-xl border-none shadow-xs p-3 space-y-2 text-[10px]">
            <div className="border-b border-slate-100 pb-1.5 flex items-center justify-between">
              <span className="font-semibold text-slate-800">REPUBLIK INDONESIA</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                STATUS: TERBIT
              </span>
            </div>
            <div className="space-y-1">
              <div className="h-2 w-3/4 bg-slate-200 rounded-[2px]" />
              <div className="h-2 w-1/2 bg-slate-100 rounded-[2px]" />
            </div>
            <div className="bg-blue-50/60 p-1.5 rounded-[4px] border border-blue-100/60 text-[9px] text-[#0e59f9] font-medium">
              Nomor Induk Berusaha (NIB): 0220108230192
            </div>
            <div className="text-[9px] text-slate-400">
              Lampiran KBLI &amp; Izin Komersial terlampir lengkap
            </div>
          </div>
        )}

        {type === 'NPWP' && (
          <div className="bg-white rounded-[6px] border border-slate-200/80 p-3 shadow-xs space-y-2 text-[10px] font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 font-sans">
              <span className="font-semibold text-slate-800 font-sans">KEMENTERIAN KEUANGAN</span>
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-[9px] font-sans text-slate-700 font-semibold">
              01.234.567.8-012.000
            </p>
            <div className="space-y-0.5 font-sans">
              <p className="text-[9px] font-semibold text-slate-800 font-sans">PT SOLUSI KULINER NUSANTARA</p>
              <p className="text-[8px] text-slate-400 font-sans">NPWP 16 Digit Terintegrasi</p>
            </div>
          </div>
        )}

        {type === 'KTP' && (
          <div className="bg-white rounded-[6px] border border-slate-200/80 p-3 shadow-xs space-y-2 text-[10px] font-sans">
            <div className="border-b border-slate-100 pb-1 flex items-center justify-between font-sans">
              <span className="font-semibold text-slate-800 text-[9px] font-sans">PROVINSI JAWA TIMUR</span>
              <span className="text-[8px] font-semibold text-slate-400 font-sans">KTP ELEKTRONIK</span>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-10 h-12 rounded-[4px] bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                <UserRound className="w-5 h-5 text-slate-300" />
              </div>
              <div className="space-y-1 min-w-0 flex-1 font-sans">
                <p className="text-[9px] font-sans font-semibold text-slate-800">
                  3510 1234 5678 0001
                </p>
                <div className="h-1.5 w-full bg-slate-200 rounded-[2px]" />
                <div className="h-1.5 w-3/4 bg-slate-100 rounded-[2px]" />
              </div>
            </div>
            <div className="text-[8px] text-emerald-700 font-medium flex items-center gap-1 font-sans">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>4 Sudut e-KTP terlihat utuh &amp; tajam</span>
            </div>
          </div>
        )}

        {type === 'BANK' && (
          <div className="bg-white rounded-[6px] border border-slate-200/80 p-3 shadow-xs space-y-2 text-[10px] font-sans">
            <div className="border-b border-slate-100 pb-1 flex items-center justify-between font-sans">
              <span className="font-semibold text-slate-800 text-[9px] font-sans">BUKU REKENING / MUTASI</span>
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="bg-blue-50/60 p-2 rounded-[4px] border border-blue-100/60 space-y-1 font-sans">
              <p className="text-[9px] font-semibold text-[#0e59f9] font-sans">BANK CENTRAL ASIA (BCA)</p>
              <p className="text-[9px] font-sans font-semibold text-slate-800">123-456-7890</p>
              <p className="text-[9px] font-medium text-slate-700 font-sans">A/N PT SOLUSI KULINER</p>
            </div>
            <p className="text-[8px] text-slate-400 font-sans">
              Nomor rekening &amp; nama pemilik tercetak jelas
            </p>
          </div>
        )}

        {type === 'STOREFRONT' && (
          <div className="bg-white rounded-[6px] border border-slate-200/80 p-3 shadow-xs space-y-2 text-[10px] font-sans">
            <div className="aspect-video rounded-[4px] bg-blue-50/50 border border-blue-100/60 flex flex-col items-center justify-center text-center p-2 font-sans">
              <Store className="w-6 h-6 text-[#0e59f9] mb-1" />
              <div className="px-2 py-0.5 rounded-[4px] bg-[#0e59f9] text-white text-[8px] font-semibold font-sans">
                [PLANG NAMA TOKO JELAS]
              </div>
            </div>
            <p className="text-[8px] text-slate-500 text-center font-sans">
              Tampak fasad luar gerai di siang hari dengan plang toko terbaca
            </p>
          </div>
        )}

        {type === 'CASHIER' && (
          <div className="bg-white rounded-[6px] border border-slate-200/80 p-3 shadow-xs space-y-2 text-[10px]">
            <div className="aspect-video rounded-[4px] bg-blue-50/50 border border-blue-100/60 flex flex-col items-center justify-center text-center p-2">
              <MapPin className="w-6 h-6 text-[#0e59f9] mb-1" />
              <div className="px-2 py-0.5 rounded-[4px] bg-slate-900 text-white text-[8px] font-semibold">
                [MEJA KASIR &amp; TABLET POS]
              </div>
            </div>
            <p className="text-[8px] text-slate-500 text-center">
              Area meja kasir tempat pembayaran pelanggan berlangsung
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
