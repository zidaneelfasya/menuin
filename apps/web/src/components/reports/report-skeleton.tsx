import { Skeleton } from "@/components/ui/skeleton";

export function ReportSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 1. Page Header & Toolbar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-56 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="h-4 w-80 max-w-full rounded-md bg-slate-100 dark:bg-slate-800/60" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-xl bg-slate-200/80 dark:bg-slate-800" />
          <Skeleton className="h-9 w-24 rounded-xl bg-slate-200/80 dark:bg-slate-800" />
        </div>
      </div>

      {/* 2. Top 4 Metric Cards Skeleton (Clean, neutral white cards, seukuran kartu asli) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between min-h-[168px]"
          >
            <div className="flex justify-between items-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800" />
              <div className="w-16 h-5 rounded-full bg-slate-100 dark:bg-slate-800" />
            </div>
            <div className="mt-6 flex items-end justify-between">
              <div className="space-y-2">
                <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-7 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
              </div>
              <div className="w-16 h-6 bg-slate-100 dark:bg-slate-800 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Satu Card Besar Bersih di Bawah (Elegan, simpel, profesional, tanpa skeleton grafik dummy) */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 min-h-[380px] flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-48 rounded-md bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-3.5 w-64 rounded bg-slate-100 dark:bg-slate-800/60" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-lg bg-slate-100 dark:bg-slate-800" />
            <Skeleton className="h-8 w-20 rounded-lg bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
        <div className="flex-1 w-full rounded-xl bg-slate-50/70 dark:bg-slate-950/40 min-h-[260px] flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default ReportSkeleton;
