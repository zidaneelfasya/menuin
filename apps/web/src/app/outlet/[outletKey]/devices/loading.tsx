import { Skeleton } from "@/components/ui/skeleton";

export default function DevicesLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-44 rounded-full bg-slate-200" />
          <Skeleton className="h-4 w-72 max-w-full rounded-full bg-slate-100" />
        </div>
        <Skeleton className="h-9 w-40 rounded-full bg-slate-200" />
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3].map((card) => (
          <div
            key={card}
            className="rounded-2xl border-none shadow-sm-md bg-white p-5 space-y-2"
          >
            <Skeleton className="h-3 w-24 rounded-full bg-slate-100" />
            <Skeleton className="h-7 w-16 rounded-full bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Devices Cards Grid / Table Container */}
      <div className="rounded-2xl border-none shadow-sm-md bg-white p-5 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <Skeleton className="h-5 w-48 rounded-full bg-slate-200" />
          <Skeleton className="h-9 w-60 rounded-full bg-slate-100" />
        </div>
        {[1, 2, 3].map((row) => (
          <div key={row} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-none">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-xl bg-slate-100" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32 rounded-full bg-slate-200" />
                <Skeleton className="h-3 w-20 rounded-full bg-slate-100" />
              </div>
            </div>
            <Skeleton className="h-5 w-20 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
