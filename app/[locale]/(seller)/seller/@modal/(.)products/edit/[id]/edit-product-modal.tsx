"use client";

import {
  useState,
  useEffect,
  useRef,
  useActionState,
  startTransition,
} from "react";
import { useRouter } from "next/navigation";;
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import * as tus from "tus-js-client";
import { Loader2, XCircle, Trash2, Plus } from "lucide-react";
import { toast } from "@/components/ui/toast";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProduct, ActionState } from "@/app/actions/products";
import DragDropImageUpload from "../../../../products/_components/drag-drop-image-upload";
import { formatCurrencyInput, parseCurrencyInput, translateServerMessage } from "@/lib/utils";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const BUCKET_NAME = "product-images";

interface ProductData {
  id: string;
  name: string;
  slug: string;
  price: number;
  weight: number | null;
  description: string;
  isFeatured: boolean;
  status: "DRAFT" | "ARCHIVED" | "ACTIVE" | "BLOCKED";
  images: string[];
  categoryId: string;
  stocks: { warehouseId: string; size: string; qty: number }[];
}

interface EditProductModalProps {
  categories: { id: string; name: string }[];
  warehouses: { id: string; warehouseName: string }[];
  initialData: ProductData | null;
}

interface ProductFormState {
  name: string;
  slug: string;
  price: number;
  weight: string;
  description: string;
  isFeatured: boolean;
  status: "DRAFT" | "ARCHIVED" | "ACTIVE" | "BLOCKED";
  images: string[];
  categoryId: string;
  stocks: { key: string; id: string; sizeType: string; sizeDetail: string; qty: number }[];
}

interface ProgressState {
  fileName: string;
  progress: number;
  status: "uploading" | "success" | "error" | "cancelled";
  errorMessage?: string;
}

const initialState: ActionState = {
  success: null,
  msg: "",
  errors: {},
};

