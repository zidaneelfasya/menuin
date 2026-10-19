import { Skeleton } from "@/components/ui/skeleton";

export default function CatalogLoading() {
  return (
    <div className="p-6 space-y-6 max-w-4xl animate-pulse">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="h-4 w-80 max-w-full rounded-md bg-slate-100 dark:bg-slate-800/60" />
      </div>

      {/* Main Settings Card */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-40 rounded-md bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-3.5 w-60 rounded bg-slate-100 dark:bg-slate-800/60" />
          </div>
          <Skeleton className="h-6 w-12 rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
            <Skeleton className="h-10 w-full bg-slate-100 dark:bg-slate-800 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
            <Skeleton className="h-28 w-full bg-slate-100 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Skeleton className="h-10 w-32 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
