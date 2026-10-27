import { Skeleton } from "@/components/ui/skeleton";

export default function CatalogTablesLoading() {
  return (
    <div className="p-6 space-y-6 max-w-4xl animate-pulse">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-48 rounded-lg bg-slate-200" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md bg-slate-100" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Tambah Meja Card Skeleton */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-2xl border-none shadow-md bg-white p-6 space-y-4">
            <Skeleton className="h-5 w-32 rounded-md bg-slate-200" />
            <div className="space-y-3 pt-2">
              <Skeleton className="h-4 w-28 rounded bg-slate-200" />
              <Skeleton className="h-10 w-full rounded-full bg-slate-100" />
              <Skeleton className="h-10 w-full rounded-full bg-slate-200" />
            </div>
          </div>
        </div>

        {/* Right: Daftar Meja Card Skeleton */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border-none shadow-md bg-white p-6 space-y-4">
            <div className="space-y-1 pb-2">
              <Skeleton className="h-5 w-32 rounded-md bg-slate-200" />
              <Skeleton className="h-3.5 w-64 rounded bg-slate-100" />
            </div>

            {/* Table Rows Skeleton */}
            <div className="space-y-2 pt-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24 rounded bg-slate-200" />
                    <Skeleton className="h-3 w-48 rounded bg-slate-100" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full bg-slate-200" />
                    <Skeleton className="h-8 w-8 rounded-full bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
