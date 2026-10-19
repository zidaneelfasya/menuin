export default function VerificationLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-36 bg-slate-200 rounded-sm" />
        <div className="h-7 w-64 bg-slate-200 rounded-md" />
        <div className="h-4 w-96 max-w-full bg-slate-100 rounded-sm" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Hero Card Skeleton */}
        <div className="lg:col-span-4 min-h-[220px] rounded-2xl bg-blue-100/60 border border-blue-200/50 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-full bg-white/80" />
            <div className="w-20 h-5 rounded-md bg-white/70" />
          </div>
          <div className="space-y-2 my-4">
            <div className="h-3 w-28 bg-white/70 rounded-sm" />
            <div className="h-6 w-48 bg-white/90 rounded-md" />
            <div className="h-4 w-full bg-white/60 rounded-sm" />
          </div>
          <div className="h-9 w-32 bg-white rounded-xl" />
        </div>

        {/* Right Progress Card Skeleton */}
        <div className="lg:col-span-8 rounded-2xl bg-white border border-[#EAEFF8] p-6 space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="space-y-1">
              <div className="h-3 w-24 bg-slate-200 rounded-sm" />
              <div className="h-5 w-44 bg-slate-200 rounded-md" />
            </div>
            <div className="h-6 w-32 bg-blue-50 rounded-lg" />
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-200" />
              <div className="space-y-1">
                <div className="h-4 w-40 bg-slate-200 rounded-sm" />
                <div className="h-3 w-60 bg-slate-100 rounded-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 rounded-xl bg-slate-50 border border-slate-100 p-3 flex flex-col justify-between">
                  <div className="w-8 h-8 rounded-lg bg-slate-200" />
                  <div className="space-y-1">
                    <div className="h-2.5 w-16 bg-slate-200 rounded-sm" />
                    <div className="h-3.5 w-24 bg-slate-200 rounded-sm" />
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
