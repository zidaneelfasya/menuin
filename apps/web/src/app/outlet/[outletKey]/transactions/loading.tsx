import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 1. Top Header */}
      <div>
        <Skeleton className="h-7 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="h-4 w-80 max-w-full rounded-md bg-slate-100 dark:bg-slate-800/60 mt-1" />
      </div>

      {/* 2. Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between min-h-[168px]">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="w-16 h-5 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="mt-6 flex items-end justify-between">
            <div className="space-y-2">
              <div className="h-3 w-20 bg-slate-200/70 dark:bg-slate-800 rounded" />
              <div className="h-7 w-32 bg-slate-200/80 dark:bg-slate-800 rounded-md" />
            </div>
            <div className="w-20 h-8 bg-slate-100 dark:bg-slate-800 rounded-md" />
          </div>
        </div>

        {/* Cards 2, 3, 4 */}
        {[1, 2, 3].map((i) => (
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
                <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
              </div>
              <div className="w-20 h-8 bg-slate-100 dark:bg-slate-800 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Status Tabs & Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 dark:border-slate-800 gap-4 pb-3">
        <div className="flex items-center gap-6 overflow-hidden pt-1">
          <Skeleton className="h-6 w-32 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="h-6 w-24 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
          <Skeleton className="h-6 w-20 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
          <Skeleton className="h-6 w-28 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-56 rounded-xl bg-slate-100 dark:bg-slate-800" />
          <Skeleton className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800" />
          <Skeleton className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>

      {/* 4. Table Skeleton */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex gap-4">
          <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="h-4 w-20 bg-slate-200 dark:bg-slate-800 ml-auto" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Skeleton className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-28 bg-slate-200 dark:bg-slate-800" />
                  <Skeleton className="h-2.5 w-16 bg-slate-100 dark:bg-slate-800/60" />
                </div>
              </div>
              <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-4 w-20 bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
