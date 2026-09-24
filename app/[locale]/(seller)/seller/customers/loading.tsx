import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="p-6 w-full animate-pulse">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
        <div className="space-y-2">
          <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          <div className="h-4 w-72 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="space-y-6 mt-4">
          <div className="h-8 w-full bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 w-full">
              <div className="h-4 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
              <div className="h-4 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
              <div className="h-4 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
              <div className="h-4 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
