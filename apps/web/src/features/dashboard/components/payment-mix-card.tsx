'use client';

import * as React from 'react';
import { PaymentMethodStat, ChannelStat } from '@/lib/actions/dashboard';
import { formatCurrency } from '@/lib/utils/format';
import { Wallet, QrCode, CreditCard, Banknote, Store, Smartphone, ArrowRightLeft } from 'lucide-react';

interface PaymentMixCardProps {
  paymentMix: PaymentMethodStat[];
  channelMix?: ChannelStat[];
}

export function PaymentMixCard({ paymentMix, channelMix = [] }: PaymentMixCardProps) {
  const [activeTab, setActiveTab] = React.useState<'channel' | 'payment'>('channel');

  const totalPaymentAmount = paymentMix.reduce((acc, curr) => acc + curr.totalAmount, 0);

  // Extract POS and Storefront stats
  const posStat = channelMix.find((c) => c.channel === 'POS') || {
    channel: 'POS' as const,
    label: 'Kasir Langsung (POS)',
    totalAmount: 0,
    transactionCount: 0,
    percentage: 0,
    aov: 0,
  };

  const storefrontStat = channelMix.find((c) => c.channel === 'STOREFRONT') || {
    channel: 'STOREFRONT' as const,
    label: 'Storefront (Self-Order)',
    totalAmount: 0,
    transactionCount: 0,
    percentage: 0,
    aov: 0,
  };

  const totalChannelSales = posStat.totalAmount + storefrontStat.totalAmount;
  const totalChannelTx = posStat.transactionCount + storefrontStat.transactionCount;
  const storefrontTxShare = totalChannelTx > 0 ? Math.round((storefrontStat.transactionCount / totalChannelTx) * 100) : 0;
  const posTxShare = 100 - storefrontTxShare;

  const getMethodIcon = (method: string) => {
    const m = method.toUpperCase();
    if (m === 'CASH') return <Banknote className="w-3.5 h-3.5 text-blue-600" />;
    if (m === 'QRIS') return <QrCode className="w-3.5 h-3.5 text-indigo-600" />;
    if (m.includes('ONLINE') || m.includes('MIDTRANS')) {
      return <Smartphone className="w-3.5 h-3.5 text-sky-600" />;
    }
    if (m.includes('CARD') || m === 'EDC' || m === 'DEBIT' || m === 'CREDIT') {
      return <CreditCard className="w-3.5 h-3.5 text-purple-600" />;
    }
    return <Wallet className="w-3.5 h-3.5 text-gray-500" />;
  };

  const getMethodColor = (index: number) => {
    const colors = [
      'bg-blue-600',
      'bg-indigo-600',
      'bg-sky-500',
      'bg-purple-500',
      'bg-amber-500',
      'bg-slate-400',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-xs space-y-4">
      {/* Header with Segmented Tab Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
            {activeTab === 'channel' ? (
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
            ) : (
              <Wallet className="w-4 h-4 text-blue-600" />
            )}
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {activeTab === 'channel' ? 'Komparasi Kanal Checkout' : 'Distribusi Metode Bayar'}
            </h2>
            <p className="text-xs text-gray-500">
              {activeTab === 'channel' 
                ? 'Perbandingan checkout Storefront vs Kasir POS' 
                : 'Pemisahan kas fisik vs pembayaran digital (QRIS/EDC/Gateway)'}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-0.5 bg-gray-100 rounded-lg text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('channel')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              activeTab === 'channel'
                ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Kanal Pesanan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payment')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              activeTab === 'payment'
                ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Metode Bayar
          </button>
        </div>
      </div>

      {/* TAB 1: KANAL PESANAN (KASIR POS VS STOREFRONT) */}
      {activeTab === 'channel' && (
        <div className="space-y-4">
          {totalChannelTx === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              Belum ada transaksi pada periode ini.
            </div>
          ) : (
            <>
              {/* Dual Visual Split Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                  <span className="flex items-center gap-1.5 text-blue-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    Kasir Langsung ({posTxShare}%)
                  </span>
                  <span className="flex items-center gap-1.5 text-sky-700 font-semibold">
                    Storefront ({storefrontTxShare}%)
                    <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
                  </span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                  <div
                    className="bg-blue-600 transition-all duration-500"
                    style={{ width: `${Math.max(posTxShare > 0 ? 3 : 0, posTxShare)}%` }}
                    title={`Kasir POS: ${posTxShare}%`}
                  />
                  <div
                    className="bg-sky-500 transition-all duration-500"
                    style={{ width: `${Math.max(storefrontTxShare > 0 ? 3 : 0, storefrontTxShare)}%` }}
                    title={`Storefront: ${storefrontTxShare}%`}
                  />
                </div>
              </div>

              {/* Side-by-Side Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Kasir Langsung (POS) Card */}
                <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                      <Store className="w-3.5 h-3.5 text-blue-600" />
                      <span>Kasir Langsung (POS)</span>
                    </div>
                    <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                      {posStat.percentage}% revenue
                    </span>
                  </div>
                  <div>
                    <div className="text-base font-semibold text-gray-900 tracking-tight">
                      {formatCurrency(posStat.totalAmount)}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center justify-between">
                      <span>{posStat.transactionCount.toLocaleString('id-ID')} orders</span>
                      <span className="font-mono text-[11px]">AOV: {formatCurrency(posStat.aov)}</span>
                    </div>
                  </div>
                </div>

                {/* Storefront (Self-Order) Card */}
                <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                      <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                      <span>Storefront (Self-Order)</span>
                    </div>
                    <span className="text-[11px] font-mono text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                      {storefrontStat.percentage}% revenue
                    </span>
                  </div>
                  <div>
                    <div className="text-base font-semibold text-gray-900 tracking-tight">
                      {formatCurrency(storefrontStat.totalAmount)}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center justify-between">
                      <span>{storefrontStat.transactionCount.toLocaleString('id-ID')} orders</span>
                      <span className="font-mono text-[11px]">AOV: {formatCurrency(storefrontStat.aov)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informative Micro-Note */}
              <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100/70 text-[11px] text-blue-800 flex items-center justify-between">
                <span>Tingkat Adopsi Pesanan Mandiri:</span>
                <span className="font-semibold">{storefrontTxShare}% dari total checkout</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: METODE BAYAR (TENDER INSTRUMENT) */}
      {activeTab === 'payment' && (
        <div className="space-y-4">
          {paymentMix.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              Belum ada transaksi pada periode ini.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stacked Multi-Segment Progress Bar */}
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
                {paymentMix.map((p, idx) => (
                  <div 
                    key={p.method}
                    className={`${getMethodColor(idx)} transition-all duration-500`}
                    style={{ width: `${Math.max(2, p.percentage)}%` }}
                    title={`${p.label}: ${p.percentage}%`}
                  />
                ))}
              </div>

              {/* Detailed Tender Mix Rows */}
              <div className="space-y-2 divide-y divide-gray-100">
                {paymentMix.map((p, idx) => (
                  <div key={p.method} className="flex items-center justify-between pt-2 text-xs first:pt-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1 rounded-md bg-gray-50 border border-gray-100 shrink-0">
                        {getMethodIcon(p.method)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate flex items-center gap-1.5">
                          <span>{p.label}</span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            ({p.transactionCount} orders)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-x-2">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(p.totalAmount)}
                      </span>
                      <span className="inline-block text-[11px] font-mono text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 min-w-[42px] text-center">
                        {p.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
