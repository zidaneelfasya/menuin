import { Skeleton } from "@/components/ui/skeleton";

export default function VerificationLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Header */}
      <div className="space-y-1.5 pb-2">
        <Skeleton className="h-7 w-56 rounded-full bg-slate-200" />
        <Skeleton className="h-4 w-96 max-w-full rounded-full bg-slate-100" />
      </div>

      {/* Main Status Hero Banner */}
      <div className="rounded-2xl border-none shadow-sm-md bg-white p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-slate-100" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-40 rounded-full bg-slate-200" />
              <Skeleton className="h-3.5 w-60 rounded-full bg-slate-100" />
            </div>
          </div>
          <Skeleton className="h-9 w-36 rounded-full bg-slate-200" />
        </div>
        <div className="pt-2">
          <Skeleton className="h-2 w-full rounded-full bg-slate-100" />
        </div>
      </div>

      {/* Checklist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border-none shadow-sm-md bg-white p-5 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-7 h-7 rounded-full bg-slate-100" />
                <Skeleton className="h-4 w-32 rounded-full bg-slate-200" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full bg-slate-100" />
            </div>
            <Skeleton className="h-3 w-48 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
