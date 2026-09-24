"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";;
import Link from "next/link";
import { getSellerOrders } from "@/app/actions/orders";
import {
  Package,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  Clock,
  Truck,
  XCircle
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function OrdersClient({ initialShipments, warehouses, role }: any) {
  const t = useTranslations("SellerOrders");
  const tMetadata = useTranslations("Metadata");
  const router = useRouter();

  const [shipments, setShipments] = useState(initialShipments);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const pageSize = 20;

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const res = await getSellerOrders(search);
      if (res.success) {
        setShipments(res.data);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, warehouseFilter]);

  const filteredShipments = shipments.filter((shipment: any) => {
    let match = true;
    if (statusFilter !== "ALL" && shipment.status !== statusFilter) match = false;
    if (role === "SELLER" && warehouseFilter !== "ALL" && shipment.warehouseId !== warehouseFilter) match = false;
    return match;
  });

  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / pageSize));
  const paginatedShipments = filteredShipments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'PAID': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'SHIPPED': return <Truck className="w-4 h-4 text-blue-500" />;
      case 'DELIVERED': return <CheckCircle className="w-4 h-4 text-teal-500" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Package className="w-4 h-4 text-zinc-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'PENDING': return `${baseClasses} bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20`;
      case 'PAID': return `${baseClasses} bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20`;
      case 'SHIPPED': return `${baseClasses} bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20`;
      case 'DELIVERED': return `${baseClasses} bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-400 dark:ring-teal-500/20`;
      case 'CANCELLED': return `${baseClasses} bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20`;
      default: return `${baseClasses} bg-zinc-50 text-zinc-700 ring-1 ring-inset ring-zinc-600/20 dark:bg-zinc-500/10 dark:text-zinc-400 dark:ring-zinc-500/20`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{tMetadata("sellerOrders")}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t("description")}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isSearching ? "..." : t("btnSearch")}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {role === "SELLER" && (
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">{t("allWarehouses")}</option>
              {warehouses.map((w: any) => (
                <option key={w.id} value={w.id}>{w.warehouseName}</option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="ALL">{t("allStatuses")}</option>
            <option value="PENDING">{t("statusPending")}</option>
            <option value="PAID">{t("statusPaid")}</option>
            <option value="SHIPPED">{t("statusShipped")}</option>
            <option value="DELIVERED">{t("statusDelivered")}</option>
            <option value="CANCELLED">{t("statusCancelled")}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-zinc-500 dark:text-zinc-400">
            <thead className="text-xs text-zinc-700 uppercase bg-zinc-50 dark:bg-zinc-800/50 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">{t("thIdDate")}</th>
                <th scope="col" className="px-6 py-4 font-semibold">{t("thCustomer")}</th>
                <th scope="col" className="px-6 py-4 font-semibold">{t("thWarehouse")}</th>
                <th scope="col" className="px-6 py-4 font-semibold">{t("thTotalValue")}</th>
                <th scope="col" className="px-6 py-4 font-semibold">{t("thStatus")}</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">{t("thAction")}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedShipments.length > 0 ? (
                paginatedShipments.map((shipment: any) => {
                  const subtotal = shipment.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
                  const total = subtotal + shipment.shippingCost;

                  return (
                    <tr key={shipment.id} className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          <Package className="w-4 h-4 text-zinc-400" />
                          {shipment.id.substring(0, 8).toUpperCase()}
                        </div>
                        <div className="text-xs mt-1 text-zinc-400">
                          {new Date(shipment.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">{shipment.order.user.name}</div>
                        <div className="text-xs text-zinc-500">{shipment.order.user.email}</div>
                      </td>
                      <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                        {shipment.warehouse.warehouseName}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">{formatCurrency(total)}</div>
                        <div className="text-xs text-zinc-500">{t("totalItems", { count: shipment.items.length })}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={getStatusBadge(shipment.status)}>
                          {getStatusIcon(shipment.status)}
                          {t(`status${shipment.status.charAt(0) + shipment.status.slice(1).toLowerCase()}` as any)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/seller/orders/${shipment.id}`} className="text-orange-600 dark:text-orange-400 hover:underline font-medium text-sm p-1 inline-block">
                          {t("btnDetail")}
                        </Link>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    {t("noOrdersFound")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-zinc-900 px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("page")} <span className="font-medium text-zinc-900 dark:text-zinc-100">{currentPage}</span> {t("of")} <span className="font-medium text-zinc-900 dark:text-zinc-100">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t("prev")}
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t("next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
