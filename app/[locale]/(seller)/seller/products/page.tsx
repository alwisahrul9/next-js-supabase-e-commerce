import { Metadata } from "next";
import { Plus } from "lucide-react";
import { getProducts } from "@/app/actions/products";
import { getTranslations } from "next-intl/server";
import DataTableWrapper from "./_components/data-table-wrapper";
import Link from "next/link";

interface Product {
  id: string;
  images: string[];
  name: string;
  price: number;
  status: any;
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

// 1. DYNAMIC METADATA DENGAN TRANSLASI
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;

  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("sellerProducts"),
  };
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

// 2. HALAMAN UTAMA (SERVER COMPONENT)
export default async function ProductsPage({ params, searchParams }: PageProps) {
  // Mengambil translation versi async server-side
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Products" });
  
  const session = await getServerSession(authOptions);
  const storeProfileId = (session?.user as any)?.storeProfile?.id;
  const role = (session?.user as any)?.role;

  // Membaca query params dari URL
  const { page, search } = await searchParams;
  const currentPage = Number(page) || 1;
  const searchQuery = search || "";
  const pageSize = 5;

  // Fetching data — seller perlu melihat semua status produk (DRAFT, ACTIVE, ARCHIVED, dll)
  const res = await getProducts(currentPage, pageSize, searchQuery, undefined, true, storeProfileId);

  // Parse JSON untuk menghindari error passing Date ke Client Component
  const products: Product[] = res.success ? JSON.parse(JSON.stringify(res.data)) : [];
  const meta = res.metadata || { totalPages: 0, totalItems: 0, pageSize };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t("subtitle")}
          </p>
        </div>
        <Link
          href="products/create"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold shadow-md"
        >
          <Plus className="h-4 w-4" />
          {t("addProduct")}
        </Link>
      </div>

      {/* Wrapper Client Component */}
      <DataTableWrapper
        data={products}
        currentPage={currentPage}
        totalPages={meta.totalPages}
        totalItems={meta.totalItems}
        pageSize={pageSize}
        initialSearchQuery={searchQuery}
        role={role}
        translation={{
          image: t("columns.image"),
          name: t("columns.name"),
          status: t("columns.status"),
          active: t("status.active"),
          draft: t("status.draft"),
          archived: t("status.archived"),
          blocked: t("status.blocked"),
          price: t("columns.price"),
          actions: t("columns.actions"),
          history: {
            title: t("history.title"),
            CREATED: t("history.CREATED"),
            UPDATED: t("history.UPDATED"),
            ARCHIVED: t("history.ARCHIVED"),
            empty: t("history.empty"),
          }
        }}
      />
    </div>
  );
}
