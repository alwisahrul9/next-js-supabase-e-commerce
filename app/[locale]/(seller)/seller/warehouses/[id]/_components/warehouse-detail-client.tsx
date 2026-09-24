"use client";

import { useTranslations, useLocale } from "next-intl";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

interface WarehouseDetailClientProps {
  warehouse: any;
}

export default function WarehouseDetailClient({ warehouse }: WarehouseDetailClientProps) {
    const locale = useLocale();
  const t = useTranslations("WarehousePage");

  const productsInWarehouse = warehouse.stocks || [];
  const totalStocks = warehouse._count?.stocks ?? productsInWarehouse.length;
  const remainingCount = totalStocks - productsInWarehouse.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/${locale}/seller/warehouses`} className={buttonVariants({ variant: "outline", size: "icon" })}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {warehouse.warehouseName}
            {warehouse.isMain && (
              <Badge variant="secondary" className="text-xs font-normal">
                {t("mainWarehouse")}
              </Badge>
            )}
          </h1>
          <p className="flex items-start gap-1.5 mt-2 text-sm text-zinc-500">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-zinc-400" />
            <span>
              {warehouse.streetAddress}, {warehouse.village}, {warehouse.district}, {warehouse.city}, {warehouse.province} {warehouse.postcode}
            </span>
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center gap-2">
          <Package className="w-5 h-5" />
          <h2 className="text-lg font-semibold">{t("productsInWarehouse")} ({totalStocks})</h2>
        </div>
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("productImage")}</TableHead>
                <TableHead>{t("productName")}</TableHead>
                <TableHead>{t("size")}</TableHead>
                <TableHead className="text-right">{t("qty")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsInWarehouse.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-zinc-500">
                    {t("noProductsInWarehouse")}
                  </TableCell>
                </TableRow>
              ) : (
                productsInWarehouse.map((stock: any) => (
                  <TableRow key={`${stock.productId}-${stock.size}`}>
                    <TableCell>
                      {stock.product?.images?.[0] ? (
                        <div className="relative w-12 h-12 rounded overflow-hidden">
                          <Image
                            src={stock.product.images[0]}
                            alt={stock.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                          <Package className="w-6 h-6 text-zinc-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium max-w-[250px] truncate">
                      {stock.product?.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{stock.size}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {stock.qty}
                    </TableCell>
                  </TableRow>
                ))
              )}
              {remainingCount > 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-16 text-center bg-transparent text-zinc-500 font-medium">
                    {t("andMore", { count: remainingCount })}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
