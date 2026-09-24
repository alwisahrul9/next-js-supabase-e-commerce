import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductsById } from "@/app/actions/products";
import { getTranslations } from "next-intl/server";
import SellerProductDetailView from "./_components/seller-product-detail-view";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const product = await getProductsById(id);

  if (!product) {
    return {
      title: t("productNotFound"),
    };
  }

  return {
    title: product.name,
    description: product.description
      ? product.description.slice(0, 160)
      : `Detail produk ${product.name}`,
  };
}

export default async function SellerProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductsById(id);

  if (!product) {
    notFound();
  }

  return <SellerProductDetailView product={product as any} />;
}
