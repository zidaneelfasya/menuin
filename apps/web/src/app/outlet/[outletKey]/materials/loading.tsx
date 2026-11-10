import { Skeleton } from "@/components/ui/skeleton";

export default function MaterialsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 1. Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-44 rounded-lg bg-slate-200" />
          <Skeleton className="h-4 w-80 max-w-full rounded-md bg-slate-100" />
        </div>
        <Skeleton className="h-10 w-36 rounded-full bg-white shadow-sm-md" />
      </div>

      {/* 2. Universal Baris Tunggal Skeleton: Status Tabs & Action Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-100 gap-4">
        {/* Tab Filter Skeletons */}
        <div className="flex items-center gap-6 overflow-x-auto pb-3 pt-1">
          <Skeleton className="h-5 w-24 rounded-full bg-slate-200/80" />
          <Skeleton className="h-5 w-24 rounded-full bg-slate-100" />
          <Skeleton className="h-5 w-28 rounded-full bg-slate-100" />
          <Skeleton className="h-5 w-20 rounded-full bg-slate-100" />
        </div>

        {/* Toolbar Skeletons */}
        <div className="flex items-center gap-2 pb-2.5 lg:pb-3 flex-wrap">
          <Skeleton className="h-10 w-full sm:w-56 rounded-full bg-white shadow-sm-md" />
          <Skeleton className="h-10 w-10 rounded-full bg-white shadow-sm-md" />
          <Skeleton className="h-10 w-24 rounded-full bg-white shadow-sm-md" />
          <Skeleton className="h-10 w-36 rounded-full bg-[#0e59f9]/20" />
        </div>
      </div>

      {/* 3. Pure-White Borderless Table Card Skeleton (Matches Riwayat Transaksi Standard) */}
      <div className="rounded-2xl border-none bg-white overflow-hidden shadow-sm-md">
        <div className="relative w-full overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="py-3.5 pl-5 pr-3 w-10">
                  <Skeleton className="h-4 w-4 rounded-md bg-slate-200/70" />
                </th>
                <th className="py-3.5 px-4 w-[240px]">
                  <Skeleton className="h-4 w-24 rounded-md bg-slate-200/70" />
                </th>
                <th className="py-3.5 px-4 w-[140px]">
                  <Skeleton className="h-4 w-16 rounded-md bg-slate-200/70" />
                </th>
                <th className="py-3.5 px-4 w-[160px]">
                  <Skeleton className="h-4 w-20 rounded-md bg-slate-200/70" />
                </th>
                <th className="py-3.5 px-4 w-[140px]">
                  <Skeleton className="h-4 w-18 rounded-md bg-slate-200/70" />
                </th>
                <th className="py-3.5 px-4 w-[120px]">
                  <Skeleton className="h-4 w-14 rounded-md bg-slate-200/70" />
                </th>
                <th className="py-3.5 pr-5 pl-4 text-right w-[110px]">
                  <Skeleton className="h-4 w-10 rounded-md bg-slate-200/70 ml-auto" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {/* Checkbox */}
                  <td className="py-3.5 pl-5 pr-3 whitespace-nowrap">
                    <Skeleton className="h-4 w-4 rounded-md bg-slate-200/60" />
                  </td>

                  {/* Bahan Baku: Avatar + 2 baris */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="w-8 h-8 rounded-full bg-slate-200/80 shrink-0" />
                      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <Skeleton className="h-3.5 w-32 rounded-md bg-slate-200/80" />
                        <Skeleton className="h-2.5 w-16 rounded-md bg-slate-200/50" />
                      </div>
                    </div>
                  </td>

                  {/* Kategori */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Skeleton className="h-3.5 w-20 rounded-md bg-slate-200/70" />
                  </td>

                  {/* Sisa Stok: 2 baris */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-3.5 w-16 rounded-md bg-slate-200/80" />
                      <Skeleton className="h-2.5 w-24 rounded-md bg-slate-200/50" />
                    </div>
                  </td>

                  {/* Harga Beli: 2 baris */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-3.5 w-20 rounded-md bg-slate-200/80" />
                      <Skeleton className="h-2.5 w-14 rounded-md bg-slate-200/50" />
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Skeleton className="h-6 w-16 rounded-full bg-slate-200/80" />
                  </td>

                  {/* Aksi: 2 tombol + menu */}
                  <td className="py-3.5 pr-5 pl-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Skeleton className="h-7 w-7 rounded-full bg-slate-200/70" />
                      <Skeleton className="h-7 w-7 rounded-full bg-slate-200/70" />
                      <Skeleton className="h-7 w-7 rounded-full bg-slate-200/70" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
