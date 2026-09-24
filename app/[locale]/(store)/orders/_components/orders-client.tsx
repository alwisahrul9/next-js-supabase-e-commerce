"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Package, MapPin, Truck, ChevronDown, ChevronUp, CreditCard, CheckCircle2, RotateCcw } from "lucide-react";
import ReturnOrderModal from "./ReturnOrderModal";
import ReviewModal from "./ReviewModal";

export default function OrdersClient({ initialOrders, defaultAddress }: { initialOrders: any[], defaultAddress?: any }) {
  const t = useTranslations("Orders");
  const tAlerts = useTranslations("Alerts");
  const [orders] = useState(initialOrders);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [snapLoaded, setSnapLoaded] = useState(false);
  const [returnModalItem, setReturnModalItem] = useState<any | null>(null);
  const [reviewModalOrder, setReviewModalOrder] = useState<any | null>(null);

  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

  useEffect(() => {
    // Load Midtrans Snap Script
    const snapScriptUrl =
      process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?.startsWith("SB-")
        ? "https://app.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js";

    const script = document.createElement("script");
    script.src = snapScriptUrl;
    script.setAttribute("data-client-key", clientKey || "");
    script.onload = () => {
      setSnapLoaded(true);
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [clientKey]);

  const toggleOrder = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  const handlePay = (paymentToken: string) => {
    if (!snapLoaded || !(window as any).snap || !paymentToken) {
      alert(tAlerts("paymentNotReady"));
      return;
    }

    // @ts-ignore
    window.snap.pay(paymentToken, {
      onSuccess: function () {
        window.location.reload();
      },
      onPending: function () {
        window.location.reload();
      },
      onError: function () {
        alert(tAlerts("paymentFailed"));
      },
      onClose: function () {
        // user closed popup
      }
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "PAID": return "bg-green-100 text-green-800 border-green-200";
      case "SHIPPED": return "bg-blue-100 text-blue-800 border-blue-200";
      case "COMPLETED": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "RETURN_REQUESTED": return "bg-orange-100 text-orange-800 border-orange-200";
      case "RETURNED": return "bg-gray-200 text-gray-800 border-gray-300";
      case "CANCELLED": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const isWithinReturnWindow = (dateString: string) => {
    const updatedAt = new Date(dateString);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    return updatedAt >= twoDaysAgo;
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-zinc-200">
        <Package className="mx-auto h-16 w-16 text-zinc-300 mb-4" />
        <h2 className="text-xl font-medium text-zinc-900 mb-2">{t("noOrders")}</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 mb-8">{t("title")}</h1>
      
      {orders.map((order) => {
        const isExpanded = expandedOrder === order.id;
        
        return (
          <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden transition-all">
            {/* Header / Summary */}
            <div 
              className="p-6 cursor-pointer hover:bg-zinc-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              onClick={() => toggleOrder(order.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-zinc-900 text-lg">
                    {t("orderId")}: <span className="font-mono text-zinc-600">#{order.id.substring(order.id.length - 8).toUpperCase()}</span>
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {t(`status_${order.status}` as any) || order.status}
                  </span>
                </div>
                <div className="text-sm text-zinc-500">
                  {t("date")}: {formatDate(order.createdAt)}
                </div>
              </div>
              
              <div className="flex items-center gap-6 justify-between md:justify-end">
                <div className="text-right">
                  <div className="text-sm text-zinc-500 mb-1">{t("total")}</div>
                  <div className="font-bold text-xl text-zinc-900">{formatCurrency(order.totalAmount)}</div>
                </div>
                <div className="flex items-center gap-4">
                  {order.status === "PENDING" && order.paymentToken && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePay(order.paymentToken);
                      }}
                      className="px-6 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      {t("payNow")}
                    </button>
                  )}
                  <div className="text-zinc-400 bg-zinc-100 p-2 rounded-full">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Details (Expanded state) */}
            {isExpanded && (
              <div className="border-t border-zinc-100 bg-zinc-50/50 p-6 space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
                {order.shipments?.map((shipment: any, index: number) => {
                  const shipmentSubtotal = shipment.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
                  const shipmentTotal = shipmentSubtotal + shipment.shippingCost;

                  return (
                    <div key={shipment.id} className={index > 0 ? "pt-8 mt-8 border-t border-zinc-200" : ""}>
                      <h3 className="font-medium text-zinc-900 mb-4 flex items-center flex-wrap gap-2">
                        <Package className="w-5 h-5 text-zinc-500" />
                        {t("package")} {index + 1}
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ml-2 ${getStatusColor(shipment.status)}`}>
                          {t(`status_${shipment.status}` as any) || shipment.status}
                        </span>
                        <span className="text-sm font-normal text-zinc-500 ml-auto w-full sm:w-auto mt-2 sm:mt-0">
                          {t("trackingNumber")}: {shipment.trackingNumber || t("trackingNumberNotAvailable")}
                        </span>
                      </h3>
                      
                      {/* Products in this shipment */}
                      <div className="space-y-4 mb-6">
                        {shipment.items?.map((item: any) => (
                          <div key={item.id} className="flex gap-4 p-4 bg-white rounded-xl border border-zinc-100 shadow-sm">
                            <div className="h-16 w-16 relative rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                              {item.product.images?.[0] ? (
                                <Image
                                  src={item.product.images[0]}
                                  alt={item.product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full w-full text-zinc-400">
                                  <Package className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                              <h4 className="font-medium text-zinc-900 mb-1">{item.product.name}</h4>
                              {item.size && item.size !== "ALL" && (
                                <p className="text-xs text-zinc-500 mb-2">{t("variant")} {item.size}</p>
                              )}
                              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-600">
                                <div>{formatCurrency(item.price)} x {item.quantity}</div>
                                <div className="font-medium text-black ml-auto">{formatCurrency(item.price * item.quantity)}</div>
                              </div>
                              {order.status === "DELIVERED" && isWithinReturnWindow(order.updatedAt) && (
                                <div className="mt-3 flex justify-end gap-2 flex-wrap">
                                  {!item.orderReturn ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReturnModalItem({ ...item, shipment, order });
                                      }}
                                      className="px-4 py-1.5 bg-white border border-zinc-200 text-zinc-700 text-xs font-medium rounded-lg hover:bg-zinc-50 transition-colors flex items-center gap-1.5 shadow-sm"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />{t("returnItem")}</button>
                                  ) : (
                                    <>
                                      <span className="px-3 py-1.5 bg-orange-50 text-orange-600 text-xs font-medium rounded-lg border border-orange-100 flex items-center gap-1.5">
                                        {t("returnStatus")} {item.orderReturn.status}
                                      </span>
                                      {item.orderReturn.status === "PENDING" && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setReturnModalItem({ ...item, shipment, order });
                                          }}
                                          className="px-4 py-1.5 bg-white border border-zinc-200 text-zinc-700 text-xs font-medium rounded-lg hover:bg-zinc-50 transition-colors flex items-center gap-1.5 shadow-sm"
                                        >
                                          <RotateCcw className="w-3.5 h-3.5" />{t("editReturn")}</button>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Warehouse Origin */}
                        {shipment.warehouse && (
                          <div className="bg-white p-5 rounded-xl border border-zinc-100 shadow-sm">
                            <h4 className="font-medium text-zinc-900 mb-3 flex items-center gap-2">
                              <Truck className="w-5 h-5 text-zinc-500" />
                              {t("warehouseOrigin")}
                            </h4>
                            <div className="text-sm text-zinc-600">
                              <p className="font-medium text-zinc-900 mb-1">{shipment.warehouse.warehouseName}</p>
                              <p>{shipment.warehouse.city}, {shipment.warehouse.province}</p>
                              <p className="mt-2 text-zinc-500">
                                {t("courierLabel")} {shipment.shippingCourier ? `${shipment.shippingCourier.toUpperCase()} ${shipment.shippingService ? `(${shipment.shippingService})` : ""}` : "-"}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Package Price Calculation */}
                        <div className="bg-white p-5 rounded-xl border border-zinc-100 shadow-sm flex flex-col justify-center">
                          <h4 className="font-medium text-zinc-900 mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-zinc-500" />
                            {t("packageDetails")} {index + 1}
                          </h4>
                          <div className="text-sm text-zinc-600 space-y-3">
                            <div className="flex justify-between items-center">
                              <span>{t("productSubtotal")}</span>
                              <span className="font-medium text-zinc-900">
                                {formatCurrency(shipmentSubtotal)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>{t("packageShippingCost")}</span>
                              <span className="font-medium text-zinc-900">
                                {formatCurrency(shipment.shippingCost)}
                              </span>
                            </div>
                            <div className="pt-3 mt-1 border-t border-zinc-100 flex justify-between items-center">
                              <span className="font-medium text-zinc-900">{t("packageTotal")}</span>
                              <span className="font-bold text-orange-600">
                                {formatCurrency(shipmentTotal)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Global order payment summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 border-t border-zinc-200 pt-8">
                  {/* Shipping Address */}
                  <div className="bg-white p-5 rounded-xl border border-zinc-100 shadow-sm">
                    <h3 className="font-medium text-zinc-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-zinc-500" />
                      {t("shippingAddress")}
                    </h3>
                    <div className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">
                      {order.shippingAddress}
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200 shadow-sm">
                    <h3 className="font-medium text-zinc-900 mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-zinc-500" />
                      {t("paymentSummary")}
                    </h3>
                    <div className="text-sm text-zinc-600 space-y-3">
                      <div className="flex justify-between items-center">
                        <span>{t("totalProducts")}</span>
                        <span className="font-medium text-zinc-900">
                          {formatCurrency(order.totalAmount - (order.shippingCost || 0))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>{t("totalShipping")}</span>
                        <span className="font-medium text-zinc-900">
                          {formatCurrency(order.shippingCost || 0)}
                        </span>
                      </div>
                      <div className="pt-4 mt-2 border-t border-zinc-200 flex justify-between items-center">
                        <span className="font-medium text-zinc-900 text-base">{t("finalTotal")}</span>
                        <span className="font-bold text-black text-xl">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {order.status === "DELIVERED" && isWithinReturnWindow(order.updatedAt) && (
                  <div className="mt-8 border-t border-zinc-200 pt-6 flex gap-4 justify-end">
                    <button
                      onClick={() => setReviewModalOrder(order)}
                      className="px-6 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />{t("completeOrder")}</button>
                  </div>
                )}

              </div>
            )}
          </div>
        );
      })}

      <ReturnOrderModal
        isOpen={!!returnModalItem}
        orderItem={returnModalItem}
        defaultAddress={defaultAddress}
        onClose={() => setReturnModalItem(null)}
        onSuccess={() => window.location.reload()}
      />
      <ReviewModal
        isOpen={!!reviewModalOrder}
        order={reviewModalOrder}
        onClose={() => setReviewModalOrder(null)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
