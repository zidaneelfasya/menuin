import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ItemsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-44 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="h-4 w-72 max-w-full rounded-md bg-slate-100 dark:bg-slate-800/60" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>

      <TableSkeleton />
    </div>
  );
}
