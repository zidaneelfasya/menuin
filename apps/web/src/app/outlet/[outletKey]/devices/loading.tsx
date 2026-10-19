import { Skeleton } from "@/components/ui/skeleton";

export default function DevicesLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-44 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="h-4 w-72 max-w-full rounded-md bg-slate-100 dark:bg-slate-800/60" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl bg-slate-200/80 dark:bg-slate-800" />
      </div>

      {/* Devices Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((card) => (
          <div
            key={card}
            className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                  <Skeleton className="h-3 w-20 bg-slate-100 dark:bg-slate-800/60 rounded" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 rounded-full bg-slate-100 dark:bg-slate-800" />
            </div>
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Skeleton className="h-3 w-40 bg-slate-100 dark:bg-slate-800/60 rounded" />
              <Skeleton className="h-3 w-28 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
