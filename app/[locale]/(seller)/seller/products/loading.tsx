import React from "react";

export default function ProductsLoading() {
  // Membuat array buatan berisi 5 elemen untuk mensimulasikan 5 baris tabel data kosong
  const skeletonRows = Array.from({ length: 5 });

  return (
    <div className="space-y-6 animate-pulse">
      {/* ================= SKELETON HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          {/* Title Skeleton */}
          <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          {/* Subtitle Skeleton */}
          <div className="h-4 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        </div>
        {/* Button Tambah Produk Skeleton */}
        <div className="h-10 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
      </div>

      {/* ================= SKELETON SEARCH BAR ================= */}
      <div className="flex gap-2 max-w-md">
        <div className="h-9 flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        <div className="h-9 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
      </div>

      {/* ================= SKELETON DATA TABLE ================= */}
      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm">
        <table className="w-full border-collapse text-left">
          {/* Header Tabel */}
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="p-4 w-20">
                <div className="h-4 w-10 bg-zinc-200 dark:bg-zinc-700 rounded" />
              </th>
              <th className="p-4">
                <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-700 rounded" />
              </th>
              <th className="p-4">
                <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-700 rounded" />
              </th>
              <th className="p-4 w-24 text-right">
                <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-700 ml-auto rounded" />
              </th>
            </tr>
          </thead>

          {/* Baris Konten Dummy */}
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {skeletonRows.map((_, idx) => (
              <tr key={idx}>
                {/* Kolom Gambar */}
                <td className="p-4 align-middle">
                  <div className="h-12 w-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                </td>
                {/* Kolom Nama */}
                <td className="p-4 align-middle">
                  <div className="h-4 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </td>
                {/* Kolom Harga */}
                <td className="p-4 align-middle">
                  <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </td>
                {/* Kolom Aksi */}
                <td className="p-4 align-middle">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                    <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= SKELETON PAGINATION ================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        {/* Info Teks Pagination */}
        <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        {/* Tombol Navigasi Kiri Kanan */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
