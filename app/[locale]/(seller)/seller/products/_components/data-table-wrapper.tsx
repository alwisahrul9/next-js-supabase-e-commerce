"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";;
import DataTable, { Column } from "@/app/components/ui/data-table";
import { Archive, Check, Edit2, Eye, Lock, Toolbox } from "lucide-react";
import Image from "next/image";
import { archiveProduct } from "@/app/actions/products"; // Impor Server Action
import { Badge } from "@/components/ui/badge";
import SoftDeleteModal from "@/app/components/ui/table/soft-delete-modal";
import { toast } from "@/components/ui/toast";
import { translateServerMessage } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";
import ProductHistoryDialog from "./product-history-dialog";
import { Clock } from "lucide-react";
import Link from "next/link";

interface Product {
  id: string;
  images: string[];
  name: string;
  price: number;
  status: any;
}

interface DataTableWrapperProps {
  data: Product[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  initialSearchQuery: string;
  role?: string;
  translation: {
    image: string;
    name: string;
    active: string;
    status: string;
    archived: string;
    blocked: string;
    draft: string;
    price: string;
    actions: string;
    history: {
      title: string;
      CREATED: string;
      UPDATED: string;
      ARCHIVED: string;
      empty: string;
    };
  }; // Terima fungsi translator dari Server Component
}

export default function DataTableWrapper({
  data,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  initialSearchQuery,
  role,
  translation,
}: DataTableWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [historyProductId, setHistoryProductId] = useState<string | null>(null);
  const tValidation = useTranslations();
  const locale = useLocale();

  const productStatus: any = {
    DRAFT: {
      status: translation.draft,
      style: "text-white bg-gray-400",
      icon: <Toolbox />,
    },
    ACTIVE: {
      status: translation.active,
      style: "text-white bg-green-500",
      icon: <Check />,
    },
    ARCHIVED: {
      status: translation.archived,
      style: "text-white bg-yellow-500",
      icon: <Archive />,
    },
    BLOCKED: {
      status: translation.blocked,
      style: "text-white bg-red-500",
      icon: <Lock />,
    },
  };

  const updateUrl = (page: number, search: string) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", page.toString());
    if (search) params.set("search", search);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleExecuteArchive = async (id: string) => {
    const res = await archiveProduct(id);

    if (res.success) {
      setSelectedProductId(null); // Tutup modal setelah sukses
      toast.add({
        type: "success",
        title: translateServerMessage(res.msg, tValidation)
      })
      router.refresh();
    }

    if (!res.success) {
      setSelectedProductId(null); // Tutup modal setelah sukses
      toast.add({
        type: "error",
        title: translateServerMessage(res.msg, tValidation),
        priority: "high"
      });
      router.refresh();
    }
  };

  // Definisikan Kolom langsung di sisi Client
  const columns: Column<Product>[] = [
    {
      header: translation.image,
      className: "w-20",
      render: (product) => (
        <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200/50 dark:border-zinc-700/50">
          {product.images && product.images[0] && product.images[0] !== "" ? (
            <Image
              src={product.images[0]}
              width={80}
              height={80}
              alt={product.name}
              className="object-cover h-full w-full"
            />
          ) : (
            /* Tampilan fallback/placeholder jika tidak ada gambar */
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 rounded">
              No Image
            </div>
          )}
        </div>
      ),
    },
    {
      header: translation.name,
      render: (product) => (
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">
            {product.name}
          </p>
        </div>
      ),
    },
    {
      header: translation.status,
      render: (product) => (
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">
            <Badge className={productStatus[product.status].style}>
              {productStatus[product.status].icon}
              {productStatus[product.status].status}
            </Badge>
          </p>
        </div>
      ),
    },
    {
      header: translation.price,
      render: (product) => (
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
          }).format(product.price)}
        </span>
      ),
    },
    {
      header: translation.actions,
      className: "w-24 text-right",
      render: (product) => {
        return (
          <div className="flex items-center justify-end gap-2">
            <Link
              href={`/seller/products/${product.id}`}
              className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
              title="Detail"
            >
              <Eye className="h-4 w-4" />
            </Link>
            <Link
              href={`/seller/products/edit/${product.id}`}
              className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all"
              title="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </Link>

            {role === "SELLER" && (
              <button
                type="button"
                onClick={() => setHistoryProductId(product.id)}
                className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
                title={translation.history.title}
              >
                <Clock className="h-4 w-4" />
              </button>
            )}

            {/* Tombol pemicu: Set ID produk yang diklik ke state */}
            <button
              type="button"
              onClick={() => setSelectedProductId(product.id)}
              className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-all"
              title="Arsipkan"
            >
              <Archive className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div
      className={
        isPending ? "opacity-60 pointer-events-none transition-opacity" : ""
      }
    >
      <DataTable
        columns={columns}
        data={data}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={(newPage) => updateUrl(newPage, initialSearchQuery)}
        onSearchSubmit={(newSearch) => updateUrl(1, newSearch)}
        initialSearchQuery={initialSearchQuery}
      />

      <SoftDeleteModal
        id={selectedProductId ?? ""}
        isOpen={selectedProductId !== null}
        setIsOpen={(open: boolean) => {
          if (!open) setSelectedProductId(null);
        }}
        onArchived={handleExecuteArchive}
      />

      <ProductHistoryDialog
        productId={historyProductId}
        isOpen={!!historyProductId}
        onClose={() => setHistoryProductId(null)}
        translations={translation.history}
      />
    </div>
  );
}
