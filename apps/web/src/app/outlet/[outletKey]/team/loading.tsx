import { Skeleton } from "@/components/ui/skeleton";

export default function TeamLoading() {
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-48 rounded-full bg-slate-200" />
          <Skeleton className="h-4 w-72 max-w-full rounded-full bg-slate-100" />
        </div>
        <Skeleton className="h-9 w-36 rounded-full bg-slate-200" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl border-none bg-white shadow-sm-md p-5 space-y-2">
            <Skeleton className="h-4 w-24 rounded-full bg-slate-100" />
            <Skeleton className="h-7 w-16 rounded-full bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border-none shadow-sm-md bg-white p-5 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <Skeleton className="h-8 w-64 rounded-full bg-slate-100" />
          <Skeleton className="h-8 w-24 rounded-full bg-slate-100" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex justify-between items-center py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full bg-slate-100" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36 bg-slate-200 rounded-full" />
                  <Skeleton className="h-3 w-48 bg-slate-100 rounded-full" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-20 rounded-full bg-slate-100" />
                <Skeleton className="h-8 w-8 rounded-full bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
