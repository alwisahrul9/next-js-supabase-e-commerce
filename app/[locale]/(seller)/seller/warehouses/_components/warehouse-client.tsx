"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MapPin, Package, MoreVertical, Plus, Edit, Trash2, ArrowRightLeft, Map, Eye } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import WarehouseDeleteModal from "./warehouse-delete-modal";
import WarehouseTransferModal from "./warehouse-transfer-modal";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface WarehouseClientProps {
  initialWarehouses: any[];
  locale: string;
}

export default function WarehouseClient({ initialWarehouses, locale }: WarehouseClientProps) {
  const t = useTranslations("WarehousePage");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<{ id: string, name: string } | null>(null);

  const openDeleteModal = (id: string, name: string) => {
    setSelectedWarehouse({ id, name });
    setDeleteModalOpen(true);
  };

  const openTransferModal = (id: string, name: string) => {
    setSelectedWarehouse({ id, name });
    setTransferModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link href={`/${locale}/seller/warehouses/create`} className={buttonVariants({ className: "gap-2" })}>
          <Plus className="w-4 h-4" />
          {t("addWarehouse")}
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {initialWarehouses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-500 border border-dashed rounded-xl">
            <Map className="w-12 h-12 mx-auto mb-4 text-zinc-400" />
            <h3 className="text-lg font-medium">{t("emptyTitle")}</h3>
            <p className="mb-4">{t("emptyDescription")}</p>
            <Link href={`/${locale}/seller/warehouses/create`} className={buttonVariants({ variant: "outline" })}>
              {t("addFirstWarehouse")}
            </Link>
          </div>
        ) : (
          initialWarehouses.map((warehouse) => (
            <Card key={warehouse.id} className="flex flex-col relative overflow-hidden">
              <CardHeader className="pb-4 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      {warehouse.warehouseName}
                      {warehouse.isMain && (
                        <Badge variant="secondary" className="text-xs">
                          {t("mainWarehouse")}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-start gap-1.5 mt-2">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-zinc-500" />
                      <span>{warehouse.streetAddress}, {warehouse.village}, {warehouse.district}, {warehouse.city}, {warehouse.province} {warehouse.postcode}</span>
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon", className: "-mr-2 -mt-2" })}>
                      <MoreVertical className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href={`/seller/warehouses/${warehouse.id}`}>
                        <DropdownMenuItem className="cursor-pointer gap-2">
                          <Eye className="w-4 h-4" />
                          {t("viewDetails")}
                        </DropdownMenuItem>
                      </Link>
                      <Link href={`/seller/warehouses/edit/${warehouse.id}`}>
                        <DropdownMenuItem className="cursor-pointer gap-2">
                          <Edit className="w-4 h-4" />
                          {t("edit")}
                        </DropdownMenuItem>
                      </Link>
                      {!warehouse.isMain && (
                        <>
                          <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => openTransferModal(warehouse.id, warehouse.warehouseName)}>
                            <ArrowRightLeft className="w-4 h-4" />
                            {t("transferAndDelete")}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer gap-2 text-red-600 focus:text-red-600" onClick={() => openDeleteModal(warehouse.id, warehouse.warehouseName)}>
                            <Trash2 className="w-4 h-4" />
                            {t("forceDelete")}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow bg-zinc-50/50 dark:bg-zinc-900/20 border-t mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-sm text-zinc-600 dark:text-zinc-400">
                    <Package className="w-4 h-4" />
                    <span>{t("productsInWarehouse")}</span>
                  </div>
                  <Badge variant="secondary">{warehouse.stocks?.length || 0}</Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <WarehouseDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        warehouseId={selectedWarehouse?.id || null}
        warehouseName={selectedWarehouse?.name || ""}
      />

      <WarehouseTransferModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        warehouseId={selectedWarehouse?.id || null}
        warehouseName={selectedWarehouse?.name || ""}
        availableWarehouses={initialWarehouses}
      />
    </div>
  );
}
