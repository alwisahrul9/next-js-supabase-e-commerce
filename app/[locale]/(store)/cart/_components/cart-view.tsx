"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Trash2, Plus, Minus, ShoppingBag, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/app/hooks/use-cart";
import { toast } from "@/components/ui/toast";

type WarehouseOption = {
  id: string;
  name: string;
  qty: number;
  isMain: boolean;
  distance: number | null;
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  cityId?: string | null;
};

type CartItemType = {
  id: string;
  cartId: string;
  productId: string;
  size: string;
  warehouseId: string | null;
  availableWarehouses: WarehouseOption[];
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: string;
    name: string;
    price: number;
    stocks: {
      id: string;
      productId: string;
      warehouseId: string;
      size: string;
      qty: number;
    }[];
    images: string[];
  };
};

export default function CartView({ initialItems, hasAddress, addresses = [] }: { initialItems: CartItemType[], hasAddress: boolean, addresses?: any[] }) {
    const locale = useLocale();
  const t = useTranslations("CartPage");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  const {
    items: storeItems,
    isLoaded,
    dirtyItems,
    isPending: storeIsPending,
    updateQuantity,
    removeItem,
    updateWarehouse,
  } = useCartStore();

  useEffect(() => {
    useCartStore.setState({ items: initialItems, hasAddress, isLoaded: true });
  }, [initialItems, hasAddress]);

  const items = isLoaded ? storeItems : initialItems;

  const handleUpdateQuantity = async (itemId: string, newQty: number, currentStock: number) => {
    if (newQty < 1) return;
    if (newQty > currentStock) {
      toast.add({ type: "error", title: t("outOfStock") });
      return;
    }
    await updateQuantity(itemId, newQty);
  };

  const handleRemove = async (itemId: string) => {
    const success = await removeItem(itemId);
    if (success) {
      toast.add({ type: "success", title: t("remove") + " ✓" });
    } else {
      toast.add({ type: "error", title: t("failedRemoveItem") });
    }
  };

  const handleWarehouseChange = async (itemId: string, newWarehouseId: string) => {
    const success = await updateWarehouse(itemId, newWarehouseId);
    if (!success) {
      toast.add({ type: "error", title: t("failedUpdateWarehouse") });
    }
  };

  const subtotal = items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const isCartEmpty = items.length === 0;

  const isAnyDirty = dirtyItems.size > 0;
  const isAnyItemOutOfStock = items.some((item) => {
    const selectedWarehouse = item.availableWarehouses.find(w => w.id === item.warehouseId) || item.availableWarehouses[0];
    const currentStock = selectedWarehouse?.qty || 0;
    return item.quantity > currentStock || currentStock === 0;
  });

  if (isCartEmpty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 py-16">
        <div className="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="h-12 w-12 text-zinc-400" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">{t("emptyCart")}</h2>
        <p className="text-zinc-500 mb-8 text-center max-w-md">{t("emptyCartDesc")}</p>
        <Link
          href={`/${locale}/products`}
          className="px-8 py-3 bg-zinc-900 text-white font-semibold rounded-xl hover:bg-zinc-800 transition-colors"
        >
          {t("continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Address Selector */}
      {addresses.length > 0 ? (
        <div className="mb-6 p-4 bg-white border border-zinc-200 rounded-xl">
          <h3 className="text-sm font-semibold text-zinc-900 mb-2">Pilih Alamat Tujuan</h3>
          <select
            value={selectedAddressId}
            onChange={(e) => setSelectedAddressId(e.target.value)}
            className="w-full sm:w-1/2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
          >
            {addresses.map(addr => (
              <option key={addr.id} value={addr.id}>
                {addr.label} - {addr.streetAddress}, {addr.city}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {!hasAddress && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
          <div className="text-yellow-600 mt-0.5">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-yellow-800">{t("noAddressWarning")}</h3>
            <p className="text-sm text-yellow-700 mt-1">{t("noAddressWarningDesc")}</p>
            <Link href={`/${locale}/profile`} className="text-sm font-semibold text-yellow-800 mt-2 inline-block hover:underline">
              {t("setupAddressNow")} &rarr;
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <ul className="divide-y divide-zinc-200">
              {items.map((item) => {
                const selectedWarehouse = item.availableWarehouses.find(w => w.id === item.warehouseId) || item.availableWarehouses[0];
                const currentStock = selectedWarehouse?.qty || 0;

                return (
                  <li key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <Link href={`/products/${item.productId}`} className="shrink-0">
                      <div className="relative w-24 h-32 sm:w-32 sm:h-40 rounded-xl overflow-hidden bg-zinc-100">
                        <Image
                          src={item.product.images[0] || "/placeholder-image.jpg"}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </Link>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-4 mb-1">
                          <Link href={`/products/${item.productId}`}>
                            <h3 className="font-semibold text-lg text-zinc-900 hover:text-orange-600 transition-colors line-clamp-2">
                              {item.product.name}
                            </h3>
                          </Link>
                          {item.size !== "ALL" && (
                            <span className="text-xs font-medium bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md mt-1 inline-block">
                              Ukuran: {item.size}
                            </span>
                          )}
                          <p className="font-bold text-lg text-zinc-900 shrink-0 mt-1">
                            {formatCurrency(item.product.price)}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 mb-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-1 rounded-md ${currentStock > 0
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                              }`}>
                              {currentStock > 0 ? `${t("stockAvailable")} ${currentStock}` : t("outOfStock")}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500 font-medium">{t("shippedFrom")}</span>
                            <select
                              disabled={storeIsPending || dirtyItems.has(item.id)}
                              value={item.warehouseId || ''}
                              onChange={(e) => handleWarehouseChange(item.id, e.target.value)}
                              className="text-xs bg-zinc-50 border border-zinc-200 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-zinc-900"
                            >
                              {item.availableWarehouses.map(w => (
                                <option key={w.id} value={w.id}>
                                  {w.name} {w.distance !== null ? `(${w.distance.toFixed(1)} km)` : ''} - Stok: {w.qty}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, currentStock)}
                            disabled={storeIsPending || dirtyItems.has(item.id) || item.quantity <= 1}
                            className="p-2 sm:p-2.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 transition-colors"
                          >
                            <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                          <span className="w-10 sm:w-12 text-center text-sm font-semibold text-zinc-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, currentStock)}
                            disabled={storeIsPending || dirtyItems.has(item.id) || item.quantity >= currentStock}
                            className="p-2 sm:p-2.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={storeIsPending || dirtyItems.has(item.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 sm:p-2.5 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="hidden sm:inline">{t("remove")}</span>
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="w-full lg:w-96 shrink-0">
          <div className="bg-zinc-50 rounded-2xl p-6 lg:p-8 border border-zinc-200 sticky top-24">
            <h2 className="text-xl font-bold text-zinc-900 mb-6">{t("summaryTitle")}</h2>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between text-zinc-600">
                <span>{t("subtotal")}</span>
                <span className="font-medium text-zinc-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-600">
                <span>{t("shipping")}</span>
                <span className="font-medium text-green-600">{t("freeShipping")}</span>
              </div>
            </div>

            <div className="border-t border-zinc-200 pt-6 mb-8">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{t("totalItems", { count: items.length })}</span>
                <span className="text-2xl font-bold text-orange-600">{formatCurrency(subtotal)}</span>
              </div>
            </div>

            <Link
              href={storeIsPending || isAnyItemOutOfStock || dirtyItems.size > 0 || !hasAddress ? "#" : (selectedAddressId ? `/checkout?addressId=${selectedAddressId}` : "/checkout")}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${storeIsPending || isAnyItemOutOfStock || dirtyItems.size > 0 || !hasAddress
                ? "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                : "bg-zinc-900 text-white hover:bg-zinc-800 shadow-md hover:shadow-lg"
                }`}
              onClick={(e) => {
                if (storeIsPending || isAnyItemOutOfStock || dirtyItems.size > 0 || !hasAddress) {
                  e.preventDefault();
                  if (!hasAddress) {
                    toast.add({ type: "error", title: t("addressRequired"), description: t("addressRequiredDesc") });
                  } else if (isAnyItemOutOfStock) {
                    toast.add({ type: "error", title: t("checkoutFailed"), description: t("checkoutFailedDesc") });
                  } else if (dirtyItems.size > 0 || storeIsPending) {
                    toast.add({ type: "info", title: t("pleaseWait"), description: t("savingCart") });
                  }
                }
              }}
            >
              {dirtyItems.size > 0 || storeIsPending ? t("saving") : t("checkout")}
            </Link>

            <div className="mt-4 text-center">
              <Link href={`/${locale}/products`} className="text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors inline-block p-2">
                {t("continueShopping")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
