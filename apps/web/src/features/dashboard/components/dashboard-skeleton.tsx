import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 1. Page Header & Toolbar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48 rounded-full bg-slate-200" />
          <Skeleton className="h-4 w-72 max-w-full rounded-full bg-slate-100" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-9 w-32 rounded-full bg-slate-200/80" />
          <Skeleton className="h-9 w-24 rounded-full bg-slate-200/80" />
          <Skeleton className="h-9 w-9 rounded-full bg-slate-200/80" />
          <Skeleton className="h-9 w-32 rounded-full bg-slate-200/80 hidden sm:block" />
        </div>
      </div>

      {/* 2. Top 4 Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white border-none shadow-sm-md p-5 sm:p-6 flex flex-col justify-between min-h-[190px]"
          >
            <div className="flex justify-between items-center">
              <div className="w-10 h-10 rounded-full bg-slate-100" />
              <div className="w-16 h-5 rounded-full bg-slate-100" />
            </div>
            <div className="mt-8 flex items-end justify-between">
              <div className="space-y-2">
                <div className="h-3 w-20 bg-slate-200 rounded-full" />
                <div className="h-7 w-32 bg-slate-200 rounded-md" />
              </div>
              <div className="w-16 h-6 bg-slate-100 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Hero Row Skeleton: Sales Chart (8 cols) & Top Menu (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Sales Chart (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border-none shadow-sm-md bg-white p-5 sm:p-6 space-y-4 min-h-[380px] flex flex-col justify-between">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-44 rounded-full bg-slate-200" />
              <Skeleton className="h-3.5 w-60 rounded-full bg-slate-100" />
            </div>
            <Skeleton className="h-4 w-28 rounded-full bg-slate-100" />
          </div>
          <div className="flex-1 w-full rounded-2xl bg-slate-50/70 min-h-[220px] flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-200/60 animate-pulse" />
          </div>
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((k) => (
              <div key={k} className="h-20 rounded-2xl bg-slate-50/70 p-3 space-y-2">
                <Skeleton className="h-3 w-20 rounded-full bg-slate-200/70" />
                <Skeleton className="h-4 w-28 rounded-md bg-slate-200/80" />
              </div>
            ))}
          </div>
        </div>

        {/* Top Menu (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border-none shadow-sm-md bg-white p-5 sm:p-6 space-y-4 min-h-[380px] flex flex-col justify-between">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-32 rounded-full bg-slate-200" />
              <Skeleton className="h-3.5 w-48 rounded-full bg-slate-100" />
            </div>
            <Skeleton className="w-7 h-7 rounded-full bg-slate-100" />
          </div>
          <div className="space-y-3 flex-1 py-1">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex-shrink-0" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-28 rounded-full bg-slate-200" />
                    <Skeleton className="h-2.5 w-16 rounded-full bg-slate-100" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16 rounded-md bg-slate-100" />
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2.5">
            <div className="h-14 rounded-xl bg-slate-50 p-2.5 space-y-1">
              <Skeleton className="h-2.5 w-16 rounded-full bg-slate-200" />
              <Skeleton className="h-4 w-20 rounded-md bg-slate-200" />
            </div>
            <div className="h-14 rounded-xl bg-slate-50 p-2.5 space-y-1">
              <Skeleton className="h-2.5 w-16 rounded-full bg-slate-200" />
              <Skeleton className="h-4 w-20 rounded-md bg-slate-200" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Peak Hours Heatmap Skeleton (12 cols) */}
      <div className="rounded-2xl border-none shadow-sm-md bg-white p-5 sm:p-6 space-y-4 min-h-[220px]">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-52 rounded-full bg-slate-200" />
            <Skeleton className="h-3.5 w-72 rounded-full bg-slate-100" />
          </div>
        </div>
        <div className="h-32 rounded-2xl bg-slate-50/70 w-full" />
      </div>

      {/* 5. Bottom Section Skeleton (6 cols + 6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((m) => (
          <div
            key={m}
            className="rounded-2xl border-none shadow-sm-md bg-white p-5 sm:p-6 min-h-[240px] flex flex-col justify-between space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <Skeleton className="h-5 w-40 rounded-full bg-slate-200" />
              <Skeleton className="h-5 w-20 rounded-full bg-slate-100" />
            </div>
            <div className="h-24 rounded-2xl bg-slate-50/70 w-full" />
            <div className="pt-2 grid grid-cols-2 gap-3">
              <div className="h-14 rounded-xl bg-slate-50 p-2.5 space-y-1">
                <Skeleton className="h-2.5 w-16 rounded-full bg-slate-200" />
                <Skeleton className="h-4 w-24 rounded-md bg-slate-200" />
              </div>
              <div className="h-14 rounded-xl bg-slate-50 p-2.5 space-y-1">
                <Skeleton className="h-2.5 w-16 rounded-full bg-slate-200" />
                <Skeleton className="h-4 w-24 rounded-md bg-slate-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardSkeleton;
