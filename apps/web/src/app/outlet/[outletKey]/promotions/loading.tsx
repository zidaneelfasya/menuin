import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function PromotionsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-44 rounded-full bg-slate-200" />
          <Skeleton className="h-4 w-72 max-w-full rounded-full bg-slate-100" />
        </div>
        <Skeleton className="h-9 w-36 rounded-full bg-slate-200 shadow-sm-md" />
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 rounded-2xl bg-white border-none shadow-sm-md p-5 flex flex-col justify-between">
            <Skeleton className="w-10 h-10 rounded-full bg-slate-100" />
            <div className="space-y-2">
              <Skeleton className="w-24 h-3 rounded-full bg-slate-100" />
              <Skeleton className="w-36 h-6 rounded-full bg-slate-200" />
            </div>
          </div>
        ))}
      </div>

      <TableSkeleton />
    </div>
  );
}
