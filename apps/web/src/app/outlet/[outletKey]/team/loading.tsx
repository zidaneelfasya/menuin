import { Skeleton } from "@/components/ui/skeleton";

export default function TeamLoading() {
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

      {/* Table Container */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
          <Skeleton className="h-5 w-36 rounded-md bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="h-8 w-24 rounded-lg bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
                  <Skeleton className="h-3 w-48 bg-slate-100 dark:bg-slate-800/60 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
                <Skeleton className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
