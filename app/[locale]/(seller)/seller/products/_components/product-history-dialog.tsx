"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getProductHistory } from "@/app/actions/products";
import { format } from "date-fns";

export default function ProductHistoryDialog({ 
  productId, 
  isOpen, 
  onClose,
  translations
}: { 
  productId: string | null;
  isOpen: boolean;
  onClose: () => void;
  translations: {
    title: string;
    CREATED: string;
    UPDATED: string;
    ARCHIVED: string;
    empty: string;
  };
}) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && productId) {
      setLoading(true);
      getProductHistory(productId).then((res) => {
        if (res.success) {
          setHistory(res.data);
        }
        setLoading(false);
      });
    }
  }, [isOpen, productId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{translations.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-100"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center text-sm text-zinc-500 py-4">
              {translations.empty}
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((h, i) => (
                <div key={i} className="flex flex-col gap-1 text-sm border-l-2 border-zinc-200 dark:border-zinc-800 pl-4 py-1">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {(translations as any)[h.action] || h.action} {h.user?.name || h.user?.email || "System"}
                    </span>
                    <span className="text-xs text-zinc-500 whitespace-nowrap ml-2">
                      {format(new Date(h.createdAt), "dd MMM yyyy, HH:mm")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
