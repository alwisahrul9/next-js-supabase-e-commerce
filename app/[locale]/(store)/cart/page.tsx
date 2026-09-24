import React from "react";
import { getTranslations } from "next-intl/server";
import { getCartItems } from "@/app/actions/cart";
import { getBuyerProfileData } from "@/app/actions/profile";
import CartView from "./_components/cart-view";
import { ShoppingCart } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CartPage" });
  return { title: t("title") };
}

export default async function CartPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: "CartPage" });
  
  const profileRes = await getBuyerProfileData();
  const addresses = profileRes.success ? (profileRes.data?.addresses || []) : [];
  
  const { items, hasAddress } = await getCartItems();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
          <ShoppingCart className="h-6 w-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">
          {t("title")}
        </h1>
      </div>

      <CartView initialItems={items} hasAddress={hasAddress} addresses={addresses} />
    </div>
  );
}
