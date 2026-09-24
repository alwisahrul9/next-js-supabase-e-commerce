"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, ShoppingBag, Package, TrendingUp, Search, Filter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DashboardProps {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    productsSold: number;
  };
  chartData: {
    labels: string[];
    datasets: any[];
  };
  topProducts: {
    id: string;
    name: string;
    image: string;
    sold: number;
    revenue: number;
  }[];
  recentOrders: any[];
}

export default function DashboardClient({
  kpis,
  chartData,
  topProducts,
  recentOrders,
}: DashboardProps) {
    const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("SellerDashboard");

  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (startDate) params.set("startDate", startDate);
    else params.delete("startDate");

    if (endDate) params.set("endDate", endDate);
    else params.delete("endDate");

    router.push(`?${params.toString()}`);
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    const params = new URLSearchParams(searchParams);
    params.delete("startDate");
    params.delete("endDate");
    router.push(`?${params.toString()}`);
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { color: "#9ca3af" }, // text-gray-400
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "#374151" }, // text-gray-700
        ticks: { color: "#9ca3af" },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#9ca3af" },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{t("revenue")}</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(kpis.totalRevenue)}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{t("orders")}</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {kpis.totalOrders}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{t("pending")}</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {kpis.pendingOrders}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{t("sold")}</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {kpis.productsSold}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart & Filter Area */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-4 text-zinc-800 dark:text-zinc-200 font-medium">
              <Filter className="w-5 h-5" />
              <h2>{t("filterTitle")}</h2>
            </div>
            {/* Filter Section */}
            <form onSubmit={handleFilter} className="flex mb-8 flex-col sm:flex-row flex-wrap items-end gap-4 w-full">
              <div className="flex flex-col gap-1.5 w-full flex-1 min-w-[200px]">
                <label className="text-sm text-zinc-600 dark:text-zinc-400">{t("filterStart")}</label>
                <input
                  type="month"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-4 py-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 outline-none focus:border-orange-500 w-full"
                />
              </div>
              <div className="flex flex-col gap-1.5 w-full flex-1 min-w-[200px]">
                <label className="text-sm text-zinc-600 dark:text-zinc-400">{t("filterEnd")}</label>
                <input
                  type="month"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-4 py-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 outline-none focus:border-orange-500 w-full"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-end sm:ml-auto">
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-md flex items-center gap-2 transition-colors"
                >
                  <Search className="w-4 h-4" /> {t("apply")}
                </button>
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-md transition-colors"
                  >
                    {t("reset")}
                  </button>
                )}
              </div>
            </form>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">{t("chartTitle")}</h2>
            <div className="w-full overflow-x-auto">
              <div className="h-[300px] min-w-[600px] w-full">
                <Bar data={chartData} options={options} />
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">{t("topProductsTitle")}</h2>
          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-4">{t("noTopProducts")}</p>
            ) : (
              topProducts.map((prod, idx) => (
                <div key={prod.id} className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                    <Image src={prod.image || "/images/placeholder.png"} alt={prod.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{prod.name}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{prod.sold} {t("soldCount")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(prod.revenue)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t("recentOrdersTitle")}</h2>
          <Link href={`/${locale}/seller/orders`} className="text-sm text-orange-600 dark:text-orange-400 hover:underline">
            {t("viewAll")}
          </Link>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="pb-3 font-medium text-zinc-500 dark:text-zinc-400">{t("orderId")}</th>
                <th className="pb-3 font-medium text-zinc-500 dark:text-zinc-400">{t("product")}</th>
                <th className="pb-3 font-medium text-zinc-500 dark:text-zinc-400 text-right">{t("totalTransaction")}</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-zinc-500">
                    {t("noRecentOrders")}
                  </td>
                </tr>
              ) : (
                recentOrders.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
                    <td className="py-4 text-zinc-900 dark:text-zinc-100 font-mono text-xs">
                      #{item.orderId.substring(0, 8)}
                    </td>
                    <td className="py-4 text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8 rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                          <Image
                            src={item.product.images[0] || "/images/placeholder.png"}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="truncate max-w-[150px] block" title={item.product.name}>
                          {item.product.name} <span className="text-zinc-400">x{item.quantity}</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-right text-zinc-900 dark:text-zinc-100 font-bold">
                      {formatCurrency(item.order.totalAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
