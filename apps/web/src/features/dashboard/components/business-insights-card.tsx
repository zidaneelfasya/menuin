'use client';

import * as React from 'react';
import { BusinessInsight } from '@/lib/actions/dashboard';
import { 
  LineChart, 
  TrendingUp, 
  Award, 
  ShoppingBag, 
  Clock, 
  Percent
} from 'lucide-react';

interface BusinessInsightsCardProps {
  insights: BusinessInsight[];
}

export function BusinessInsightsCard({ insights }: BusinessInsightsCardProps) {
  const getIcon = (type: BusinessInsight['type']) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'champion':
        return <Award className="w-4 h-4 text-amber-600" />;
      case 'basket':
        return <ShoppingBag className="w-4 h-4 text-gray-700" />;
      case 'peak':
        return <Clock className="w-4 h-4 text-sky-600" />;
      case 'profit':
        return <Percent className="w-4 h-4 text-blue-600" />;
      default:
        return <LineChart className="w-4 h-4 text-gray-700" />;
    }
  };

  const getBadgeBg = (type: BusinessInsight['type']) => {
    switch (type) {
      case 'trend':
        return 'bg-blue-50 border-blue-100/80';
      case 'champion':
        return 'bg-amber-50 border-amber-100/80';
      case 'basket':
        return 'bg-gray-50 border-gray-200/60';
      case 'peak':
        return 'bg-sky-50 border-sky-100/80';
      case 'profit':
        return 'bg-blue-50 border-blue-100/80';
      default:
        return 'bg-gray-50 border-gray-200/60';
    }
  };

  return (
    <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
          <LineChart className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Diagnostik & Wawasan Finansial
          </h2>
          <p className="text-xs text-gray-500">
            Evaluasi kesehatan COGS, promo, jam sibuk, dan adopsi kanal
          </p>
        </div>
      </div>

      {/* Insights List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {insights.map((item) => (
          <div 
            key={item.id}
            className="flex items-start gap-3 p-3.5 rounded-lg border border-gray-100 bg-gray-50/40 hover:bg-gray-50/80 transition-colors"
          >
            <div className={`p-1.5 rounded-md border shrink-0 mt-0.5 ${getBadgeBg(item.type)}`}>
              {getIcon(item.type)}
            </div>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-normal">
              {item.text}
            </p>
          </div>
        ))}

        {insights.length === 0 && (
          <div className="col-span-2 text-center py-6 text-xs text-gray-400">
            Belum ada cukup data transaksi untuk menghasilkan diagnostik bisnis.
          </div>
        )}
      </div>
    </div>
  );
}
