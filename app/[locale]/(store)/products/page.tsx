import { Metadata } from "next";
import { getProducts } from "@/app/actions/products";
import { getAllCategories } from "@/app/actions/categories";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingBag, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; search?: string; category?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("storeProducts"),
    description: t("homeDescription"),
    openGraph: {
      title: t("storeProducts"),
      description: t("homeDescription"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("storeProducts"),
      description: t("homeDescription"),
    },
  };
}

export default async function ProductListPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "StoreProducts" });
  const { page, search, category } = await searchParams;
  const currentPage = Number(page) || 1;
  const searchQuery = search || "";
  const categoryQuery = category || "all";
  const pageSize = 12;

  const [resProducts, categories] = await Promise.all([
    getProducts(currentPage, pageSize, searchQuery, categoryQuery),
    getAllCategories(),
  ]);

  const products = resProducts.success ? JSON.parse(JSON.stringify(resProducts.data)) : [];
  const meta = resProducts.metadata || { totalPages: 0, totalItems: 0, pageSize };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": products.map((product: any, index: number) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${locale}/products/${product.id}`
    }))
  };

  return (
    <div className="space-y-12 bg-white min-h-screen text-zinc-900 font-sans pb-24">
      {/* Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header Banner - Minimalist */}
      <div className="relative overflow-hidden rounded-[2rem] bg-zinc-50 mx-4 md:mx-8 px-6 py-12 md:py-24 md:px-16 text-center flex flex-col items-center justify-center mt-4 md:mt-8">
        <div className="relative z-10 max-w-2xl flex flex-col items-center gap-4 md:gap-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] md:text-xs font-semibold bg-white border border-zinc-200 text-zinc-600 shadow-sm uppercase tracking-widest">
            <ShoppingBag className="h-3 md:h-3.5 w-3 md:w-3.5" /> KATALOG BUSANA DRESS.CO
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 leading-[1.1]">
            {t("title")}
          </h1>
          <p className="text-zinc-500 text-sm sm:text-base md:text-lg max-w-xl font-light leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
      </div>

      <div className="px-4 md:px-8 space-y-8">
        {/* Filter & Search Bar - Minimalist */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Category Filter Chips / Select */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none w-full md:w-auto">
            <Link
              href={`/products?${new URLSearchParams({ ...(searchQuery ? { search: searchQuery } : {}), category: "all", }).toString()}`}
              className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${categoryQuery === "all" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
            >
              {t("allCategories")}
            </Link>
            {categories.map((cat) => {
              const isSelected = categoryQuery === cat.id;
              return (
                <Link
                  key={cat.id}
                  href={`/products?${new URLSearchParams({ ...(searchQuery ? { search: searchQuery } : {}), category: cat.id, }).toString()}`}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${isSelected ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>

          {/* Search Form */}
          <form className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              name="search"
              defaultValue={searchQuery}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-full text-sm focus:outline-hidden focus:border-zinc-400 focus:bg-white transition-colors"
            />
            {categoryQuery !== "all" && (
              <input type="hidden" name="category" value={categoryQuery} />
            )}
          </form>
        </div>

        {/* Product Grid - Minimalist */}
        {products.length === 0 ? (
          <div className="py-32 flex flex-col items-center text-center bg-zinc-50 rounded-[2rem] space-y-4">
            <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center text-zinc-400 shadow-sm">
              <Package className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900">
              {t("noProductsFound")}
            </h3>
            <p className="text-zinc-500 max-w-sm text-sm md:text-base px-4">
              {t("noProductsDesc")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12">
            {products.map((product: any) => {
              const totalStock = (product.stocks || []).reduce((acc: number, curr: any) => acc + (curr.qty || 0), 0);
              const primaryImage = product.images && product.images.length > 0 ? product.images[0] : "https://images.unsplash.com/photo-1521572267360-ee0c2909d518";

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group flex flex-col gap-3 md:gap-4"
                >
                  <div className="relative aspect-[3/4] w-full bg-zinc-100 overflow-hidden rounded-lg md:rounded-xl">
                    <Image
                      src={primaryImage}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />

                    <div className="absolute top-2 left-2 md:top-3 md:left-3 flex flex-col gap-2 z-10">
                      {product.isFeatured && (
                        <span className="px-2 md:px-2.5 py-1 text-[8px] md:text-[10px] font-bold bg-white text-zinc-900 tracking-wider shadow-sm uppercase rounded-sm">
                          Featured
                        </span>
                      )}
                    </div>

                    {totalStock === 0 && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-20">
                        <span className="px-3 py-1.5 md:px-4 md:py-2 bg-zinc-900 text-white text-[10px] md:text-xs font-semibold uppercase tracking-widest rounded-sm">
                          {t("outOfStock")}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5 md:gap-1 px-1 md:px-0">
                    <span className="text-[9px] md:text-[10px] font-medium tracking-widest uppercase text-zinc-400 truncate">
                      {product.category?.name || t("uncategorized")}
                    </span>
                    <h3 className="font-medium text-sm md:text-base text-zinc-900 group-hover:underline decoration-1 underline-offset-4 line-clamp-1">
                      {product.name}
                    </h3>
                    <span className="text-xs md:text-sm font-semibold text-zinc-900 mt-0.5 md:mt-1">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination Controls - Minimalist */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-12">
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => {
              const isActive = p === currentPage;
              return (
                <Link
                  key={p}
                  href={`/products?${new URLSearchParams({ ...(searchQuery ? { search: searchQuery } : {}), ...(categoryQuery !== "all" ? { category: categoryQuery } : {}), page: p.toString(), }).toString()}`}
                  className={`h-10 w-10 rounded-full font-medium text-sm flex items-center justify-center transition-colors ${isActive ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-600 hover:bg-zinc-200"}`}
                >
                  {p}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
