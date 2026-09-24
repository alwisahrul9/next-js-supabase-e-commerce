import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProductsById } from "@/app/actions/products";
import ProductDetailView from "../_components/product-detail-view";
type Props = { params: Promise<{ id: string; locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const product = await getProductsById(id);
  if (!product) {
    return { title: t("productNotFound") };
  }
  return {
    title: product.name,
    description: product.description
      ? product.description.slice(0, 160)
      : product.name,
    openGraph: {
      title: product.name,
      description: product.description
        ? product.description.slice(0, 160)
        : product.name,
      type: "article",
      images: product.images.length > 0 ? [product.images[0]] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description
        ? product.description.slice(0, 160)
        : product.name,
      images: product.images.length > 0 ? [product.images[0]] : [],
    },
  };
}
export default async function ProductDetailPage({ params }: Props) {
  const { id, locale } = await params;
  const product = await getProductsById(id);
  if (!product) {
    notFound();
  }
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.length > 0 ? product.images : undefined,
    description: product.description || product.name,
    offers: {
      "@type": "Offer",
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${locale}/products/${product.id}`,
      priceCurrency: "IDR",
      price: product.price,
      availability: "https://schema.org/InStock",
    },
  };
  return (
    <>
      {" "}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />{" "}
      <ProductDetailView product={product as any} />{" "}
    </>
  );
}
