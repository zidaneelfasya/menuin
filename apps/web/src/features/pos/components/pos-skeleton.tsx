import { Skeleton } from "@/components/ui/skeleton";

export function POSSkeleton() {
  return (
    <div className="flex h-full w-full relative overflow-hidden select-none animate-pulse">
      {/* 1. LEFT SIDE: PRODUCT CATALOG SKELETON */}
      <div className="flex-1 min-w-0 h-full pb-16 lg:pb-0 flex flex-col space-y-4">
        {/* Search Bar + Filter Settings Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <div className="h-10 w-full rounded-full bg-white dark:bg-slate-900 border-none shadow-sm-md flex items-center px-3.5 gap-2.5">
              <Skeleton className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
              <Skeleton className="h-3.5 w-48 sm:w-64 rounded-md bg-slate-100 dark:bg-slate-800/60" />
            </div>
          </div>
          <div className="h-10 w-10 rounded-full bg-white dark:bg-slate-900 border-none shadow-sm-md shrink-0 flex items-center justify-center">
            <Skeleton className="w-4 h-4 rounded-sm bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="relative border-b border-slate-200 dark:border-slate-800 pt-0.5 shrink-0">
          <div className="flex items-center gap-6 overflow-hidden pt-1 pb-3 px-1">
            {/* Active Tab (Semua) with neutral indicator */}
            <div className="relative pb-1 flex items-center gap-2 shrink-0">
              <Skeleton className="h-4 w-14 rounded-md bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-5 w-6 rounded-full bg-slate-200/80 dark:bg-slate-800" />
              <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>

            {/* Inactive Tabs */}
            {[
              { w: "w-20", count: "w-5" },
              { w: "w-14", count: "w-5" },
              { w: "w-12", count: "w-5" },
              { w: "w-28", count: "w-6" },
              { w: "w-20", count: "w-5" },
              { w: "w-32", count: "w-6" },
              { w: "w-16", count: "w-5" },
            ].map((tab, idx) => (
              <div key={idx} className="flex items-center gap-2 shrink-0">
                <Skeleton className={`h-4 ${tab.w} rounded-md bg-slate-200 dark:bg-slate-800`} />
                <Skeleton className={`h-5 ${tab.count} rounded-full bg-slate-100 dark:bg-slate-800/60`} />
              </div>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-hidden px-1 pt-1.5 sm:pt-2 pr-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 rounded-2xl border-none shadow-sm-md overflow-hidden flex flex-col justify-between"
              >
                {/* Image Aspect Box */}
                <div className="aspect-[4/3] w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center">
                  <Skeleton className="w-10 h-10 rounded-xl bg-slate-200/70 dark:bg-slate-700/60" />
                </div>

                {/* Content */}
                <div className="p-3.5 space-y-2.5">
                  <Skeleton className="h-4 w-4/5 rounded-md bg-slate-200 dark:bg-slate-800" />
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-4 w-2/5 rounded-md bg-slate-200 dark:bg-slate-800" />
                    <Skeleton className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. RIGHT SIDE: CART SKELETON (DESKTOP) */}
      <div className="hidden lg:block w-[320px] xl:w-[360px] 2xl:w-[400px] h-full flex-shrink-0 ml-4 lg:ml-6 pb-3 pt-0.5">
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl shadow-md border-none overflow-hidden">
          {/* Order Header / Switcher */}
          <div className="p-3 sm:p-3.5 bg-white dark:bg-slate-900 space-y-2.5 border-b border-slate-100 dark:border-slate-800">
            {/* 3-Segment Switcher (Dine-In, Takeaway, Ojol) */}
            <div className="grid grid-cols-3 p-1 bg-slate-50 dark:bg-slate-950 rounded-full gap-1 shadow-xs border-none">
              <Skeleton className="h-7 rounded-full bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-7 rounded-full bg-transparent" />
              <Skeleton className="h-7 rounded-full bg-transparent" />
            </div>

            {/* Table & Customer Inputs */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24 sm:w-28 rounded-full bg-slate-100 dark:bg-slate-800 shadow-sm-md border-none shrink-0" />
              <Skeleton className="h-9 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 shadow-sm-md border-none" />
            </div>

            {/* Item List Header */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-4 w-16 rounded-md bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-4 w-4 rounded-full bg-slate-100 dark:bg-slate-800" />
              </div>
              <Skeleton className="h-3.5 w-10 rounded-md bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>

          {/* Cart Item Rows */}
          <div className="flex-1 overflow-hidden p-3.5 space-y-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex gap-3 py-1.5 items-center">
                <Skeleton className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <Skeleton className="h-3.5 w-3/4 rounded-md bg-slate-200 dark:bg-slate-800" />
                  <Skeleton className="h-3 w-1/3 rounded-md bg-slate-100 dark:bg-slate-800/60" />
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800" />
                    <Skeleton className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-800" />
                    <Skeleton className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800" />
                  </div>
                  <Skeleton className="h-3.5 w-14 rounded-md bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>

          {/* Footer / Summary / Checkout */}
          <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            {/* Promo Pill */}
            <Skeleton className="h-8 w-full rounded-full bg-slate-100 dark:bg-slate-800" />

            {/* Subtotal, Tax, Rounding lines */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800" />
                <Skeleton className="h-3 w-16 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16 rounded bg-slate-100 dark:bg-slate-800" />
                <Skeleton className="h-3 w-12 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-800" />
                <Skeleton className="h-3 w-10 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>

            {/* Total Tagihan */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <Skeleton className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
            </div>

            {/* Checkout Button */}
            <Skeleton className="h-11 w-full rounded-full bg-slate-200 dark:bg-slate-800 mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