export default function EditProductModal({
  categories = [],
  warehouses = [],
  initialData,
}: EditProductModalProps) {
  const router = useRouter();
  const t = useTranslations("ProductForm");
  const tUpload = useTranslations("Upload");
  const tAlerts = useTranslations("Alerts");
  const tValidation = useTranslations(); // Translation root penerjemah key Validation.*
  const { data: session } = useSession();
  const locale = useLocale(); // Mendapatkan locale aktif ("id" atau "en")

  // Menentukan simbol mata uang berdasarkan locale
  const currencySymbol = locale === "id" ? "Rp" : "$";

  const [state, formAction, isPending] = useActionState(
    updateProduct,
    initialState,
  );

  const [isUploading, setIsUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const activeUploadsRef = useRef<Map<string, tus.Upload>>(new Map());
  const filesMapRef = useRef<Map<string, File>>(new Map());

  const [formData, setFormData] = useState<ProductFormState>({
    name: "",
    slug: "",
    price: 0,
    weight: "",
    description: "",
    isFeatured: false,
    status: "DRAFT",
    images: [],
    categoryId: "",
    stocks: (warehouses || []).map((w) => ({ key: crypto.randomUUID(), id: w.id, sizeType: "ALL", sizeDetail: "", qty: 0 })),
  });

  const [uploadProgress, setUploadProgress] = useState<
    Record<string, ProgressState>
  >({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        slug: initialData.slug || "",
        price: initialData.price || 0,
        weight: initialData.weight?.toString() || "",
        description: initialData.description || "",
        isFeatured: !!initialData.isFeatured,
        status: initialData.status || "DRAFT",
        categoryId: initialData.categoryId || "",
        images: initialData.images || [],
        stocks: initialData.stocks && initialData.stocks.length > 0
          ? initialData.stocks.map((ws) => {
            let sizeType = "ALL";
            let sizeDetail = "";
            if (ws.size && ws.size !== "ALL") {
              const parts = ws.size.split(" - ");
              sizeType = parts[0];
              sizeDetail = parts.length > 1 ? parts[1] : "";
            }
            return {
              key: crypto.randomUUID(),
              id: ws.warehouseId,
              sizeType,
              sizeDetail,
              qty: ws.qty,
            };
          })
          : (warehouses || []).map((w) => ({
            key: crypto.randomUUID(),
            id: w.id,
            sizeType: "ALL",
            sizeDetail: "",
            qty: 0,
          })),
      });
    }
  }, [initialData, warehouses]);

  useEffect(() => {
    if (state.success === true) {
      toast.add({
        type: "success",
        title: translateServerMessage(state.msg, tValidation),
      });
      router.back();
    } else if (state.success === false) {
      toast.add({
        type: "error",
        title: translateServerMessage(state.msg, tValidation),
        priority: "high",
      });
      if (state.errors) {
        setFieldErrors(state.errors);
      }
    }
  }, [state]);

  /**
   * Mengembalikan KEY translation khusus dari namespace Upload
   */
  const getSupabaseErrorKey = (error: any): string => {
    const errString = error?.message || String(error || "");
    const status = error?.originalResponse?.getStatus?.();

    if (
      status === 413 ||
      errString.toLowerCase().includes("exceeds") ||
      errString.toLowerCase().includes("payload too large") ||
      errString.toLowerCase().includes("entity too large")
    ) {
      return "fileTooLarge";
    }

    if (status === 401 || status === 403) {
      return "unauthorized";
    }

    if (errString.toLowerCase().includes("network") || status === 0) {
      return "networkError";
    }

    return "uploadFailed";
  };

  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[fieldName];
        return updated;
      });
    }
  };

  const handleImagesChange = (newImages: string[]) => {
    filesMapRef.current.forEach((_, blobUrl) => {
      if (!newImages.includes(blobUrl)) {
        filesMapRef.current.delete(blobUrl);
      }
    });

    setFormData((prev) => ({ ...prev, images: newImages }));
    clearFieldError("images");
  };

  const cancelUpload = (fileId: string) => {
    const uploadInstance = activeUploadsRef.current.get(fileId);
    if (uploadInstance) {
      uploadInstance.abort();
      activeUploadsRef.current.delete(fileId);
    }

    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img !== fileId),
    }));

    setUploadProgress((prev) => {
      const updated = { ...prev };
      delete updated[fileId];
      return updated;
    });

    setIsUploading(false);
  };

  const executeTusUpload = async (imageSrc: string): Promise<string> => {
    if (!imageSrc.startsWith("blob:")) {
      return imageSrc;
    }

    const file = filesMapRef.current.get(imageSrc);
    if (!file) throw new Error("File tidak ditemukan di memory");

    const fileExt = file.name.split(".").pop();
    const fileName = `uploads/${crypto.randomUUID()}.${fileExt}`;

    const directTusEndpoint = `${SUPABASE_URL}/storage/v1/upload/resumable`;

    return new Promise((resolve, reject) => {
      let uploadInstance: tus.Upload;
      let maxProgressSoFar = 0;

      const handleOnline = async () => {
        if (uploadInstance) {
          toast.add({
            type: "success",
            title: "Koneksi terhubung kembali, menyambung unggahan...",
          });

          try {
            const freshToken =
              (session as any)?.supabaseToken || SUPABASE_ANON_KEY;

            uploadInstance.options.headers = {
              ...uploadInstance.options.headers,
              authorization: `Bearer ${freshToken}`,
            };

            const previousUploads = await uploadInstance.findPreviousUploads();
            if (previousUploads.length) {
              uploadInstance.resumeFromPreviousUpload(previousUploads[0]);
            }
            uploadInstance.start();
          } catch {
            uploadInstance.start();
          }
        }
      };

      const cleanupListeners = () => {
        window.removeEventListener("online", handleOnline);
      };

      uploadInstance = new tus.Upload(file, {
        endpoint: directTusEndpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000],

        headers: {
          authorization: `Bearer ${(session as any)?.supabaseToken || SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
          "x-upsert": "true",
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: BUCKET_NAME,
          objectName: fileName,
          contentType: file.type || "image/png",
          cacheControl: "3600",
        },

        chunkSize: 6 * 1024 * 1024,

        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100);

          if (percentage > maxProgressSoFar) {
            maxProgressSoFar = percentage;
          }

          setUploadProgress((prev) => ({
            ...prev,
            [imageSrc]: {
              fileName: file.name,
              progress: maxProgressSoFar,
              status: "uploading",
            },
          }));
        },

        onSuccess: () => {
          cleanupListeners();
          activeUploadsRef.current.delete(imageSrc);

          setUploadProgress((prev) => ({
            ...prev,
            [imageSrc]: { ...prev[imageSrc], progress: 100, status: "success" },
          }));

          const rawPublicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${fileName}`;
          const freshPublicUrl = `${rawPublicUrl}?t=${Date.now()}`;

          resolve(freshPublicUrl);
        },

        onError: (error) => {
          if (!navigator.onLine || error.message.includes("failed to fetch")) {
            setUploadProgress((prev) => ({
              ...prev,
              [imageSrc]: {
                ...prev[imageSrc],
                progress: maxProgressSoFar,
                status: "error",
                errorMessage: tAlerts("networkError"),
              },
            }));
            return;
          }

          cleanupListeners();
          activeUploadsRef.current.delete(imageSrc);

          const errorKey = getSupabaseErrorKey(error);
          const localizedMsg = tUpload(errorKey);

          setUploadProgress((prev) => ({
            ...prev,
            [imageSrc]: {
              ...prev[imageSrc],
              status: "error",
              errorMessage: localizedMsg,
            },
          }));

          toast.add({
            type: "success",
            title: `${file.name}: ${localizedMsg}`,
          });

          setFieldErrors((prev) => ({
            ...prev,
            images: [localizedMsg],
          }));

          reject(error);
        },
      });

      activeUploadsRef.current.set(imageSrc, uploadInstance);

      window.addEventListener("online", handleOnline);

      uploadInstance
        .findPreviousUploads()
        .then((previousUploads) => {
          if (previousUploads.length) {
            uploadInstance.resumeFromPreviousUpload(previousUploads[0]);
          }
          uploadInstance.start();
        })
        .catch(() => {
          uploadInstance.start();
        });
    });
  };

  const handleNameChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setFormData((prev) => ({ ...prev, name: val, slug }));
    clearFieldError("name");
    clearFieldError("slug");
  };

  const handleStockChange = (key: string, field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      stocks: prev.stocks.map((item) =>
        item.key === key ? { ...item, [field]: value } : item,
      ),
    }));
    clearFieldError("stocks");
  };

  const addStockRow = () => {
    if (warehouses.length > 0) {
      setFormData((prev) => ({
        ...prev,
        stocks: [
          ...prev.stocks,
          { key: crypto.randomUUID(), id: warehouses[0].id, sizeType: "ALL", sizeDetail: "", qty: 0 }
        ]
      }));
    }
  };

  const removeStockRow = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      stocks: prev.stocks.filter(item => item.key !== key)
    }));
  };

  const handleFilesAdded = (
    filesWithUrls: { file: File; blobUrl: string }[],
  ) => {
    filesWithUrls.forEach(({ file, blobUrl }) => {
      filesMapRef.current.set(blobUrl, file);
    });
  };

  const handleUpdate = async () => {
    if (!initialData?.id) return;
    setIsUploading(true);
    setFieldErrors({});

    try {
      const uploadPromises = formData.images.map(async (imgSrc) => {
        if (!imgSrc.startsWith("blob:")) return imgSrc;
        try {
          return await executeTusUpload(imgSrc);
        } catch {
          return null;
        }
      });

      const uploadedResults = await Promise.all(uploadPromises);
      const finalImageUrls = uploadedResults.filter(
        (url): url is string => url !== null && url !== "",
      );

      if (
        formData.images.some((img) => img.startsWith("blob:")) &&
        finalImageUrls.length !== formData.images.length
      ) {
        setIsUploading(false);
        return;
      }

      const payload = {
        id: initialData.id,
        name: formData.name,
        slug: formData.slug,
        price: Number(formData.price) || 0,
        weight: formData.weight ? Number(formData.weight) : null,
        description: formData.description,
        isFeatured: formData.isFeatured,
        status: formData.status,
        categoryId: formData.categoryId,
        stocks: formData.stocks.map(s => {
          let finalSize = s.sizeType;
          if (s.sizeType !== "ALL" && s.sizeDetail.trim() !== "") {
            finalSize = `${s.sizeType} - ${s.sizeDetail.trim()}`;
          }
          return {
            id: s.id,
            size: finalSize,
            qty: s.qty
          };
        }),
        images: finalImageUrls,
      };

      startTransition(() => {
        formAction(payload);
      });
    } catch (error) {
      console.error("Failed to update product data:", error);
      toast.add({
        type: "error",
        title: tAlerts("failed"),
        description: tAlerts("generalError"),
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading || isPending) {
      activeUploadsRef.current.forEach((upload) => upload.abort());
    }
    router.back();
  };

  const isSubmitting = isUploading || isPending;

  // Helper render error per field dengan penerjemahan dinamis
  const renderError = (fieldKey: string) => {
    if (!fieldErrors[fieldKey] || fieldErrors[fieldKey].length === 0)
      return null;
    return (
      <p className="text-xs font-medium text-red-500 dark:text-red-400 mt-1">
        {translateServerMessage(fieldErrors[fieldKey][0], tValidation)}
      </p>
    );
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] flex flex-col p-0 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 transition-colors">
        <DialogHeader className="p-6 border-b border-zinc-100 dark:border-zinc-900">
          <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {t("titleEdit")}
          </DialogTitle>
        </DialogHeader>

        <div className="no-scrollbar overflow-y-auto px-4 flex-1">
          <form className="space-y-6 py-4" autoComplete="off" onSubmit={(e) => e.preventDefault()}>
            {/* Input Nama & Slug */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("labelName")}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  disabled={isSubmitting}
                  className={
                    fieldErrors.name
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {renderError("name")}
              </div>
              <div className="space-y-2">
                <Label>{t("labelSlug")}</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => {
                    setFormData({ ...formData, slug: e.target.value });
                    clearFieldError("slug");
                  }}
                  disabled={isSubmitting}
                  className={
                    fieldErrors.slug
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {renderError("slug")}
              </div>
            </div>

            {/* Kategori, Harga, Weight */}
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>{t("labelCategory")}</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(val) => {
                    setFormData({ ...formData, categoryId: val ?? "" });
                    clearFieldError("categoryId");
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    className={`w-full ${fieldErrors.categoryId ? "border-red-500 focus:ring-red-500" : ""}`}
                  >
                    {formData.categoryId ? (
                      categories.find((cat) => cat.id === formData.categoryId)
                        ?.name || t("placeholderCategory")
                    ) : (
                      <SelectValue placeholder={t("placeholderCategory")} />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {renderError("categoryId")}
              </div>
              <div className="space-y-2">
                <Label>{t("labelPrice")}</Label>

                {/* Container Input dengan Prefix Mata Uang */}
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm text-muted-foreground font-medium select-none pointer-events-none">
                    {currencySymbol}
                  </span>
                  <Input
                    type="text" // Diubah ke "text" agar mendukung format titik/koma ribuan
                    inputMode="numeric" // Memunculkan keypad angka di HP/mobile
                    placeholder="0"
                    // Tampilkan nilai berformat ribuan sesuai locale aktif
                    value={formatCurrencyInput(formData.price, locale)}
                    disabled={isSubmitting}
                    onChange={(e) => {
                      // Ambil nilai angka murninya dari input teks
                      const rawNumber = parseCurrencyInput(e.target.value);

                      setFormData({
                        ...formData,
                        price: rawNumber, // formData.price tetap tersimpan sebagai angka murni (misal: 100000)
                      });
                      clearFieldError("price");
                    }}
                    className={`pl-9 ${fieldErrors.price ? "border-red-500" : ""}`}
                  />
                </div>

                {renderError("price")}
              </div>
              <div className="space-y-2">
                <Label>{t("labelWeight")}</Label>
                <Input
                  type="number"
                  value={formData.weight}
                  min={0}
                  onChange={(e) => {
                    setFormData({ ...formData, weight: e.target.value });
                    clearFieldError("weight");
                  }}
                  disabled={isSubmitting}
                  className={
                    fieldErrors.weight
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {renderError("weight")}
              </div>
            </div>

            {/* Stok Gudang */}
            <div className="space-y-3">
              <Label>{t("labelWarehouseStock")}</Label>
              <div
                className={`flex flex-col gap-3 ${fieldErrors.stocks ? "border-red-500 rounded-xl border p-4" : ""
                  }`}
              >
                {formData.stocks.map((whStock) => {
                  return (
                    <div
                      key={whStock.key}
                      className="grid grid-cols-12 gap-3 items-center p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-900/50"
                    >
                      <div className="col-span-12 sm:col-span-4">
                        <Select
                          value={whStock.id}
                          onValueChange={(val) => handleStockChange(whStock.key, "id", val || "")}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className="w-full">
                            {whStock.id ? (
                              warehouses.find((w) => w.id === whStock.id)
                                ?.warehouseName || t("placeholderWarehouse")
                            ) : (
                              <SelectValue placeholder={t("placeholderWarehouse")} />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {warehouses.map((w) => (
                              <SelectItem key={w.id} value={w.id}>{w.warehouseName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className={`col-span-6 ${whStock.sizeType !== "ALL" ? "sm:col-span-2" : "sm:col-span-3"}`}>
                        <Select
                          value={whStock.sizeType}
                          onValueChange={(val) => handleStockChange(whStock.key, "sizeType", val || "")}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Size Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">ALL / ONE SIZE</SelectItem>
                            <SelectItem value="S">S</SelectItem>
                            <SelectItem value="M">M</SelectItem>
                            <SelectItem value="L">L</SelectItem>
                            <SelectItem value="XL">XL</SelectItem>
                            <SelectItem value="XXL">XXL</SelectItem>
                            <SelectItem value="Shoes">Shoes</SelectItem>
                            <SelectItem value="Pants">Pants</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {whStock.sizeType !== "ALL" && (
                        <div className="col-span-6 sm:col-span-2">
                          <Input
                            className="w-full"
                            placeholder="Detail (e.g. 42)"
                            value={whStock.sizeDetail}
                            onChange={(e) => handleStockChange(whStock.key, "sizeDetail", e.target.value)}
                            disabled={isSubmitting}
                          />
                        </div>
                      )}

                      <div className={`col-span-10 flex items-center gap-2 ${whStock.sizeType !== "ALL" ? "sm:col-span-3" : "sm:col-span-4"}`}>
                        <Label className="whitespace-nowrap hidden sm:block">Qty:</Label>
                        <Input
                          className="w-full"
                          type="number"
                          min={0}
                          placeholder="Stock Quantity"
                          value={whStock.qty === 0 ? "" : whStock.qty}
                          disabled={isSubmitting}
                          onChange={(e) => {
                            const val = e.target.value;
                            const parsedQty = val === "" ? 0 : Math.max(0, parseInt(val, 10) || 0);
                            handleStockChange(whStock.key, "qty", parsedQty);
                          }}
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStockRow(whStock.key)}
                          disabled={isSubmitting || formData.stocks.length === 1}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addStockRow}
                  disabled={isSubmitting}
                  className="w-fit mt-2 border-dashed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stock Row
                </Button>
              </div>
              {renderError("stocks")}
            </div>

            {/* Status & Featured */}
            <div className="flex flex-wrap gap-12 p-4 border rounded-xl border-zinc-100 dark:border-zinc-900">
              <div className="space-y-3">
                <Label>{t("labelStatus")}</Label>
                <RadioGroup
                  value={formData.status}
                  onValueChange={(val: any) => {
                    setFormData({ ...formData, status: val });
                    clearFieldError("status");
                  }}
                  className="flex gap-6"
                  disabled={isSubmitting}
                >
                  {["DRAFT", "ACTIVE", "BLOCKED"].map((st) => (
                    <div key={st} className="flex items-center space-x-2">
                      <RadioGroupItem value={st} id={st.toLowerCase()} />
                      <Label
                        htmlFor={st.toLowerCase()}
                        className="cursor-pointer font-normal"
                      >
                        {t(`status${st.charAt(0) + st.slice(1).toLowerCase()}`)}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {renderError("status")}
              </div>

              <div className="flex flex-col justify-end space-y-2">
                <Label htmlFor="featured">{t("labelFeatured")}</Label>
                <div className="flex items-center h-9">
                  <Switch
                    id="featured"
                    checked={formData.isFeatured}
                    disabled={isSubmitting}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isFeatured: checked })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Deskripsi */}
            <div className="space-y-2">
              <Label>{t("labelDescription")}</Label>
              <Textarea
                rows={4}
                value={formData.description}
                disabled={isSubmitting}
                className={
                  fieldErrors.description
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  clearFieldError("description");
                }}
              />
              {renderError("description")}
            </div>

            {/* DRAG DROP IMAGE UPLOAD */}
            <div className="space-y-2">
              <Label>{t("labelImages")}</Label>
              <DragDropImageUpload
                images={formData.images}
                onChange={handleImagesChange}
                onFilesAdded={handleFilesAdded}
                uploadProgress={uploadProgress}
                onCancelUpload={cancelUpload}
                translation={t}
              />
              {renderError("images")}
            </div>

            {/* BAR PROGRESS UPLOAD & ERROR */}
            {Object.keys(uploadProgress).length > 0 && (
              <div className="space-y-3 p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  {t("uploadProgress")}
                </p>
                <div className="space-y-3">
                  {Object.entries(uploadProgress).map(
                    ([fileId, fileProgress]) => (
                      <div key={fileId} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate max-w-[60%]">
                            {fileProgress.fileName}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-semibold ${fileProgress.status === "success"
                                ? "text-emerald-600"
                                : fileProgress.status === "cancelled"
                                  ? "text-amber-600"
                                  : fileProgress.status === "error"
                                    ? "text-rose-600"
                                    : "text-blue-600"
                                }`}
                            >
                              {fileProgress.status === "success"
                                ? "Selesai"
                                : fileProgress.status === "cancelled"
                                  ? "Dibatalkan"
                                  : fileProgress.status === "error"
                                    ? fileProgress.errorMessage || tAlerts("failed")
                                    : `${fileProgress.progress}%`}
                            </span>

                            {fileProgress.status === "uploading" && (
                              <button
                                type="button"
                                onClick={() => cancelUpload(fileId)}
                                className="text-rose-500 hover:text-rose-700 p-0.5 rounded transition-colors"
                                title="Batalkan pengunggahan"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ease-out ${fileProgress.status === "success"
                              ? "bg-emerald-500"
                              : fileProgress.status === "cancelled"
                                ? "bg-amber-500"
                                : fileProgress.status === "error"
                                  ? "bg-rose-500"
                                  : "bg-blue-500"
                              }`}
                            style={{
                              width: `${fileProgress.status === "cancelled" ||
                                fileProgress.status === "error"
                                ? 100
                                : fileProgress.progress
                                }%`,
                            }}
                          />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <DialogFooter className="p-5 border-t border-zinc-100 dark:border-zinc-900">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {t("btnCancel")}
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isSubmitting}
            className="bg-orange-600 text-orange-50 hover:bg-orange-700 min-w-[100px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              t("btnSave")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
