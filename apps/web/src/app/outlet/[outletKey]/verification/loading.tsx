import { Skeleton } from "@/components/ui/skeleton";

export default function VerificationLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto animate-pulse">
      {/* Header */}
      <div className="space-y-1.5 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <Skeleton className="h-7 w-56 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md bg-slate-100 dark:bg-slate-800/60" />
      </div>

      {/* Main Status Hero Banner */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-3.5 w-60 rounded bg-slate-100 dark:bg-slate-800/60" />
            </div>
          </div>
          <Skeleton className="h-10 w-36 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="pt-2">
          <Skeleton className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>

      {/* Checklist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800" />
                <Skeleton className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full bg-slate-100 dark:bg-slate-800" />
            </div>
            <Skeleton className="h-3 w-48 rounded bg-slate-100 dark:bg-slate-800/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
