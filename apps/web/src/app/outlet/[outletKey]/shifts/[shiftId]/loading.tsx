import { Skeleton } from "@/components/ui/skeleton";

export default function ShiftDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Bar / Back Navigation Skeleton */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-28 rounded-full bg-slate-200" />
          <Skeleton className="h-6 w-36 rounded-full bg-slate-200" />
        </div>
        <Skeleton className="h-9 w-32 rounded-full bg-slate-200" />
      </div>

      {/* Hero Overview Card */}
      <div className="rounded-2xl border-none shadow-sm-md bg-white p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-full bg-slate-100" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-48 rounded-full bg-slate-200" />
              <Skeleton className="h-3.5 w-32 rounded-full bg-slate-100" />
            </div>
          </div>
          <Skeleton className="h-8 w-24 rounded-full bg-slate-100" />
        </div>

        {/* 4 Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50/70 space-y-2">
              <Skeleton className="h-3 w-20 rounded-full bg-slate-200" />
              <Skeleton className="h-6 w-28 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs / Transactions List Skeleton */}
      <div className="rounded-2xl border-none shadow-sm-md bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36 rounded-full bg-slate-200" />
          <Skeleton className="h-8 w-24 rounded-full bg-slate-100" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg bg-slate-100" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded-full bg-slate-200" />
                  <Skeleton className="h-3 w-20 rounded-full bg-slate-100" />
                </div>
              </div>
              <Skeleton className="h-4 w-20 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
