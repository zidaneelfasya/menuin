import { Skeleton } from "@/components/ui/skeleton";

export default function CatalogAppearanceLoading() {
  return (
    <div className="p-6 space-y-6 max-w-4xl animate-pulse">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-52 rounded-lg bg-slate-200" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md bg-slate-100" />
      </div>

      {/* Identitas Toko Card Skeleton */}
      <div className="rounded-2xl border-none shadow-md bg-white p-6 space-y-6">
        <div className="space-y-1.5 pb-2 border-b border-slate-100">
          <Skeleton className="h-5 w-48 rounded-md bg-slate-200" />
          <Skeleton className="h-3.5 w-72 rounded bg-slate-100" />
        </div>

        {/* Banner & Logo Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 bg-slate-200 rounded" />
            <Skeleton className="h-32 w-full bg-slate-100 rounded-2xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 bg-slate-200 rounded" />
            <Skeleton className="h-32 w-32 rounded-full bg-slate-100 mx-auto" />
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 bg-slate-200 rounded" />
            <Skeleton className="h-10 w-full bg-slate-100 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 bg-slate-200 rounded" />
            <Skeleton className="h-24 w-full bg-slate-100 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Operasional & Kontak Card Skeleton */}
      <div className="rounded-2xl border-none shadow-md bg-white p-6 space-y-4">
        <Skeleton className="h-5 w-40 rounded-md bg-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full bg-slate-100 rounded-full" />
          <Skeleton className="h-10 w-full bg-slate-100 rounded-full" />
        </div>
      </div>
    </div>
  );
}
