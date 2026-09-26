"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";;
import {
  ArrowLeft,
  Edit2,
  Archive,
  ExternalLink,
  Copy,
  Check,
  Package,
  Warehouse as WarehouseIcon,
  Tag,
  Calendar,
  Layers,
  MapPin,
  FileText,
  Building2,
  CheckCircle2,
  Toolbox,
  Lock,
  Star,
  Sparkles,
  Info,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import ProductImageCarousel from "./product-image-carousel";
import SoftDeleteModal from "@/app/components/ui/table/soft-delete-modal";
import { archiveProduct } from "@/app/actions/products";
import { toast } from "@/components/ui/toast";
import { translateServerMessage } from "@/lib/utils";

interface StockWithWarehouse {
  id: string;
  qty: number;
  warehouse: {
    id: string;
    warehouseName: string;
    city: string;
    province: string;
    isMain: boolean;
    streetAddress?: string;
  };
}

interface SellerProductDetailViewProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    weight: number | null;
    images: string[];
    isFeatured: boolean;
    status: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    category?: {
      id: string;
      name: string;
      slug: string;
    } | null;
    storeProfile?: {
      id: string;
      storeName: string;
      logoUrl?: string | null;
    } | null;
    stocks?: StockWithWarehouse[];
  };
}

export default function SellerProductDetailView({
  product,
}: SellerProductDetailViewProps) {
    const locale = useLocale();
  const t = useTranslations("SellerProductDetail");
  const tValidation = useTranslations();
  const router = useRouter();

  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isCopiedId, setIsCopiedId] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);

  // Calculate total stock
  const totalStock = (product.stocks || []).reduce(
    (acc, curr) => acc + (curr.qty || 0),
    0
  );

  const connectedWarehousesCount = (product.stocks || []).length;

  const handleCopyId = () => {
    navigator.clipboard.writeText(product.id);
    setIsCopiedId(true);
    toast.add({
      type: "success",
      title: "ID Produk Disalin",
      description: product.id,
    });
    setTimeout(() => setIsCopiedId(false), 2000);
  };

  const handleCopyLink = () => {
    const publicUrl = `${window.location.origin}/products/${product.id}`;
    navigator.clipboard.writeText(publicUrl);
    setIsCopiedLink(true);
    toast.add({
      type: "success",
      title: t("linkCopied"),
    });
    setTimeout(() => setIsCopiedLink(false), 2000);
  };

  const handleExecuteArchive = async (id: string) => {
    const res = await archiveProduct(id);
    if (res.success) {
      setIsArchiveModalOpen(false);
      toast.add({
        type: "success",
        title: translateServerMessage(res.msg, tValidation),
      });
      router.push(`/${locale}/seller/products`);
    } else {
      setIsArchiveModalOpen(false);
      toast.add({
        type: "error",
        title: translateServerMessage(res.msg, tValidation),
        priority: "high",
      });
    }
  };

  // Status Badge Helper
  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case "ACTIVE":
        return {
          label: "Aktif",
          style: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        };
      case "ARCHIVED":
        return {
          label: "Arsip",
          style: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
          icon: <Archive className="h-3.5 w-3.5" />,
        };
      case "BLOCKED":
        return {
          label: "Terblokir",
          style: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-900/50",
          icon: <Lock className="h-3.5 w-3.5" />,
        };
      default:
        return {
          label: "Draft",
          style: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
          icon: <Toolbox className="h-3.5 w-3.5" />,
        };
    }
  };

  const statusBadge = getStatusBadge(product.status);

  const formatDate = (dateInput: Date | string) => {
    try {
      const d = new Date(dateInput);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch (e) {
      return String(dateInput);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* BREADCRUMBS & TOP NAV BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation & Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Link
              href={`/${locale}/seller/products`}
              className="hover:text-orange-500 transition-colors font-medium"
            >
              {t("breadcrumbProducts")}
            </Link>
            <span>/</span>
            <span className="text-zinc-900 dark:text-zinc-200 font-semibold truncate max-w-[200px] sm:max-w-[300px]">
              {product.name}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-3">
            {product.name}
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/${locale}/seller/products`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t("backToProducts")}</span>
          </Link>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shadow-xs cursor-pointer"
            title={t("copyLink")}
          >
            {isCopiedLink ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {isCopiedLink ? t("copied") : t("copyLink")}
            </span>
          </button>

          <Link
            href={`/products/${product.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shadow-xs"
          >
            <ExternalLink className="h-4 w-4" />
            <span>{t("viewInStore")}</span>
          </Link>

          <Link
            href={`/seller/products/edit/${product.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-md active:scale-95"
          >
            <Edit2 className="h-4 w-4" />
            <span>{t("editProduct")}</span>
          </Link>

          {product.status !== "ARCHIVED" && (
            <button
              onClick={() => setIsArchiveModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all cursor-pointer"
            >
              <Archive className="h-4 w-4" />
              <span className="hidden sm:inline">{t("archiveProduct")}</span>
            </button>
          )}
        </div>
      </div>

      {/* QUICK SELLER STATS CARDS (GRID 4 COLS) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Price */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-semibold">{t("statsPrice")}</span>
            <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-500">
              <Tag className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
            Rp {product.price.toLocaleString("id-ID")}
          </p>
        </div>

        {/* Stat 2: Total Stock */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-semibold">{t("statsTotalStock")}</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-500">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {totalStock}
            </p>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {t("unit")}
            </span>
          </div>
        </div>

        {/* Stat 3: Warehouses */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-semibold">{t("statsWarehouses")}</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-500">
              <WarehouseIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {connectedWarehousesCount}
            </p>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {t("warehouses")}
            </span>
          </div>
        </div>

        {/* Stat 4: Status */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-semibold">{t("statsStatus")}</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${statusBadge.style}`}
            >
              {statusBadge.icon}
              {statusBadge.label}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN RESPONSIVE DETAIL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT COLUMN: CAROUSEL & METADATA CARD (5 COLS ON LG) */}
        <div className="lg:col-span-5 space-y-6">
          {/* CAROUSEL COMPONENT */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xs">
            <ProductImageCarousel
              images={product.images}
              productName={product.name}
              status={product.status}
              isFeatured={product.isFeatured}
            />
          </div>

          {/* SYSTEM METADATA CARD */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xs">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Info className="h-4 w-4 text-orange-500" />
              {t("sectionSpecifications")}
            </h3>

            <div className="space-y-3 text-xs divide-y divide-zinc-100 dark:divide-zinc-800">
              {/* Product ID / SKU */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                  {t("skuId")}
                </span>
                <div className="flex items-center gap-1.5 font-mono text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
                  <span className="truncate max-w-[140px]">{product.id}</span>
                  <button
                    onClick={handleCopyId}
                    className="hover:text-orange-500 transition-colors cursor-pointer"
                    title={t("copy")}
                  >
                    {isCopiedId ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Slug URL */}
              <div className="pt-3 flex items-center justify-between gap-2">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                  {t("slug")}
                </span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200 truncate max-w-[180px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                  /{product.slug}
                </span>
              </div>

              {/* Created Date */}
              <div className="pt-3 flex items-center justify-between gap-2">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                  {t("createdDate")}
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {formatDate(product.createdAt)}
                </span>
              </div>

              {/* Updated Date */}
              <div className="pt-3 flex items-center justify-between gap-2">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                  {t("updatedDate")}
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {formatDate(product.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: WAREHOUSE STOCKS, SPECS & DESCRIPTION (7 COLS ON LG) */}
        <div className="lg:col-span-7 space-y-6">
          {/* PRODUCT OVERVIEW & CATEGORY CARD */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              {product.category && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50">
                  {product.category.name}
                </span>
              )}
              {product.weight && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {product.weight} {t("grams")}
                </span>
              )}
              {product.isFeatured && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-500" />
                  {t("featured")}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {product.name}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Managed by {product.storeProfile?.storeName || "Store"}
              </p>
            </div>

            <div className="pt-2 flex items-baseline gap-3">
              <span className="text-3xl font-black text-orange-600 dark:text-orange-400">
                Rp {product.price.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* MULTI-WAREHOUSE STOCK BREAKDOWN TABLE CARD */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <WarehouseIcon className="h-5 w-5 text-orange-500" />
                {t("sectionInventory")}
              </h3>
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 px-3 py-1 rounded-xl">
                Total: {totalStock} {t("unit")}
              </span>
            </div>

            {product.stocks && product.stocks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold">
                      <th className="pb-3 pr-4">{t("warehouseName")}</th>
                      <th className="pb-3 px-4">{t("warehouseLocation")}</th>
                      <th className="pb-3 px-4 text-center">Tipe</th>
                      <th className="pb-3 pl-4 text-right">{t("stockQty")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {product.stocks.map((stk) => {
                      const percentage =
                        totalStock > 0
                          ? Math.round((stk.qty / totalStock) * 100)
                          : 0;

                      return (
                        <tr
                          key={stk.id}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          {/* Warehouse Name */}
                          <td className="py-3.5 pr-4 font-semibold text-zinc-900 dark:text-zinc-100">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                              <span>
                                {stk.warehouse?.warehouseName || "Gudang"}
                              </span>
                            </div>
                          </td>

                          {/* Location */}
                          <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                              <span className="truncate max-w-[160px]">
                                {stk.warehouse?.city}, {stk.warehouse?.province}
                              </span>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="py-3.5 px-4 text-center">
                            {stk.warehouse?.isMain ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                {t("mainWarehouse")}
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                {t("branchWarehouse")}
                              </span>
                            )}
                          </td>

                          {/* Qty & Percentage Bar */}
                          <td className="py-3.5 pl-4 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">
                                {stk.qty}{" "}
                                <span className="text-xs font-normal text-zinc-500">
                                  {t("unit")}
                                </span>
                              </span>
                              <div className="w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-orange-500 h-1.5 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 text-center space-y-1">
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Belum ada gudang terhubung
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-500">
                  Tambahkan stok gudang pada halaman edit produk.
                </p>
              </div>
            )}
          </div>

          {/* DESCRIPTION CARD */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 space-y-3 shadow-xs">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-500" />
              {t("sectionDescription")}
            </h3>
            {product.description && product.description.trim() !== "" ? (
              <div className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-50/50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                {product.description}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic">
                {t("noDescription")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SOFT DELETE ARCHIVE CONFIRMATION MODAL */}
      <SoftDeleteModal
        id={product.id}
        isOpen={isArchiveModalOpen}
        setIsOpen={setIsArchiveModalOpen}
        onArchived={handleExecuteArchive}
      />
    </div>
  );
}
