import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-pulse">
      {/* 1. Welcome Hero Banner Skeleton */}
      <div className="h-44 rounded-2xl bg-gradient-to-r from-blue-500/15 via-blue-500/10 to-indigo-500/15 border border-blue-500/20 p-6 sm:p-8 flex flex-col justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 bg-blue-500/30 rounded" />
          <Skeleton className="h-7 w-64 bg-blue-500/40 rounded-md" />
          <Skeleton className="h-4 w-80 max-w-full bg-blue-500/20 rounded" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-32 bg-blue-500/30 rounded-xl" />
          <Skeleton className="h-9 w-28 bg-blue-500/20 rounded-xl" />
        </div>
      </div>

      {/* 2. Top 4 Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Hero Blue */}
        <div className="rounded-2xl bg-[#0e59f9]/20 border border-blue-500/30 p-5 sm:p-6 flex flex-col justify-between min-h-[168px]">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-full bg-blue-500/30" />
            <div className="w-16 h-5 rounded-full bg-blue-500/20" />
          </div>
          <div className="mt-6 flex items-end justify-between">
            <div className="space-y-2">
              <div className="h-3 w-20 bg-blue-500/30 rounded" />
              <div className="h-7 w-32 bg-blue-500/40 rounded-md" />
            </div>
            <div className="w-20 h-8 bg-blue-500/20 rounded-md" />
          </div>
        </div>

        {/* Cards 2, 3, 4 */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-[#EAEFF8] dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between min-h-[168px]"
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

      {/* 3. Charts & Channel Split Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-[#EAEFF8] dark:border-slate-800 p-5 sm:p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <Skeleton className="h-5 w-48 rounded-md bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-7 w-32 rounded-lg bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="h-64 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-end gap-3 p-4">
            {[35, 60, 45, 80, 50, 70, 95, 65, 40, 75, 85, 60].map((h, idx) => (
              <div
                key={idx}
                className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-t-md"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Channel Split */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-[#EAEFF8] dark:border-slate-800 p-5 sm:p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <Skeleton className="h-5 w-32 rounded-md bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-5 w-16 rounded-md bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((j) => (
              <div key={j} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                  <Skeleton className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
                <Skeleton className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
