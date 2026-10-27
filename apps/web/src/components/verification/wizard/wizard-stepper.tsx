'use client';

import * as React from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepStatus = 'approved' | 'changes_requested' | 'complete' | 'incomplete';

export interface WizardStepItem {
  number: number;
  title: string;
  subtitle: string;
}

export const WIZARD_STEPS: WizardStepItem[] = [
  { number: 1, title: 'Profil Usaha', subtitle: 'Legalitas badan usaha' },
  { number: 2, title: 'Perwakilan Bisnis', subtitle: 'Identitas penanggung jawab' },
  { number: 3, title: 'Rekening Settlement', subtitle: 'Pencairan hasil transaksi' },
  { number: 4, title: 'Lokasi Gerai', subtitle: 'Alamat & foto fisik outlet' },
  { number: 5, title: 'Review Data', subtitle: 'Konfirmasi pengajuan' },
];

interface WizardStepperProps {
  currentStep: number;
  onStepClick: (stepNumber: number) => void;
  completedSteps?: number[];
  stepStatuses?: Record<number, StepStatus>;
  firstIncompleteStep?: number;
  disabled?: boolean;
  className?: string;
}

export function WizardStepper({
  currentStep,
  onStepClick,
  completedSteps = [],
  stepStatuses,
  firstIncompleteStep = 1,
  disabled = false,
  className,
}: WizardStepperProps) {
  const finishedCount = WIZARD_STEPS.filter((s) => {
    const st = stepStatuses?.[s.number] || (completedSteps.includes(s.number) ? 'complete' : 'incomplete');
    return st === 'complete' || st === 'approved';
  }).length;

  const hasAnyChangesRequested = WIZARD_STEPS.some((s) => {
    return stepStatuses?.[s.number] === 'changes_requested';
  });

  return (
    <aside
      className={cn(
        'w-72 flex-shrink-0 bg-white border-r border-slate-100 shadow-[4px_0_16px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between select-none',
        className
      )}
    >
      <div className="space-y-5">
        {/* Header Row (Mirrors Progress Card from Halaman Verifikasi) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">
               Tahapan Verifikasi
            </span>
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight mt-0.5">
              Progres Verifikasi Bisnis
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-[#0e59f9] bg-blue-50 px-2.5 py-1 rounded-full whitespace-nowrap">
            {finishedCount} dari 5 selesai
          </span>
        </div>

        {/* Vertical Stepper Timeline */}
        <nav className="space-y-1">
          {WIZARD_STEPS.map((step, idx) => {
            const isCurrent = currentStep === step.number;
            const status: StepStatus =
              stepStatuses?.[step.number] ||
              (completedSteps.includes(step.number) ? 'complete' : 'incomplete');
            const isLast = idx === WIZARD_STEPS.length - 1;

            // Progressive line heights
            const stepLineHeights = ['h-7', 'h-11', 'h-16', 'h-20'];
            const lineHeightClass = stepLineHeights[idx] || 'h-8';

            return (
              <button
                key={step.number}
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (!disabled) onStepClick(step.number);
                }}
                className={cn(
                  'w-full flex items-start gap-3 py-1.5 px-2 -mx-2 text-left rounded-lg transition-colors',
                  disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-slate-50/80',
                  isCurrent && 'bg-slate-50/80'
                )}
              >
                {/* Step Circle & Connecting Line Column */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                      status === 'changes_requested'
                        ? 'bg-amber-500 text-white border border-amber-500 shadow-xs'
                        : status === 'approved'
                        ? 'bg-emerald-500 text-white border border-emerald-500 shadow-xs'
                        : status === 'complete'
                        ? 'bg-[#0e59f9] text-white border border-[#0e59f9] shadow-xs'
                        : isCurrent
                        ? 'bg-[#0e59f9] text-white border border-[#0e59f9] font-semibold shadow-xs'
                        : 'border border-slate-400 text-slate-600 bg-white'
                    )}
                  >
                    {status === 'changes_requested' ? (
                      <AlertCircle className="w-3.5 h-3.5 stroke-[2.2]" />
                    ) : status === 'approved' || status === 'complete' ? (
                      <Check className="w-3.5 h-3.5 stroke-[2]" />
                    ) : (
                      step.number
                    )}
                  </div>

                  {!isLast && (
                    <div
                      className={cn(
                        'w-0.5 my-1 transition-colors',
                        lineHeightClass,
                        status === 'changes_requested'
                          ? 'bg-amber-300'
                          : status === 'approved'
                          ? 'bg-emerald-400'
                          : status === 'complete'
                          ? 'bg-[#0e59f9]'
                          : 'bg-slate-200'
                      )}
                    />
                  )}
                </div>

                {/* Step Title & Subtitle */}
                <div className="pt-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p
                      className={cn(
                        'text-xs font-semibold leading-tight truncate',
                        isCurrent
                          ? 'text-slate-900 font-semibold'
                          : status === 'changes_requested'
                          ? 'text-amber-800 font-semibold'
                          : status === 'complete' || status === 'approved'
                          ? 'text-slate-900 font-semibold'
                          : 'text-slate-600'
                      )}
                    >
                      {step.title}
                    </p>
                    {status === 'approved' && (
                      <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                        Disetujui
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {step.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Security Note at bottom */}
      <div className="pt-4 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 leading-tight">
          Data dan dokumen dilindungi enkripsi perbankan dan regulasi Bank Indonesia.
        </p>
      </div>
    </aside>
  );
}
