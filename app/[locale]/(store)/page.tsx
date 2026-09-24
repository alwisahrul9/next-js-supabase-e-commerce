import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/app/lib/db";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import heroBanner from '@/public/images/hero-banner.jpg'

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("home"),
    description: t("homeDescription"),
    keywords: t("homeKeywords"),
    openGraph: {
      title: t("home"),
      description: t("homeDescription"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("home"),
      description: t("homeDescription"),
    },
  };
}

export default async function StoreHomePage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "StoreHome" });

  // Fetch the first store profile for the hero image (logoUrl)
  const storeProfile = await prisma.storeProfile.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  // Fetch featured products
  const featuredProducts = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      isFeatured: true,
    },
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      stocks: true,
    },
  });

  // Calculate total stock for each product
  const productsWithStock = featuredProducts.map((product) => ({
    ...product,
    totalStock: product.stocks.reduce((sum, stock) => sum + stock.qty, 0),
  }));

  // Structured Data (JSON-LD) for WebSite and Organization
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "name": "DRESS.CO",
        "url": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${locale}/products?search={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Organization",
        "name": storeProfile?.storeName || "DRESS.CO",
        "url": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "logo": storeProfile?.logoUrl || heroBanner,
        "description": storeProfile?.storeDescription || t("heroSubtitle")
      }
    ]
  };

  return (
    <div className="flex flex-col gap-16 md:gap-24 pb-24 bg-white text-zinc-900 font-sans w-full max-w-[100vw] overflow-x-hidden">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Dynamic Hero Section */}
      <section className="relative w-full md:w-[calc(100%-2rem)] max-w-[90rem] mx-auto overflow-hidden md:rounded-[2.5rem] mt-0 md:mt-4 h-[80vh] min-h-[600px] flex flex-col items-center justify-center text-center group">
        <div className="absolute inset-0 z-0">
          <Image
            src={heroBanner}
            alt="Hero Background"
            fill
            className="object-cover object-[center_30%] transition-transform duration-[20s] ease-out group-hover:scale-110"
            sizes="100vw"
            priority
          />
          {/* Subtle vignette and gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/80 pointer-events-none" />
        </div>

        <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center gap-6 md:gap-8 mt-20 md:mt-32">
          {/* Glassmorphism badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/95 text-xs sm:text-sm font-semibold tracking-widest uppercase shadow-2xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            New Arrival Collection
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter text-white leading-[1.1] md:leading-[1.05] drop-shadow-2xl">
            {t("heroTitle")}
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-zinc-200 max-w-2xl font-light leading-relaxed drop-shadow-md">
            {t("heroSubtitle")}
          </p>

          <div className="mt-8 md:mt-10 flex w-full sm:w-auto justify-center">
            <Link
              href={`/${locale}/products`}
              className="group/btn relative flex items-center justify-center px-10 py-4 sm:py-5 w-full sm:w-auto bg-white text-zinc-950 rounded-full font-bold text-sm sm:text-base hover:bg-zinc-100 transition-all active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                {t("shopNow")}
                <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Section - Minimalist Grid */}
      <section className="flex flex-col gap-8 md:gap-12 px-4 md:px-8 w-full max-w-7xl mx-auto">
        <div className="flex items-end justify-between border-b border-zinc-100 pb-4 md:pb-6">
          <div className="flex flex-col gap-1 md:gap-2">
            <h2 className="text-xl md:text-3xl font-semibold tracking-tight text-zinc-900">
              {t("featuredTitle")}
            </h2>
            <p className="text-zinc-500 font-light text-xs md:text-base">
              {t("featuredSubtitle")}
            </p>
          </div>
          <Link
            href={`/${locale}/products`}
            className="hidden md:flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            {t("viewAll")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {productsWithStock.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12">
            {productsWithStock.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group flex flex-col gap-3 md:gap-4"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-100 rounded-lg md:rounded-xl">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-xs md:text-sm">
                      No Image
                    </div>
                  )}
                  {product.totalStock === 0 && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="px-3 py-1.5 md:px-4 md:py-2 bg-zinc-900 text-white text-[10px] md:text-xs font-semibold uppercase tracking-widest rounded-sm">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-0.5 md:gap-1 px-1 md:px-0">
                  <span className="text-[10px] md:text-xs font-medium tracking-widest uppercase text-zinc-400 truncate">
                    {product.category?.name || "Uncategorized"}
                  </span>

                  <h3 className="font-medium text-sm md:text-base text-zinc-900 line-clamp-1 group-hover:underline decoration-1 underline-offset-4">
                    {product.name}
                  </h3>

                  <span className="font-semibold text-sm md:text-base text-zinc-900 mt-0.5 md:mt-1">
                    {formatCurrency(product.price)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 md:py-24 bg-zinc-50 rounded-2xl mx-2 md:mx-0">
            <p className="text-zinc-500 font-medium text-sm md:text-base text-center px-4">
              Belum ada produk unggulan saat ini.
            </p>
          </div>
        )}

        <div className="flex justify-center mt-2 md:hidden">
          <Link
            href={`/${locale}/products`}
            className="flex items-center justify-center gap-2 w-full py-3.5 border border-zinc-200 text-sm font-medium text-zinc-900 rounded-full hover:bg-zinc-50 transition-colors"
          >
            {t("viewAll")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
