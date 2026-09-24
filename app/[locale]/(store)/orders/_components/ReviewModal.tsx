"use client";

import React, { useState, useMemo } from "react";
import { X, Upload, Trash2, Star } from "lucide-react";
import { uploadImage } from "@/app/actions/storage";
import { completeOrderAndReview } from "@/app/actions/orders";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function ReviewModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const tAlerts = useTranslations("Alerts");
  const t = useTranslations("Orders");

  // Extract unique products from order shipments
  const products = useMemo(() => {
    if (!order?.shipments) return [];
    const uniqueProducts = new Map();
    order.shipments.forEach((shipment: any) => {
      shipment.items.forEach((item: any) => {
        if (!uniqueProducts.has(item.product.id)) {
          uniqueProducts.set(item.product.id, item.product);
        }
      });
    });
    return Array.from(uniqueProducts.values());
  }, [order]);

  const [reviews, setReviews] = useState<Record<string, { rating: number; message: string; images: File[] }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRatingChange = (productId: string, rating: number) => {
    setReviews(prev => ({
      ...prev,
      [productId]: { ...prev[productId], rating, message: prev[productId]?.message || "", images: prev[productId]?.images || [] }
    }));
  };

  const handleMessageChange = (productId: string, message: string) => {
    setReviews(prev => ({
      ...prev,
      [productId]: { ...prev[productId], rating: prev[productId]?.rating || 0, message, images: prev[productId]?.images || [] }
    }));
  };

  const handleFileChange = (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles = selectedFiles.filter(file => {
        if (!file.type.startsWith("image/")) {
          alert(tAlerts("onlyImagesAllowed"));
          return false;
        }
        if (file.size > 5 * 1024 * 1024) {
          alert(tAlerts("maxImageSize"));
          return false;
        }
        return true;
      });

      const currentImages = reviews[productId]?.images || [];
      if (currentImages.length + validFiles.length > 2) {
        alert(tAlerts("maxImagesAllowed", { max: 2 }));
        return;
      }

      setReviews(prev => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          rating: prev[productId]?.rating || 0,
          message: prev[productId]?.message || "",
          images: [...currentImages, ...validFiles].slice(0, 2)
        }
      }));
    }
  };

  const removeImage = (productId: string, indexToRemove: number) => {
    setReviews(prev => {
      const updatedImages = (prev[productId]?.images || []).filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        [productId]: { ...prev[productId], images: updatedImages }
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all products have rating
    for (const p of products) {
      if (!reviews[p.id]?.rating || reviews[p.id].rating === 0) {
        setError(tAlerts("ratingRequired", { productName: p.name }));
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const finalReviews = [];

      for (const p of products) {
        const reviewData = reviews[p.id];
        const imageUrls: string[] = [];

        // Upload images for this product
        if (reviewData.images && reviewData.images.length > 0) {
          for (const file of reviewData.images) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("bucket", "product-image-reviews");

            const uploadResult = await uploadImage(formData);
            if (uploadResult.success && uploadResult.url) {
              imageUrls.push(uploadResult.url);
            } else {
              throw new Error(tAlerts("uploadImageFailed"));
            }
          }
        }

        finalReviews.push({
          productId: p.id,
          rating: reviewData.rating,
          message: reviewData.message,
          images: imageUrls,
        });
      }

      const res = await completeOrderAndReview({
        orderId: order.id,
        reviews: finalReviews,
      });

      if (!res.success) {
        throw new Error(res.error || tAlerts("saveReviewFailed"));
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || tAlerts("generalError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">{t("completeOrder")}</h2>
            <p className="text-sm text-zinc-500 mt-1">{t("giveReviewDesc")}</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-8 flex-1">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 shrink-0">
              {error}
            </div>
          )}

          {products.map((product) => {
            const pReview = reviews[product.id] || { rating: 0, message: "", images: [] };

            return (
              <div key={product.id} className="bg-zinc-50 p-5 rounded-xl border border-zinc-200">
                <div className="flex gap-4 items-center mb-4">
                  <div className="h-16 w-16 relative rounded-lg overflow-hidden bg-white border border-zinc-200 shrink-0">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full text-zinc-400">
                        📦
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-zinc-900 flex-1">{product.name}</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">{t("productRating")} <span className="text-red-500">*</span></label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingChange(product.id, star)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-8 h-8 ${pReview.rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-300'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">{t("reviewOptional")}</label>
                    <textarea
                      value={pReview.message}
                      onChange={(e) => handleMessageChange(product.id, e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent min-h-[80px]"
                      placeholder={t("reviewPlaceholder")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">{t("reviewPhotoOptional")}</label>
                    <div className="flex flex-wrap gap-4">
                      {pReview.images.map((img: File, idx: number) => (
                        <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-200">
                          <img src={URL.createObjectURL(img)} alt="Preview" className="object-cover w-full h-full" />
                          <button
                            type="button"
                            onClick={() => removeImage(product.id, idx)}
                            className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500 hover:bg-white"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {pReview.images.length < 2 && (
                        <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-zinc-300 rounded-lg cursor-pointer hover:bg-zinc-50 transition-colors">
                          <Upload className="w-5 h-5 text-zinc-400" />
                          <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleFileChange(product.id, e)} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

        </form>
        <div className="p-6 border-t border-zinc-100 flex gap-3 bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-zinc-100 text-zinc-700 font-medium rounded-xl hover:bg-zinc-200 transition-colors"
          >{t("cancel")}</button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-black text-white font-medium rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t("saving") : t("completeOrderAndReview")}
          </button>
        </div>
      </div>
    </div>
  );
}
