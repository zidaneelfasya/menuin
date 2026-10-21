import { Skeleton } from "@/components/ui/skeleton";

export default function CatalogLoading() {
  return (
    <div className="p-6 space-y-6 max-w-4xl animate-pulse">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-48 rounded-lg bg-slate-200" />
        <Skeleton className="h-4 w-80 max-w-full rounded-md bg-slate-100" />
      </div>

      {/* Main Settings Card */}
      <div className="rounded-2xl border-none shadow-md bg-white p-6 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-40 rounded-md bg-slate-200" />
            <Skeleton className="h-3.5 w-60 rounded bg-slate-100" />
          </div>
          <Skeleton className="h-6 w-12 rounded-full bg-slate-200" />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 bg-slate-200 rounded" />
            <Skeleton className="h-10 w-full bg-slate-100 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 bg-slate-200 rounded" />
            <Skeleton className="h-20 w-full bg-slate-100 rounded-2xl" />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Skeleton className="h-11 w-36 rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
