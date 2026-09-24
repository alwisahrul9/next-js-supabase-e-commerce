import { getProductsById } from "@/app/actions/products";
import EditProductModal from "./edit-product-modal";
import { getAllCategories } from "@/app/actions/categories";
import { getAllWarehouses } from "@/app/actions/warehouse";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  
  const session = await getServerSession(authOptions);
  const employeeProfile = (session?.user as any)?.employeeProfile;
  const role = (session?.user as any)?.role;

  // Proses fetching data di server yang memicu aktifnya loading.tsx
  const [product, categories, allWarehouses] = await Promise.all([
    getProductsById(id),
    getAllCategories(),
    getAllWarehouses(),
  ]);

  if (!product) {
    notFound(); // Akan menampilkan halaman 404 dan tidak akan mengeksekusi kode di bawahnya
  }

  let warehouses = allWarehouses || [];
  if (role === "EMPLOYEE" && employeeProfile?.warehouses) {
    const allowedIds = employeeProfile.warehouses.map((w: any) => w.id);
    warehouses = warehouses.filter((w: any) => allowedIds.includes(w.id));
  }

  return (
    <EditProductModal
      initialData={product}
      categories={categories}
      warehouses={warehouses}
    />
  );
}
