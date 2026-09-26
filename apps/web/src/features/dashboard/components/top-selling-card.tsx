'use client';

import * as React from 'react';
import { TopSellingProduct } from '@/lib/actions/dashboard';
import { formatCurrency } from '@/lib/utils/format';
import { UtensilsCrossed, Award } from 'lucide-react';

interface TopSellingCardProps {
  products: TopSellingProduct[];
}

export function TopSellingCard({ products }: TopSellingCardProps) {
  return (
    <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-xs space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
            <UtensilsCrossed className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Top Products
            </h2>
            <p className="text-xs text-gray-500">
              Menu terlaris berdasarkan revenue & volume
            </p>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3.5 flex-1 pt-1">
        {products.map((item, index) => {
          const isTop1 = index === 0;

          return (
            <div key={item.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-semibold shrink-0 ${
                    isTop1 
                      ? 'bg-amber-100 text-amber-800' 
                      : index === 1 
                      ? 'bg-gray-100 text-gray-700' 
                      : index === 2 
                      ? 'bg-amber-50 text-amber-700' 
                      : 'bg-gray-50 text-gray-500'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900 truncate">
                    {item.name}
                  </span>
                  {isTop1 && (
                    <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(item.totalRevenue)}
                  </span>
                  <span className="text-gray-400 ml-1.5">
                    ({item.totalSold} terjual)
                  </span>
                </div>
              </div>

              {/* Share bar */}
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isTop1 ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                  style={{ width: `${Math.max(5, Math.min(100, item.sharePercentage))}%` }}
                />
              </div>
            </div>
          );
        })}

        {products.length === 0 && (
          <div className="h-40 flex flex-col items-center justify-center text-xs text-gray-400 space-y-1">
            <p>Belum ada penjualan menu pada periode ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}
