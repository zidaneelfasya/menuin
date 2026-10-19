import { Skeleton } from "@/components/ui/skeleton";

export default function OutletRootLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="h-4 w-72 max-w-full rounded-md bg-slate-100 dark:bg-slate-800/60" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Content Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 min-h-[140px] flex flex-col justify-between"
          >
            <div className="flex justify-between items-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800" />
              <div className="w-12 h-4 rounded-full bg-slate-100 dark:bg-slate-800" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-6 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Body Skeleton */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <Skeleton className="h-6 w-48 rounded-md bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="h-64 w-full rounded-xl bg-slate-50 dark:bg-slate-800/40" />
      </div>
    </div>
  );
}
