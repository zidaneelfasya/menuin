import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersLoading() {
  return (
    <div className="h-full flex-1 min-h-0 overflow-hidden flex flex-col space-y-3 animate-pulse">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="h-4 w-80 max-w-full rounded-md bg-slate-100 dark:bg-slate-800/60" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>

      {/* Kanban Columns Skeleton */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((col) => (
          <div
            key={col}
            className="flex flex-col rounded-2xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 p-3 h-full space-y-3"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2">
                <Skeleton className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                <Skeleton className="h-5 w-32 rounded bg-slate-300 dark:bg-slate-700" />
              </div>
              <Skeleton className="h-5 w-6 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Order Cards */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {[1, 2, 3].map((card) => (
                <div
                  key={card}
                  className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 shadow-xs"
                >
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                    <Skeleton className="h-4 w-16 rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <Skeleton className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-800" />
                    <Skeleton className="h-3 w-32 rounded bg-slate-100 dark:bg-slate-800/60" />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Skeleton className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                    <Skeleton className="h-7 w-24 rounded-lg bg-blue-100 dark:bg-blue-950/40" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
