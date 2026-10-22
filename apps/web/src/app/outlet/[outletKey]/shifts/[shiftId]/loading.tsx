import * as React from 'react';
import { Loader2 } from 'lucide-react';

export default function ShiftDetailLoading() {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Bar Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-9 w-36 bg-slate-200/70 rounded-xl animate-pulse" />
        <div className="h-9 w-28 bg-slate-200/70 rounded-xl animate-pulse" />
      </div>

      {/* Main Banner Loader */}
      <div className="bg-white rounded-2xl border border-[#EAEFF8] p-8 shadow-xs flex flex-col items-center justify-center text-center min-h-[200px] gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0e59f9] flex items-center justify-center shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin text-[#0e59f9]" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900 tracking-tight">
            Mengambil data rekap shift...
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Mohon tunggu sebentar, sedang memuat metrik penjualan, rincian pembayaran, dan kas laci.
          </p>
        </div>
      </div>

      {/* 3 Metric Cards Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-52 bg-white rounded-2xl border border-[#EAEFF8] p-5 shadow-xs flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#EAEFF8]">
                <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-2.5 w-16 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3.5 w-24 bg-slate-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-2 py-1">
                <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-4/5 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-3/4 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
            <div className="pt-3 border-t border-[#EAEFF8] flex justify-between">
              <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
              <div className="h-3.5 w-16 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-[#EAEFF8] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-4 border-b border-[#EAEFF8] pb-3">
          <div className="h-5 w-28 bg-slate-200 rounded-md animate-pulse" />
          <div className="h-5 w-24 bg-slate-100 rounded-md animate-pulse" />
          <div className="h-5 w-24 bg-slate-100 rounded-md animate-pulse" />
        </div>
        <div className="space-y-2.5 pt-2">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="h-10 w-full bg-slate-50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
