"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, AlertTriangle } from "lucide-react";
import { deleteWarehouseForce } from "@/app/actions/warehouse";
import { toast } from "@/components/ui/toast";
import { useTranslations } from "next-intl";

interface WarehouseDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: string | null;
  warehouseName: string;
}

export default function WarehouseDeleteModal({ isOpen, onClose, warehouseId, warehouseName }: WarehouseDeleteModalProps) {
  const t = useTranslations("WarehousePage");
  const [countdown, setCountdown] = useState(15);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [isOpen, countdown]);

  // Reset countdown on open
  useEffect(() => {
    if (isOpen) {
      setCountdown(15);
      setIsDeleting(false);
    }
  }, [isOpen]);

  const handleDelete = async () => {
    if (!warehouseId) return;
    setIsDeleting(true);
    try {
      const res = await deleteWarehouseForce(warehouseId);
      if (res.success) {
        toast.add({ type: "success", title: t("deleteSuccess") });
        onClose();
      } else {
        toast.add({ type: "error", title: res.message || t("deleteFailed") });
      }
    } catch (error) {
      toast.add({ type: "error", title: t("deleteFailed") });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            {t("deleteTitle")}
          </DialogTitle>
          <DialogDescription className="pt-4 text-zinc-600 dark:text-zinc-400">
            {t("deleteWarning", { name: warehouseName })}
            <br /><br />
            {t("deleteCountdownInfo")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center items-center py-6">
          <div className="text-4xl font-bold font-mono text-red-500">
            {countdown}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={countdown > 0 || isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {countdown > 0 ? t("waitCountdown") : t("confirmDelete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
