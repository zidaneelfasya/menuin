import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
  return (
    <div className="max-w-5xl mx-auto py-6 px-4 md:px-8 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2 pb-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-48 rounded-full bg-slate-200" />
          <Skeleton className="h-5 w-24 rounded-full bg-slate-100" />
        </div>
        <Skeleton className="h-4 w-96 max-w-full rounded-full bg-slate-100" />
      </div>

      {/* Toolbar Filter Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full bg-white shadow-xs shrink-0" />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-full bg-white shadow-xs" />
          <Skeleton className="h-9 w-36 rounded-full bg-white shadow-xs" />
        </div>
      </div>

      {/* Group Timeline Skeleton */}
      <div className="space-y-4 pt-4">
        <Skeleton className="h-4 w-20 rounded-full bg-slate-200" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-white shadow-[0_2px_12px_rgba(160,175,200,0.14)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-2xl bg-slate-100" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-48 rounded-full bg-slate-200" />
                    <Skeleton className="h-3 w-72 max-w-full rounded-full bg-slate-100" />
                  </div>
                </div>
                <Skeleton className="h-4 w-20 rounded-full bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
