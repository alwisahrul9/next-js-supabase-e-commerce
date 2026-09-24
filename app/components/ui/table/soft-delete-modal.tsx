import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";

interface deleteButton {
  id: string;
  isOpen: boolean;
  setIsOpen: any;
  onArchived: (id: string) => void;
}

export default function SoftDeleteModal({
  id,
  isOpen,
  setIsOpen,
  onArchived,
}: deleteButton) {
  const t = useTranslations("SoftDeleteModal");
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
          </DialogHeader>
          <DialogDescription>{t("description")}</DialogDescription>
          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" className="my-auto">
                  {t("closeBtn")}
                </Button>
              }
            />
            <Button
              className="py-2 px-4 rounded-full bg-transparent text-orange-500 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-600 transition-all"
              size="lg"
              onClick={() => onArchived(id)}
            >
              {t("deleteBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
