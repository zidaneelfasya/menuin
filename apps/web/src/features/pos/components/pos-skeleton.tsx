import { Skeleton } from "@/components/ui/skeleton";

export function POSSkeleton() {
  return (
    <div className="flex h-full w-full relative">
      {/* Left side: Product Catalog Skeleton */}
      <div className="flex-1 w-full lg:w-[65%] xl:w-[70%] h-full pb-20 lg:pb-0 flex flex-col space-y-4">
        {/* Search */}
        <Skeleton className="h-11 w-full rounded-xl" />
        
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-hidden">
          <Skeleton className="h-9 w-20 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-hidden pr-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-card border rounded-2xl overflow-hidden flex flex-col h-48">
                <Skeleton className="w-full h-[60%] rounded-none" />
                <div className="p-3 flex flex-col justify-between flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex items-center justify-between mt-auto">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side: Cart Skeleton */}
      <div className="hidden lg:block w-[320px] xl:w-[400px] h-full flex-shrink-0 ml-6 relative">
        <div className="bg-card border rounded-3xl h-full flex flex-col overflow-hidden p-4 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="flex-1 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 border-b pb-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-12 w-full rounded-xl mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
