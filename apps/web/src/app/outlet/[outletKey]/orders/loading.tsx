import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersLoading() {
  return (
    <div className="h-full flex-1 min-h-0 overflow-hidden flex flex-col space-y-3.5 animate-pulse">
      {/* Top Header & Toolbar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-44 rounded-lg bg-slate-200/70" />
          <Skeleton className="h-3.5 w-72 max-w-full rounded-md bg-slate-100" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-52 rounded-full bg-slate-100/90" />
          <Skeleton className="h-9 w-9 rounded-full bg-slate-100/90 shrink-0" />
          <Skeleton className="h-9 w-9 rounded-full bg-slate-100/90 shrink-0" />
        </div>
      </div>

      {/* Status Tabs Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide shrink-0">
        <Skeleton className="h-7 w-28 rounded-full bg-slate-200/60" />
        <Skeleton className="h-7 w-32 rounded-full bg-slate-100/80" />
        <Skeleton className="h-7 w-28 rounded-full bg-slate-100/80" />
        <Skeleton className="h-7 w-32 rounded-full bg-slate-100/80" />
        <Skeleton className="h-7 w-28 rounded-full bg-slate-100/80" />
      </div>

      {/* 4 Kanban Columns Skeleton (Matching Actual Layout) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 overflow-hidden">
        {[1, 2, 3, 4].map((col) => (
          <div
            key={col}
            className="flex flex-col rounded-t-2xl rounded-b-none bg-white p-3 h-full space-y-3"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-1.5 py-1">
              <div className="flex items-center gap-2">
                <Skeleton className="w-3.5 h-3.5 rounded-full bg-slate-200/80" />
                <Skeleton className="h-4 w-28 rounded-md bg-slate-200/80" />
              </div>
              <Skeleton className="h-4.5 w-5 rounded-full bg-slate-200/60" />
            </div>

            {/* Order Cards */}
            <div className="space-y-2.5 flex-1 overflow-y-auto scrollbar-hide pr-0.5">
              {[1, 2].map((card) => (
                <div
                  key={card}
                  className="rounded-2xl bg-white shadow-md p-3.5 space-y-2.5"
                >
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-3.5 w-20 rounded bg-slate-200/70" />
                    <Skeleton className="h-3.5 w-14 rounded-full bg-slate-100" />
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <Skeleton className="h-3 w-36 rounded bg-slate-100" />
                    <Skeleton className="h-3 w-28 rounded bg-slate-100/70" />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100/80">
                    <Skeleton className="h-3.5 w-16 rounded bg-slate-200/60" />
                    <Skeleton className="h-6.5 w-20 rounded-full bg-slate-200/70" />
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
