"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";;
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Package, User, MapPin, Truck, CheckCircle, XCircle, Clock, FileText, Banknote } from "lucide-react";
import { updateReturnStatus } from "@/app/actions/returns";


export default function ReturnDetailClient({ returnDetails }: { returnDetails: any }) {
    const locale = useLocale();
  const t = useTranslations("SellerReturnDetail");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const tAlerts = useTranslations("Alerts");

  const handleUpdateStatus = async (newStatus: "APPROVED" | "REJECTED" | "COMPLETED") => {
    let confirmMsg = "";
    if (newStatus === "APPROVED") confirmMsg = tAlerts("confirmApproveReturn");
    if (newStatus === "REJECTED") confirmMsg = tAlerts("confirmRejectReturn");
    if (newStatus === "COMPLETED") confirmMsg = tAlerts("confirmCompleteReturn");

    if (confirm(confirmMsg)) {
      startTransition(async () => {
        const res = await updateReturnStatus(returnDetails.id, newStatus);
        if (res.success) {
          alert(tAlerts("statusChanged"));
          router.refresh();
        } else {
          alert(tAlerts("statusChangeFailed") + res.error);
        }
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20"><Clock className="w-4 h-4" /> {t("statusPending")}</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20"><CheckCircle className="w-4 h-4" /> {t("statusApproved")}</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"><XCircle className="w-4 h-4" /> {t("statusRejected")}</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/20"><CheckCircle className="w-4 h-4" /> {t("statusCompleted")}</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-zinc-50 text-zinc-700 ring-1 ring-inset ring-zinc-600/20">{status}</span>;
    }
  };

  const { orderItem } = returnDetails;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/seller/returns`}
          className="p-2 -ml-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t("title")}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            ID: <span className="font-mono text-zinc-700 dark:text-zinc-300">{returnDetails.id}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Product Details */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-zinc-500" />
                {t("productReturned")}
              </h2>
            </div>
            <div className="p-5 flex flex-col sm:flex-row gap-4">
              <div className="relative w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden shrink-0">
                {orderItem.product.images?.[0] ? (
                  <Image
                    src={orderItem.product.images[0]}
                    alt={orderItem.product.name}
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
                    {orderItem.product.name}
                  </h3>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                    {formatCurrency(orderItem.price)} <span className="mx-1">×</span> {orderItem.quantity}
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 text-right sm:min-w-[200px]">
                  <div className="text-sm text-zinc-500 mb-2 font-medium">{t("totalRefund")}</div>
                  <div className="flex flex-col text-sm text-zinc-600 dark:text-zinc-400 gap-1 mb-2">
                    <div className="flex justify-between gap-4">
                      <span>{t("productPrice")}</span>
                      <span>{formatCurrency(orderItem.price * orderItem.quantity)}</span>
                    </div>
                    {returnDetails.shippingCost != null ? (
                      <div className="flex justify-between gap-4">
                        <span>{t("shippingCostLabel")} ({returnDetails.shippingCourier?.toUpperCase() || "-"}):</span>
                        <span>{formatCurrency(returnDetails.shippingCost)}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="font-bold text-orange-600 dark:text-orange-500 text-lg border-t border-zinc-200 dark:border-zinc-700 pt-2 flex justify-between gap-4">
                    <span>{t("total")}</span>
                    <span>{formatCurrency((orderItem.price * orderItem.quantity) + (returnDetails.shippingCost || 0))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Return Info */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> {t("reasonLabel")}
              </h3>
              <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-line bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800">
                {returnDetails.reason}
              </p>
            </div>

            {returnDetails.images && returnDetails.images.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                  {t("photoVideoEvidence")}
                </h3>
                <div className="flex flex-wrap gap-4">
                  {returnDetails.images.map((img: string, i: number) => (
                    <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="relative w-32 h-32 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:opacity-90 transition-opacity">
                      <Image src={img} alt={`{t("evidenceImage", { index: i + 1 })}`} fill className="object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Status & Actions */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
              {t("returnStatus")}
            </h3>
            <div className="mb-6">
              {getStatusBadge(returnDetails.status)}
            </div>

            {returnDetails.status === 'PENDING' && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleUpdateStatus('APPROVED')}
                  disabled={isPending}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                >{t("approveReturn")}</button>
                <button
                  onClick={() => handleUpdateStatus('REJECTED')}
                  disabled={isPending}
                  className="w-full py-2.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 font-medium rounded-lg transition-colors border border-red-200 dark:border-red-900/50"
                >{t("rejectReturn")}</button>
              </div>
            )}
            
            {returnDetails.status === 'APPROVED' && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-zinc-500 mb-2">{t("refundSentQuestion")}</p>
                <button
                  onClick={() => handleUpdateStatus('COMPLETED')}
                  disabled={isPending}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                >{t("markCompleted")}</button>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500">
              {t("createdAtLabel")} {new Date(returnDetails.createdAt).toLocaleString("id-ID")}
            </div>
          </div>

          {/* Refund Info */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Banknote className="w-4 h-4" /> {t("refundMethod")}
            </h3>
            <div className="text-sm">
              <p className="text-zinc-500 mb-1">{t("destinationAccount")}</p>
              <p className="font-medium text-zinc-900 dark:text-zinc-100 whitespace-pre-line p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                {returnDetails.refundAccount}
              </p>
            </div>
          </div>

          {/* Buyer Info */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> {t("buyerInfo")}</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-zinc-500">{t("name")}</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{orderItem.order.user.name}</p>
              </div>
              <div>
                <p className="text-zinc-500">{t("email")}</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100 break-all">{orderItem.order.user.email}</p>
              </div>
              {orderItem.order.user.buyerProfile?.phone && (
                <div>
                  <p className="text-zinc-500">{t("phone")}</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{orderItem.order.user.buyerProfile.phone}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Warehouse Info */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {t("returnWarehouseInfo")}
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{orderItem.shipment?.warehouse?.warehouseName}</p>
              </div>
              <div>
                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
                  {orderItem.shipment?.warehouse?.streetAddress}{"\n"}
                  {orderItem.shipment?.warehouse?.district}, {orderItem.shipment?.warehouse?.city}{"\n"}
                  {orderItem.shipment?.warehouse?.province} {orderItem.shipment?.warehouse?.postcode}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
