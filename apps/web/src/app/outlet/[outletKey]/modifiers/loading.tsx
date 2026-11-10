import { Skeleton } from "@/components/ui/skeleton";

export default function ModifiersLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48 rounded-full bg-slate-200" />
          <Skeleton className="h-4 w-80 max-w-full rounded-full bg-slate-100" />
        </div>
        <Skeleton className="h-10 w-36 rounded-full bg-slate-200" />
      </div>

      {/* Toolbar Skeleton (Search & Total Count) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <Skeleton className="h-10 w-full sm:max-w-xs md:max-w-sm rounded-full bg-white shadow-sm-md" />
        <Skeleton className="h-10 w-32 rounded-full bg-white shadow-sm-md" />
      </div>

      {/* 3-Column Card Grid Skeleton (Matches Modifier Cards Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm-md border-none flex flex-col justify-between space-y-5"
          >
            {/* Card Header Skeleton */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-5 w-32 rounded-full bg-slate-200" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4.5 w-18 rounded-full bg-slate-100" />
                    <Skeleton className="h-4 w-24 rounded-full bg-slate-100" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Skeleton className="h-8 w-8 rounded-full bg-slate-100" />
                  <Skeleton className="h-8 w-8 rounded-full bg-slate-100" />
                </div>
              </div>

              {/* Modifier Rows Skeleton */}
              <div className="space-y-3 pt-2 divide-y divide-slate-100/80">
                {Array.from({ length: 3 }).map((__, rowIdx) => (
                  <div
                    key={rowIdx}
                    className="flex items-center justify-between pt-2.5 first:pt-0"
                  >
                    <Skeleton className="h-4 w-24 rounded-full bg-slate-100" />
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="h-4 w-14 rounded-full bg-slate-100" />
                      <Skeleton className="h-5 w-9 rounded-full bg-slate-200" />
                      <Skeleton className="h-7 w-7 rounded-full bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Button Skeleton (Reflecting Menuin Blue Style) */}
            <Skeleton className="h-9 w-full rounded-full bg-blue-100/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
