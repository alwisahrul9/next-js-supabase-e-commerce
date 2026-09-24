import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="p-6 w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-2"></div>
        <div className="h-4 w-72 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
      </div>

      <div className="space-y-6">
        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-lg p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Area Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart & Filter Area Skeleton */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Filter Section Skeleton */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-5 shadow-sm border border-zinc-200 dark:border-zinc-800">
              <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-4"></div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                  <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                  <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="h-10 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
                </div>
              </div>
            </div>

            {/* Chart Box Skeleton */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
              <div className="h-6 w-40 bg-zinc-200 dark:bg-zinc-800 rounded mb-4"></div>
              <div className="h-[300px] w-full bg-zinc-200 dark:bg-zinc-800/50 rounded flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
              </div>
            </div>
          </div>

          {/* Top Products Skeleton */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded bg-zinc-200 dark:bg-zinc-800"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                    <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                  </div>
                  <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Orders Skeleton */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <div className="h-6 w-40 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          </div>
          <div className="space-y-4">
            <div className="h-8 w-full bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 w-full bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
