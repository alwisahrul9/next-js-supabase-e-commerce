"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Search, Inbox } from "lucide-react";
import { useTranslations } from "next-intl";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  // Handler pencarian baru (menerima query saat disubmit)
  onSearchSubmit: (query: string) => void;
  initialSearchQuery?: string;
}

export default function DataTable<T>({
  columns,
  data,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onSearchSubmit,
  initialSearchQuery = "",
}: DataTableProps<T>) {
  const t = useTranslations("Table");

  // State lokal untuk menampung ketikan user sebelum disubmit
  const [localQuery, setLocalQuery] = useState(initialSearchQuery);

  const startEntry = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, totalItems);

  // Fungsi untuk memicu pencarian
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(localQuery);
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Bar Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-zinc-900 dark:text-zinc-100"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl transition-all active:scale-95"
        >
          {t("searchPlaceholder").replace("...", "")}{" "}
          {/* Menampilkan kata "Cari" / "Search" */}
        </button>
      </form>

      {/* Table */}
      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm">
        <table className="w-full border-collapse text-left text-sm text-zinc-600 dark:text-zinc-300">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 font-semibold">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`p-4 font-medium ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.length > 0 ? (
              data.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`p-4 align-middle ${col.className || ""}`}
                    >
                      {col.render
                        ? col.render(row)
                        : col.accessorKey
                          ? (row[col.accessorKey] as React.ReactNode)
                          : null}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                    <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
                      {t("noData")}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("showing")}{" "}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {startEntry}
            </span>{" "}
            {t("to")}{" "}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {endEntry}
            </span>{" "}
            {t("of")}{" "}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {totalItems}
            </span>{" "}
            {t("entries")}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-50 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-50 disabled:hover:bg-transparent transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
