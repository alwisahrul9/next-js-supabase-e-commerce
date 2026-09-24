"use client";

import { useTranslations, useLocale } from "next-intl";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { useTransition } from "react";
import { useRouter } from "next/navigation";;
import { markShipmentAsShipped } from "@/app/actions/orders";
import {
  ArrowLeft,
  MapPin,
  User,
  Package,
  Truck,
  CalendarDays,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";

export default function OrderDetailClient({ shipment }: { shipment: any }) {
    const locale = useLocale();
  const t = useTranslations("SellerOrderDetail");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleMarkAsShipped = async () => {
    if (confirm(t("btnMarkShipped") + "?")) {
      startTransition(async () => {
        const res = await markShipmentAsShipped(shipment.id);
        if (res.success) {
          alert(t("markShippedSuccess"));
          router.refresh();
        } else {
          alert(t("markShippedError") + ": " + res.error);
        }
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'PAID': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'SHIPPED': return <Truck className="w-5 h-5 text-blue-500" />;
      case 'DELIVERED': return <CheckCircle className="w-5 h-5 text-teal-500" />;
      case 'CANCELLED': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Package className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium";
    switch (status) {
      case 'PENDING': return `${baseClasses} bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20`;
      case 'PAID': return `${baseClasses} bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20`;
      case 'SHIPPED': return `${baseClasses} bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20`;
      case 'DELIVERED': return `${baseClasses} bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-400 dark:ring-teal-500/20`;
      case 'CANCELLED': return `${baseClasses} bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20`;
      default: return `${baseClasses} bg-zinc-50 text-zinc-700 ring-1 ring-inset ring-zinc-600/20 dark:bg-zinc-500/10 dark:text-zinc-400 dark:ring-zinc-500/20`;
    }
  };

  const subtotal = shipment.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
  const total = subtotal + shipment.shippingCost;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/seller/orders`}
          className="p-2 -ml-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {t("title")}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t("id")}: <span className="font-mono text-zinc-700 dark:text-zinc-300">{shipment.id}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Product Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-zinc-500" />
                {t("productDetails")}
              </h2>
            </div>

            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {shipment.items.map((item: any) => (
                <div key={item.id} className="p-5 flex flex-col sm:flex-row gap-4">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product.images && item.product.images[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {item.product.weight} gr
                      </p>
                    </div>

                    <div className="flex items-end justify-between mt-4 sm:mt-0">
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        {formatCurrency(item.price)} <span className="mx-1">×</span> {item.quantity}
                      </div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-right">
                        <div>{formatCurrency(item.price * item.quantity)}</div>
                        {item.orderReturn && (
                          <div className="mt-1">
                            <Link
                              href={`/seller/returns/${item.orderReturn.id}`}
                              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:underline"
                            >
                              Status: {item.orderReturn.status === 'PENDING' ? t("returnPending") :
                                item.orderReturn.status === 'APPROVED' ? t("returnApproved") :
                                  item.orderReturn.status === 'REJECTED' ? t("returnRejected") : t("returnCompleted")}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Summaries & Info */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
              {t("status")}
            </h3>
            <div className="flex items-center justify-between">
              <span className={getStatusBadge(shipment.status)}>
                {getStatusIcon(shipment.status)}
                {t(`status${shipment.status.charAt(0) + shipment.status.slice(1).toLowerCase()}` as any)}
              </span>
              {shipment.status === "PAID" && (
                <button
                  onClick={handleMarkAsShipped}
                  disabled={isPending}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Truck className="w-4 h-4" />
                  {isPending ? "..." : t("btnMarkShipped")}
                </button>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
              <CalendarDays className="w-4 h-4 text-zinc-400" />
              {new Date(shipment.createdAt).toLocaleString()}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4" />
              {t("customerInfo")}
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">{t("name")}</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{shipment.order.user.name}</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">{t("email")}</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100 break-all">{shipment.order.user.email}</p>
              </div>
              {shipment.order.user.buyerProfile?.phone && (
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">{t("phone")}</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{shipment.order.user.buyerProfile.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {t("shippingAddress")}
            </h3>
            <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
              {shipment.order.shippingAddress}
            </div>
          </div>

          {/* Courier Info */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              {t("courierInfo")}
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">{t("warehouse")}</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{shipment.warehouse.warehouseName}</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">{t("courier")} / {t("service")}</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {shipment.shippingCourier?.toUpperCase()} - {shipment.shippingService}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">{t("trackingNumber")}</p>
                {shipment.trackingNumber ? (
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded inline-block mt-1">
                    {shipment.trackingNumber}
                  </p>
                ) : (
                  <p className="text-zinc-400 dark:text-zinc-500 italic mt-1">{t("noTracking")}</p>
                )}
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              {t("summary")}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>{t("subtotal")}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>{t("shippingCost")}</span>
                <span>{formatCurrency(shipment.shippingCost)}</span>
              </div>
              <div className="pt-3 mt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{t("total")}</span>
                <span className="text-lg font-bold text-orange-600 dark:text-orange-500">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
