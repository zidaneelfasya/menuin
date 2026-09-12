'use client';

import * as React from 'react';
import { AttentionItem } from '@/lib/actions/dashboard';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Package, 
  Smartphone, 
  Clock 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AttentionNeededCardProps {
  items: AttentionItem[];
}

export function AttentionNeededCard({ items }: AttentionNeededCardProps) {
  const getIcon = (type: AttentionItem['type']) => {
    switch (type) {
      case 'stock':
        return <Package className="w-4 h-4 text-amber-600" />;
      case 'shift':
        return <Clock className="w-4 h-4 text-rose-600" />;
      case 'device':
        return <Smartphone className="w-4 h-4 text-orange-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm space-y-4" id="attention-section">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Perlu Perhatian
            </h2>
            <p className="text-xs text-gray-500">
              Masalah operasional yang memerlukan tindakan Anda
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
            {items.length} Isu
          </span>
        )}
      </div>

      {/* Issues List */}
      <div className="space-y-2.5 pt-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-amber-100 bg-amber-50/40 hover:bg-amber-50/70 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-white rounded-md border border-amber-200/60 shadow-xs shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-semibold text-gray-900">
                  {item.title}
                </p>
                <p className="text-xs text-gray-600">
                  {item.description}
                </p>
              </div>
            </div>

            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-8 text-xs font-medium border-gray-300 bg-white hover:bg-gray-50 text-gray-800 shrink-0 self-start sm:self-center"
            >
              <Link href={item.actionHref}>
                {item.actionLabel}
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        ))}

        {/* Reassuring Empty State */}
        {items.length === 0 && (
          <div className="p-6 rounded-lg border border-emerald-100 bg-emerald-50/30 flex flex-col items-center justify-center text-center space-y-1.5">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <p className="text-sm font-semibold text-emerald-950">
              Kondisi Operasional Normal
            </p>
            <p className="text-xs text-emerald-700 max-w-sm">
              Semua perangkat aktif, stok inventaris aman, dan shift kasir berjalan lancar tanpa kendala.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
