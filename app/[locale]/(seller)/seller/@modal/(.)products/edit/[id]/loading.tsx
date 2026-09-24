import React from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Loading() {
  return (
    // defaultOpen dan open dipaksa true agar modal langsung mencuat ke layar saat loading
    <Dialog defaultOpen={true} open={true}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 pointer-events-none">
        {/* Header Skeleton */}
        <DialogHeader className="p-6 border-b border-zinc-100 dark:border-zinc-900">
          <div className="h-6 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </DialogHeader>

        {/* Form Content Skeleton */}
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6">
            {/* Nama & Slug */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-10 w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-10 w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
              </div>
            </div>

            {/* Kategori, Harga, & Berat */}
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                  <div className="h-10 w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
                </div>
              ))}
            </div>

            {/* Stok per Gudang */}
            <div className="space-y-3">
              <div className="h-4 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="grid grid-cols-2 gap-3 p-4 border rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                    <div className="h-9 w-24 bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Status & Featured */}
            <div className="flex gap-12 p-4 border rounded-xl border-zinc-100 dark:border-zinc-900 bg-transparent">
              <div className="space-y-3 flex-1">
                <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="flex gap-6">
                  <div className="h-5 w-16 bg-zinc-100 dark:bg-zinc-900 rounded animate-pulse" />
                  <div className="h-5 w-20 bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
                </div>
              </div>
              <div className="space-y-2 w-32">
                <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-6 w-12 bg-zinc-100 dark:bg-zinc-900 rounded-full animate-pulse" />
              </div>
            </div>

            {/* Deskripsi */}
            <div className="space-y-2">
              <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-24 w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
