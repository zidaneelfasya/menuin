import { Skeleton } from "@/components/ui/skeleton";

export default function CatalogVisibilityLoading() {
  return (
    <div className="p-6 space-y-6 max-w-4xl animate-pulse">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-52 rounded-lg bg-slate-200" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md bg-slate-100" />
      </div>

      {/* Card Table Skeleton */}
      <div className="rounded-2xl border-none shadow-md bg-white p-6 space-y-4">
        <div className="flex justify-between items-center pb-2">
          <div className="space-y-1">
            <Skeleton className="h-5 w-36 rounded-md bg-slate-200" />
            <Skeleton className="h-3.5 w-64 rounded bg-slate-100" />
          </div>
          <Skeleton className="h-9 w-60 rounded-full bg-slate-100" />
        </div>

        {/* Table Rows Skeleton */}
        <div className="space-y-2 pt-2">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl bg-slate-200" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40 rounded bg-slate-200" />
                  <Skeleton className="h-3 w-24 rounded bg-slate-100" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-6 w-11 rounded-full bg-slate-200" />
                <Skeleton className="h-6 w-11 rounded-full bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
