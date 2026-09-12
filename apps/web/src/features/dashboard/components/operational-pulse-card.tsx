'use client';

import * as React from 'react';
import { OperationalPulse } from '@/lib/actions/dashboard';
import { formatCurrency } from '@/lib/utils/format';
import { 
  Activity, 
  Clock, 
  Smartphone, 
  Package, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  Store
} from 'lucide-react';
import Link from 'next/link';

interface OperationalPulseCardProps {
  pulse: OperationalPulse;
  outletKey: string;
}

export function OperationalPulseCard({ pulse, outletKey }: OperationalPulseCardProps) {
  return (
    <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gray-100 text-gray-700 rounded-lg">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Performa Operasional
            </h2>
            <p className="text-xs text-gray-500">
              Kondisi harian kasir, perangkat, dan stok outlet
            </p>
          </div>
        </div>
      </div>

      {/* Grid of 3 Operational Sections */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* 1. Shift Kasir */}
        <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/50 space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Shift Kasir
              </span>
              <Clock className="w-3.5 h-3.5 text-gray-400" />
            </div>

            {pulse.activeShift ? (
              <div className="space-y-0.5 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-gray-900">
                    Aktif ({pulse.activeShift.cashierName})
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Buka: {pulse.activeShift.startedAt}
                </p>
                <p className="text-[11px] text-gray-500">
                  Modal Kas: {formatCurrency(pulse.activeShift.startingCash)}
                </p>
              </div>
            ) : (
              <div className="pt-1">
                <p className="text-xs text-gray-500">Tidak ada shift aktif</p>
                <p className="text-[11px] text-gray-400">Kasir belum membuka shift</p>
              </div>
            )}
          </div>

          <Link 
            href={`/outlet/${outletKey}/shifts`}
            className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700 pt-1"
          >
            Kelola Shift <ChevronRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>

        {/* 2. Perangkat POS */}
        <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/50 space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Perangkat POS
              </span>
              <Smartphone className="w-3.5 h-3.5 text-gray-400" />
            </div>

            <div className="space-y-0.5 pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-900">
                  {pulse.devices.active} / {pulse.devices.total}
                </span>
                <span className="text-xs text-gray-500">Online</span>
              </div>
              {pulse.devices.offline > 0 ? (
                <p className="text-[11px] text-amber-600 font-medium">
                  {pulse.devices.offline} perangkat offline
                </p>
              ) : (
                <p className="text-[11px] text-emerald-600">
                  Semua perangkat tersinkronisasi
                </p>
              )}
            </div>
          </div>

          <Link 
            href={`/outlet/${outletKey}/settings/devices`}
            className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700 pt-1"
          >
            Daftar Perangkat <ChevronRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>

        {/* 3. Kesehatan Stok */}
        <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/50 space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Kesehatan Stok
              </span>
              <Package className="w-3.5 h-3.5 text-gray-400" />
            </div>

            <div className="space-y-0.5 pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-900">
                  {pulse.stockHealth.total} Produk
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                {pulse.stockHealth.safe} aman •{' '}
                <span className={pulse.stockHealth.low > 0 ? 'text-amber-600 font-medium' : ''}>
                  {pulse.stockHealth.low} menipis
                </span>
                {pulse.stockHealth.outOfStock > 0 && (
                  <span className="text-rose-600 font-medium"> • {pulse.stockHealth.outOfStock} habis</span>
                )}
              </p>
            </div>
          </div>

          <Link 
            href={`/outlet/${outletKey}/inventory`}
            className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700 pt-1"
          >
            Kelola Stok <ChevronRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
