import { Skeleton } from "@/components/ui/skeleton";

export default function CatalogOrderingLoading() {
  return (
    <div className="p-6 space-y-6 max-w-4xl animate-pulse">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-64 rounded-lg bg-slate-200" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md bg-slate-100" />
      </div>

      {/* Card 1: Tipe Pesanan */}
      <div className="rounded-2xl border-none shadow-md bg-white p-6 space-y-4">
        <div className="space-y-1 pb-2 border-b border-slate-100">
          <Skeleton className="h-5 w-44 rounded-md bg-slate-200" />
          <Skeleton className="h-3.5 w-72 rounded bg-slate-100" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center justify-between py-1">
              <Skeleton className="h-4 w-40 rounded bg-slate-200" />
              <Skeleton className="h-6 w-11 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      </div>

      {/* Card 2: Informasi Pelanggan */}
      <div className="rounded-2xl border-none shadow-md bg-white p-6 space-y-4">
        <div className="space-y-1 pb-2 border-b border-slate-100">
          <Skeleton className="h-5 w-48 rounded-md bg-slate-200" />
          <Skeleton className="h-3.5 w-60 rounded bg-slate-100" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center justify-between py-1">
              <Skeleton className="h-4 w-48 rounded bg-slate-200" />
              <Skeleton className="h-6 w-11 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      </div>

      {/* Save Button Skeleton */}
      <div className="flex justify-end pt-2">
        <Skeleton className="h-11 w-44 rounded-full bg-slate-200" />
      </div>
    </div>
  );
}
