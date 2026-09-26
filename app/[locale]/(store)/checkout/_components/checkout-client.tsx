"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { createMidtransTransaction } from "@/app/actions/checkout";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";;
import { calculateShippingCost } from "@/app/actions/shipping";

export default function CheckoutClient({
  items,
  defaultAddress,
  directBuyRequest,
  addressId
}: {
  items: any[],
  defaultAddress: any,
  directBuyRequest?: { productId: string, quantity: number, size?: string, warehouseId?: string },
  addressId?: string
}) {
    const locale = useLocale();
  const t = useTranslations("Checkout");
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);
  const [snapLoaded, setSnapLoaded] = useState(false);
  const [shippingOptionsByWarehouse, setShippingOptionsByWarehouse] = useState<{ [warehouseId: string]: any[] }>({});
  const [selectedShippingByWarehouse, setSelectedShippingByWarehouse] = useState<{ [warehouseId: string]: any }>({});
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);

  // Group items by warehouse
  const warehouseGroups = React.useMemo(() => {
    const groups: { [key: string]: { warehouse: any, weight: number, items: any[] } } = {};
    items.forEach(item => {
      const warehouseId = item.warehouseId;
      if (!warehouseId) return;
      const selectedWh = item.availableWarehouses?.find((w: any) => w.id === warehouseId);
      if (!selectedWh) return;

      if (!groups[warehouseId]) {
        groups[warehouseId] = { warehouse: selectedWh, weight: 0, items: [] };
      }
      groups[warehouseId].weight += (item.product.weight || 1000) * item.quantity;
      groups[warehouseId].items.push(item);
    });
    return groups;
  }, [items]);

  // Load Midtrans Snap JS
  useEffect(() => {
    const snapScriptUrl = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

    const script = document.createElement("script");
    script.src = snapScriptUrl;
    script.setAttribute("data-client-key", clientKey || "");
    script.onload = () => {
      setSnapLoaded(true);
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const subTotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const shippingCost = Object.values(selectedShippingByWarehouse).reduce((sum, opt) => {
    return sum + (opt ? opt.cost[0].value : 0);
  }, 0);

  const totalAmount = subTotal + shippingCost;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    async function fetchShipping() {
      if (!defaultAddress?.cityId) return;

      const groupKeys = Object.keys(warehouseGroups);
      if (groupKeys.length === 0) return;

      setIsLoadingShipping(true);
      const couriers = ['jne', 'sicepat', 'pos'];

      try {
        const newOptions: { [warehouseId: string]: any[] } = {};
        const newSelected: { [warehouseId: string]: any } = {};

        await Promise.all(
          groupKeys.map(async (warehouseId) => {
            const group = warehouseGroups[warehouseId];
            const responses = await Promise.all(
              couriers.map(c => calculateShippingCost(group.warehouse.cityId, defaultAddress.cityId, group.weight, c))
            );

            const options: any[] = [];
            responses.forEach(res => {
              if (res && res.costs) {
                res.costs.forEach((costOption: any) => {
                  const code = (res.code || "").toUpperCase();
                  const service = costOption.service;
                  options.push({
                    warehouseId: warehouseId,
                    courierCode: code,
                    courierName: res.name,
                    service: service,
                    description: costOption.description,
                    cost: costOption.cost,
                  });
                });
              }
            });

            newOptions[warehouseId] = options;
            if (options.length > 0) {
              newSelected[warehouseId] = options[0]; // Auto-select the first option
            }
          })
        );

        setShippingOptionsByWarehouse(newOptions);
        setSelectedShippingByWarehouse(newSelected);
      } catch (error) {
        console.error("Failed to fetch shipping options", error);
      } finally {
        setIsLoadingShipping(false);
      }
    }

    fetchShipping();
  }, [defaultAddress, warehouseGroups]);

  const handlePay = async () => {
    if (!snapLoaded) {
      toast.add({ type: "error", title: t("paymentFailed") });
      return;
    }

    setIsProcessing(true);

    const shipments = Object.values(selectedShippingByWarehouse)
      .filter(Boolean)
      .map((opt: any) => ({
        warehouseId: opt.warehouseId,
        courierCode: opt.courierCode,
        service: opt.service,
        cost: opt.cost[0].value
      }));

    if (shipments.length !== Object.keys(warehouseGroups).length) {
      toast.add({ type: "error", title: "Silakan pilih pengiriman untuk semua gudang" });
      setIsProcessing(false);
      return;
    }

    const res = await createMidtransTransaction(
      directBuyRequest,
      addressId,
      shipments
    );

    if (res.success && res.token) {
      // @ts-ignore
      window.snap.pay(res.token, {
        onSuccess: function (result: any) {
          toast.add({ type: "success", title: t("paymentSuccess") });
          router.push(`/${locale}/orders`);
        },
        onPending: function (result: any) {
          toast.add({ type: "success", title: t("paymentSuccess") });
          router.push(`/${locale}/orders`);
        },
        onError: function (result: any) {
          toast.add({ type: "error", title: t("paymentFailed") });
          setIsProcessing(false);
        },
        onClose: function () {
          toast.add({ type: "error", title: t("paymentClosed") });
          setIsProcessing(false);
        }
      });
    } else {
      toast.add({ type: "error", title: res.msg || t("paymentFailed") });
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
      <h1 className="text-3xl font-bold text-zinc-900">{t("title")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {/* Address Section */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">{t("shippingAddress")}</h2>

            {defaultAddress ? (
              <div className="space-y-1 text-sm text-zinc-600">
                <p className="font-semibold text-zinc-900">{defaultAddress.receiverName}</p>
                <p>{defaultAddress.receiverPhone}</p>
                <p className="mt-2">{defaultAddress.streetAddress}</p>
                <p>{defaultAddress.village}, {defaultAddress.district}</p>
                <p>{defaultAddress.city}, {defaultAddress.province} {defaultAddress.postalCode}</p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                <div className="text-yellow-600 mt-0.5">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">{t("noAddressWarning")}</h3>
                  <p className="text-sm text-yellow-700 mt-1">  {t("noAddressWarningDesc")}</p>
                  <Link href={`/${locale}/profile`} className="text-sm font-semibold text-yellow-800 mt-2 inline-block hover:underline">
                    {t("setupAddressNow")} &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Items Section (Grouped by Warehouse) */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 mb-6">{t("orderSummary")}</h2>

            <div className="space-y-8">
              {Object.entries(warehouseGroups).map(([warehouseId, group]) => (
                <div key={warehouseId} className="space-y-4 border border-zinc-200 rounded-xl p-4 bg-zinc-50/50">
                  <div className="flex items-center gap-2 pb-3 border-b border-zinc-200">
                    <MapPin className="h-4 w-4 text-zinc-500" />
                    <h3 className="font-semibold text-zinc-900">
                      {t("shippedFrom")} {group.warehouse.name} - ({group.warehouse.city})
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {group.items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-white border border-zinc-100 flex-shrink-0">
                          {item.product.images?.[0] ? (
                            <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xs">No Image</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-zinc-900 line-clamp-1">{item.product.name}</h4>
                          {item.size && item.size !== "ALL" && (
                            <p className="text-xs text-zinc-500 mt-0.5">Variant: {item.size}</p>
                          )}
                          <p className="text-sm text-zinc-500 mt-1">{item.quantity} x Rp {item.product.price.toLocaleString("id-ID")}</p>
                          <p className="font-semibold text-orange-600 mt-1">Rp {(item.quantity * item.product.price).toLocaleString("id-ID")}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-zinc-200">
                    <h4 className="text-sm font-semibold text-zinc-900 mb-3">{t("shippingOptions")}</h4>
                    {isLoadingShipping ? (
                      <div className="text-sm text-zinc-500 animate-pulse">{t("processing")}</div>
                    ) : shippingOptionsByWarehouse[warehouseId] && shippingOptionsByWarehouse[warehouseId].length > 0 ? (
                      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                        {shippingOptionsByWarehouse[warehouseId].map((opt, idx) => {
                          const isSelected = selectedShippingByWarehouse[warehouseId] === opt;
                          return (
                            <label key={idx} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'border-orange-500 bg-orange-50/50' : 'border-zinc-200 hover:border-orange-200 bg-white'}`}>
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name={`shippingOption-${warehouseId}`}
                                  className="text-orange-600 focus:ring-orange-500 h-4 w-4"
                                  checked={isSelected}
                                  onChange={() => setSelectedShippingByWarehouse(prev => ({ ...prev, [warehouseId]: opt }))}
                                />
                                <div>
                                  <p className="font-semibold text-sm text-zinc-900">{opt.courierCode} - {opt.service}</p>
                                  <p className="text-xs text-zinc-500">{opt.description} {opt.cost[0].etd ? `(${opt.cost[0].etd} hari)` : ''}</p>
                                </div>
                              </div>
                              <div className="font-bold text-sm text-zinc-900">
                                {formatCurrency(opt.cost[0].value)}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-zinc-500 p-3 bg-white border border-zinc-200 rounded-lg">
                        {t("noShippingOptions")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm sticky top-6">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">{t("total")}</h2>
            <div className="flex justify-between items-center mb-6">
              <span className="text-zinc-600">{t("total")}</span>
              <span className="text-2xl font-bold text-orange-600">Rp {totalAmount.toLocaleString("id-ID")}</span>
            </div>

            <button
              onClick={handlePay}
              disabled={isProcessing || !defaultAddress || !snapLoaded}
              className="w-full py-4 px-6 rounded-xl text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-50 transition-colors"
            >
              {isProcessing ? t("processing") : t("payNow")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
