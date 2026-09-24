import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAllCategories } from "@/app/actions/categories";
import CreateProductForm from "../_components/create-product-form";
import { getAllWarehouses } from "@/app/actions/warehouse";

interface PageProps {
  params: Promise<{ locale: string }>;
}

async function getCategories() {
  return await getAllCategories();
}

async function getWarehouses() {
  return await getAllWarehouses();
}

// 1. GENERATE METADATA DENGAN TRANSLASI
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;

  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("sellerProductCreate"),
  };
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

// 2. HALAMAN UTAMA (SERVER COMPONENT)
export default async function CreateProductPage() {
  const session = await getServerSession(authOptions);
  const employeeProfile = (session?.user as any)?.employeeProfile;
  const role = (session?.user as any)?.role;

  // Fetch data di Server Side
  const [categories, allWarehouses] = await Promise.all([
    getCategories(),
    getWarehouses(),
  ]);

  let warehouses = allWarehouses || [];
  if (role === "EMPLOYEE" && employeeProfile?.warehouses) {
    const allowedIds = employeeProfile.warehouses.map((w: any) => w.id);
    warehouses = warehouses.filter((w: any) => allowedIds.includes(w.id));
  }

  return (
    <CreateProductForm
      categories={categories ?? []}
      warehouses={warehouses ?? []}
    />
  );
}
