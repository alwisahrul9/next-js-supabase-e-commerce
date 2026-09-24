"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils";
import { Search, Package, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getSellerReturns } from "@/app/actions/returns";

export default function ReturnsClient({ initialReturns, pagination: initialPagination }: { initialReturns: any[], pagination?: any }) {
  const t = useTranslations("SellerReturns");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [returns, setReturns] = useState(initialReturns);
  const [pagination, setPagination] = useState(initialPagination);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async (page: number, search: string, status: string) => {
    setIsLoading(true);
    try {
      const response = await getSellerReturns({ page, search, status, limit: 10 });
      if (response.success) {
        setReturns(response.returns || []);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch returns", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchData(1, searchTerm, statusFilter);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    fetchData(1, searchTerm, newStatus);
  };

  const handlePageChange = (newPage: number) => {
    if (!pagination) return;
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchData(newPage, searchTerm, statusFilter);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20"><Clock className="w-3.5 h-3.5" /> {t("statusPending")}</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20"><CheckCircle className="w-3.5 h-3.5" /> {t("statusApproved")}</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"><XCircle className="w-3.5 h-3.5" /> {t("statusRejected")}</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/20"><CheckCircle className="w-3.5 h-3.5" /> {t("statusCompleted")}</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-50 text-zinc-700 ring-1 ring-inset ring-zinc-600/20">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t("title")}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t("description")}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 flex">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium rounded-r-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            {t("search")}
          </button>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="ALL">{t("allStatuses")}</option>
          <option value="PENDING">{t("statusPending")}</option>
          <option value="APPROVED">{t("statusApproved")}</option>
          <option value="REJECTED">{t("statusRejected")}</option>
          <option value="COMPLETED">{t("statusCompleted")}</option>
        </select>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden relative min-h-[200px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-zinc-900/50 flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        )}
        
        {returns.length > 0 ? (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {returns.map((ret: any) => (
              <div key={ret.id} className="p-5 flex flex-col sm:flex-row gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="relative w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden shrink-0">
                  {ret.orderItem.product.images?.[0] ? (
                    <Image
                      src={ret.orderItem.product.images[0]}
                      alt={ret.orderItem.product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <Package className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <Link href={`/seller/returns/${ret.id}`} className="text-base font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1">
                        {ret.orderItem.product.name}
                      </Link>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>ID: <span className="font-mono">{ret.id}</span></span>
                        <span>{t("buyer", { name: ret.orderItem.order.user.name })}</span>
                        <span>{new Date(ret.createdAt).toLocaleDateString("id-ID")}</span>
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(ret.status)}
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded border border-zinc-100 dark:border-zinc-800">
                    <span className="font-medium">{t("reason")}</span> {ret.reason}
                  </div>
                </div>

                <div className="flex flex-col justify-end items-start sm:items-end gap-2 shrink-0 sm:w-32">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(ret.orderItem.price * ret.orderItem.quantity)}
                  </div>
                  <Link
                    href={`/seller/returns/${ret.id}`}
                    className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline"
                  >
                    {t("viewDetail")}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{t("noReturns")}</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
              {t("noReturnsFound")}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {t("pageInfo", { page: pagination.page, totalPages: pagination.totalPages })}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
