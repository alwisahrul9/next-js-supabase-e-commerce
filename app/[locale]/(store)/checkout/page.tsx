import React from "react";
import { getTranslations } from "next-intl/server";
import { getCartItems } from "@/app/actions/cart";
import { getBuyerProfileData } from "@/app/actions/profile";
import { getProductsById } from "@/app/actions/products";
import CheckoutClient from "./_components/checkout-client";
import { redirect } from "next/navigation";;
import { calculateDistance } from "@/lib/utils";
import { useLocale } from "next-intl";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("storeCheckout") };
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ productId?: string; quantity?: string; addressId?: string; size?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const productId = sp?.productId;
  const quantity = sp?.quantity ? parseInt(sp.quantity, 10) : 1;
  const addressId = sp?.addressId;
  const size = sp?.size;

  const profileRes = await getBuyerProfileData();
  const addresses = profileRes?.data?.addresses || [];
  
  let targetAddress = addresses.find((a: any) => a.id === addressId);
  if (!targetAddress) {
    targetAddress = addresses.find((a: any) => a.isDefault) || addresses[0];
  }

  let items: any[] = [];
  
  if (productId) {
    const product = await getProductsById(productId);
    if (!product) redirect(`/${locale}/cart`);

    let warehouses = (product.stocks || []).map((stock: any) => {
      let distance = null;
      if (targetAddress?.latitude && targetAddress?.longitude) {
        distance = calculateDistance(
          targetAddress.latitude, targetAddress.longitude,
          stock.warehouse.latitude, stock.warehouse.longitude
        );
      }
      return {
        id: stock.warehouse.id,
        name: stock.warehouse.warehouseName,
        qty: stock.qty,
        isMain: stock.warehouse.isMain,
        distance: distance,
        latitude: stock.warehouse.latitude,
        longitude: stock.warehouse.longitude,
        city: stock.warehouse.city,
        cityId: stock.warehouse.cityId
      };
    });

    warehouses.sort((a: any, b: any) => {
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      if (b.qty !== a.qty) return b.qty - a.qty;
      return (a.isMain === b.isMain) ? 0 : a.isMain ? -1 : 1;
    });

    let selectedWarehouseId = warehouses.length > 0 ? warehouses[0].id : null;

    items = [{
      id: "direct_buy",
      productId: product.id,
      quantity: quantity,
      product: product,
      availableWarehouses: warehouses,
      warehouseId: selectedWarehouseId,
      size: size || "ALL"
    }];
  } else {
    const cartData = await getCartItems(addressId);
    items = cartData.items;
  }

  if (items.length === 0) {
    redirect(`/${locale}/cart`);
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-12">
      <CheckoutClient 
        items={items} 
        defaultAddress={targetAddress} 
        directBuyRequest={productId ? { productId, quantity, size, warehouseId: items[0]?.warehouseId } : undefined} 
        addressId={targetAddress?.id}
      />
    </div>
  );
}
