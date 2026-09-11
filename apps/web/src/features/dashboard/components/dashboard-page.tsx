'use client';

import * as React from 'react';
import { DashboardResponse } from '@/lib/actions/dashboard';
import { OutletHero } from './outlet-hero';
import { PeriodFilterBar } from './period-filter-bar';
import { KpiCards } from './kpi-cards';
import { SalesChartCard } from './sales-chart-card';
import { TopSellingCard } from './top-selling-card';
import { BusinessInsightsCard } from './business-insights-card';
import { OperationalPulseCard } from './operational-pulse-card';
import { AttentionNeededCard } from './attention-needed-card';
import { AnnualRecapTable } from './annual-recap-table';

interface DashboardPageProps {
  data: DashboardResponse;
  outletKey: string;
}

export function DashboardPage({ data, outletKey }: DashboardPageProps) {
  const scrollToAttention = () => {
    const el = document.getElementById('attention-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const currentYear = data.tab === 'tahunan' 
    ? (data.chartData.length > 0 ? parseInt(data.chartData[0].date.split('-')[0]) : new Date().getFullYear())
    : new Date().getFullYear();

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* 1. Hero / Outlet Overview */}
      <OutletHero 
        outlet={data.outlet} 
        onScrollToAttention={scrollToAttention}
      />

      {/* 2. Analytics Period Filter Bar */}
      <PeriodFilterBar 
        currentTab={data.tab}
        periodLabel={data.periodLabel}
        totalTransactions={data.metrics.totalTransactions}
      />

      {/* 3. Primary KPI Cards */}
      <KpiCards 
        metrics={data.metrics} 
        periodType={data.tab}
      />

      {/* 4. Sales Chart & Top Selling Menu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChartCard 
            data={data.chartData}
            tab={data.tab}
            periodLabel={data.periodLabel}
          />
        </div>

        <div className="lg:col-span-1">
          <TopSellingCard 
            products={data.topProducts}
          />
        </div>
      </div>

      {/* 5. Ringkasan Bisnis (Data-Driven Smart Insights) */}
      <BusinessInsightsCard 
        insights={data.insights}
      />

      {/* 6. Special Tahunan Section: Annual Recap Monthly Breakdown */}
      {data.tab === 'tahunan' && data.annualBreakdown && (
        <AnnualRecapTable 
          recap={data.annualBreakdown}
          bestMonthName={data.bestMonthName}
          year={currentYear}
        />
      )}

      {/* 7. Operational Pulse & Attention Needed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OperationalPulseCard 
          pulse={data.operationalPulse}
          outletKey={outletKey}
        />

        <AttentionNeededCard 
          items={data.attentionItems}
        />
      </div>
    </div>
  );
}
