import { Skeleton } from "@/components/ui/skeleton";

export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Tabs Sidebar */}
        <div className="flex flex-col w-full md:w-72 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>

        {/* Content Card */}
        <div className="flex-1 w-full max-w-3xl">
          <div className="border-0 shadow-sm ring-1 ring-slate-200 rounded-xl bg-card">
            {/* Card Header */}
            <div className="p-6 pb-4 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            
            {/* Card Content */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-11 w-full rounded-md" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-11 w-full rounded-md" />
                </div>
              </div>

              <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-24 w-full rounded-md" />
              </div>

              <div className="flex justify-end pt-4">
                <Skeleton className="h-11 w-40 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
