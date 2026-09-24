"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRightLeft } from "lucide-react";
import { transferProductsAndDeleteWarehouse } from "@/app/actions/warehouse";
import { toast } from "@/components/ui/toast";
import { useTranslations } from "next-intl";

interface WarehouseTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: string | null;
  warehouseName: string;
  availableWarehouses: any[];
}

export default function WarehouseTransferModal({
  isOpen,
  onClose,
  warehouseId,
  warehouseName,
  availableWarehouses
}: WarehouseTransferModalProps) {
  const t = useTranslations("WarehousePage");
  const [targetWarehouseId, setTargetWarehouseId] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Filter out the current warehouse from available options
  const targetOptions = availableWarehouses.filter(w => w.id !== warehouseId);

  const handleTransfer = async () => {
    if (!warehouseId || !targetWarehouseId) return;
    setIsTransferring(true);
    try {
      const res = await transferProductsAndDeleteWarehouse(warehouseId, targetWarehouseId);
      if (res.success) {
        toast.add({
          type: "success",
          title: t("transferSuccess")
        });
        onClose();
      } else {
        toast.add({
          title: res.message || t("transferFailed"),
          type: "error"
        });
      }
    } catch (error) {
      toast.add({
        title: t("transferFailed"),
        type: "error"
      });
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isTransferring && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-blue-500" />
            {t("transferTitle")}
          </DialogTitle>
          <DialogDescription className="pt-2 text-zinc-600 dark:text-zinc-400">
            {t("transferDescription", { name: warehouseName })}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("selectTargetWarehouse")}</label>
            <Select value={targetWarehouseId} onValueChange={(value) => setTargetWarehouseId(value as string)} disabled={isTransferring}>
              <SelectTrigger>
                <SelectValue placeholder={t("placeholderTargetWarehouse")} />
              </SelectTrigger>
              <SelectContent>
                {targetOptions.length === 0 ? (
                  <div className="p-2 text-sm text-center text-zinc-500">{t("noOtherWarehouses")}</div>
                ) : (
                  targetOptions.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.warehouseName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isTransferring}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!targetWarehouseId || isTransferring}
          >
            {isTransferring ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {t("confirmTransfer")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
