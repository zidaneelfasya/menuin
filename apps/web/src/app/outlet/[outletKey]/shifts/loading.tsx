import { Skeleton } from "@/components/ui/skeleton";

export default function ShiftsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-40 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="h-4 w-72 max-w-full rounded-md bg-slate-100 dark:bg-slate-800/60" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl bg-slate-200/80 dark:bg-slate-800" />
      </div>

      {/* Active Shift Card Banner */}
      <div className="rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-5 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/60" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-36 rounded bg-blue-200 dark:bg-blue-800" />
              <Skeleton className="h-3.5 w-52 rounded bg-blue-100 dark:bg-blue-900/40" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-xl bg-blue-200 dark:bg-blue-800" />
            <Skeleton className="h-10 w-32 rounded-xl bg-blue-300 dark:bg-blue-700" />
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
          <Skeleton className="h-5 w-40 rounded-md bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="h-8 w-28 rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                  <Skeleton className="h-3 w-20 bg-slate-100 dark:bg-slate-800/60 rounded" />
                </div>
              </div>
              <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
