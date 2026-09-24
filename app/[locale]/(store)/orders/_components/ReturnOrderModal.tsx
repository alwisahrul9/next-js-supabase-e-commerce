"use client";

import React, { useState, useEffect } from "react";
import { X, Upload, Trash2, Truck } from "lucide-react";
import { uploadImage } from "@/app/actions/storage";
import { submitReturnRequest, updateReturnRequest } from "@/app/actions/orders";
import { calculateShippingCost } from "@/app/actions/shipping";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function ReturnOrderModal({
  orderItem,
  defaultAddress,
  isOpen,
  onClose,
  onSuccess,
}: {
  orderItem: any | null;
  defaultAddress: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const tAlerts = useTranslations("Alerts");
  const t = useTranslations("Orders");
  const [reason, setReason] = useState("");
  const [refundAccount, setRefundAccount] = useState("");
  
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shipping state
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<string>("jne");
  const [selectedService, setSelectedService] = useState<{ service: string; cost: number } | null>(null);

  const isEditMode = !!orderItem?.orderReturn;

  useEffect(() => {
    if (isOpen && orderItem) {
      if (isEditMode) {
        setReason(orderItem.orderReturn.reason || "");
        setRefundAccount(orderItem.orderReturn.refundAccount || "");
        setExistingImages(orderItem.orderReturn.images || []);
        setNewImages([]);
        setSelectedCourier(orderItem.orderReturn.shippingCourier || "jne");
        if (orderItem.orderReturn.shippingService && orderItem.orderReturn.shippingCost !== null) {
          setSelectedService({
            service: orderItem.orderReturn.shippingService,
            cost: orderItem.orderReturn.shippingCost
          });
        }
      } else {
        setReason("");
        setRefundAccount("");
        setExistingImages([]);
        setNewImages([]);
        setSelectedCourier("jne");
        setSelectedService(null);
      }
      
      // Fetch shipping cost if cities are available
      fetchShippingCosts(isEditMode ? orderItem.orderReturn?.shippingCourier || "jne" : "jne");
    }
  }, [isOpen, orderItem, isEditMode]);

  const fetchShippingCosts = async (courier: string) => {
    if (!orderItem?.shipment?.warehouse?.cityId || !defaultAddress?.cityId) {
      return;
    }
    
    setIsLoadingShipping(true);
    setAvailableServices([]);
    
    try {
      const weight = (orderItem.product?.weight || 1000) * orderItem.quantity;
      const originCityId = defaultAddress.cityId;
      const destinationCityId = orderItem.shipment.warehouse.cityId;

      const result = await calculateShippingCost(
        originCityId,
        destinationCityId,
        weight,
        courier
      );

      if (result && result.costs) {
        setAvailableServices(result.costs);
        
        // Reset selected service if it's not in the new list, unless we are in initial edit mode load
        if (isEditMode && selectedService && courier === orderItem.orderReturn.shippingCourier) {
           // keep it
        } else {
           setSelectedService(null);
        }
      }
    } catch (err) {
      console.error("Error fetching shipping costs", err);
    } finally {
      setIsLoadingShipping(false);
    }
  };

  const handleCourierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCourier = e.target.value;
    setSelectedCourier(newCourier);
    fetchShippingCosts(newCourier);
  };

  if (!isOpen || !orderItem) return null;

  const totalImagesCount = existingImages.length + newImages.length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      if (existingImages.length + newImages.length + validFiles.length > 2) {
        alert(tAlerts("maxImagesAllowed", { max: 2 }));
        return;
      }
      setNewImages((prev) => [...prev, ...validFiles].slice(0, 2 - existingImages.length));
    }
  };

  const removeExistingImage = (idx: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeNewImage = (idx: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !refundAccount.trim()) {
      setError(tAlerts("allFieldsRequired"));
      return;
    }
    
    if (!selectedService) {
      setError(tAlerts("selectReturnShippingService"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Upload new images
      const newImageUrls: string[] = [];
      for (const file of newImages) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", "product-images-return");

        const uploadResult = await uploadImage(formData);
        if (uploadResult.success && uploadResult.url) {
          newImageUrls.push(uploadResult.url);
        } else {
          throw new Error(tAlerts("uploadImageFailed"));
        }
      }
      
      const finalImages = [...existingImages, ...newImageUrls];

      // 2. Submit or Update Return Request
      let res;
      if (isEditMode) {
        res = await updateReturnRequest({
          returnId: orderItem.orderReturn.id,
          reason,
          refundAccount,
          images: finalImages,
          shippingCourier: selectedCourier,
          shippingService: selectedService.service,
          shippingCost: selectedService.cost,
        });
      } else {
        res = await submitReturnRequest({
          orderItemId: orderItem.id,
          reason,
          refundAccount,
          images: finalImages,
          shippingCourier: selectedCourier,
          shippingService: selectedService.service,
          shippingCost: selectedService.cost,
        });
      }

      if (!res.success) {
        throw new Error(res.error || tAlerts("saveReturnFailed"));
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || tAlerts("generalError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 shrink-0">
          <h2 className="text-xl font-bold text-zinc-900">
            {isEditMode ? t("editReturn") : t("submitReturn")}
          </h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          {/* Product and Destination Info */}
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
            <h3 className="text-sm font-semibold text-zinc-900 mb-2">{t("returnedItemLabel")}</h3>
            <div className="text-sm text-zinc-600 flex justify-between items-center mb-4">
              <span>{orderItem.product?.name} {orderItem.size !== "ALL" ? `(${orderItem.size})` : ""}</span>
              <span className="font-medium text-zinc-900">x{orderItem.quantity}</span>
            </div>

            <h3 className="text-sm font-semibold text-zinc-900 mb-2 border-t border-zinc-200 pt-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-zinc-500" />
              {t("returnDestinationWarehouse")}
            </h3>
            <div className="text-sm text-zinc-600">
              <p className="font-medium text-zinc-900">{orderItem.shipment?.warehouse?.warehouseName}</p>
              <p>{orderItem.shipment?.warehouse?.city}, {orderItem.shipment?.warehouse?.province}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">{t("returnReason")}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent min-h-[100px]"
              placeholder={t("reasonPlaceholder")}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">{t("photoEvidence")}</label>
            <div className="flex flex-wrap gap-4">
              {/* Existing Images */}
              {existingImages.map((imgUrl, idx) => (
                <div key={`exist-${idx}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-zinc-200">
                  <Image src={imgUrl} alt="Preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(idx)}
                    className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500 hover:bg-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {/* New Images */}
              {newImages.map((img, idx) => (
                <div key={`new-${idx}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-zinc-200">
                  <img src={URL.createObjectURL(img)} alt="Preview" className="object-cover w-full h-full" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500 hover:bg-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {totalImagesCount < 2 && (
                <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-zinc-300 rounded-lg cursor-pointer hover:bg-zinc-50 transition-colors">
                  <Upload className="w-6 h-6 text-zinc-400" />
                  <span className="text-[10px] text-zinc-500 mt-1">{t("uploadPhoto")}</span>
                  <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">{t("bankInfo")}</label>
            <input
              type="text"
              value={refundAccount}
              onChange={(e) => setRefundAccount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder={t("bankInfoPlaceholder")}
              required
            />
          </div>
          
          {/* Shipping Selection */}
          <div className="border-t border-zinc-200 pt-6">
            <h3 className="text-sm font-medium text-zinc-900 mb-4">{t("returnShipping")}</h3>
            
            {!defaultAddress?.cityId || !orderItem?.shipment?.warehouse?.cityId ? (
              <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-100">
                {t("addressIncomplete")}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-600 mb-2">{t("selectCourier")}</label>
                  <select
                    value={selectedCourier}
                    onChange={handleCourierChange}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                  >
                    <option value="jne">JNE</option>
                    <option value="pos">POS Indonesia</option>
                    <option value="tiki">TIKI</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-zinc-600 mb-2">{t("service")}</label>
                  {isLoadingShipping ? (
                    <div className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-zinc-400 border-t-zinc-800 mr-2"></div>
                      {t("calculatingShipping")}
                    </div>
                  ) : availableServices.length > 0 ? (
                    <div className="space-y-2">
                      {availableServices.map((srv: any, idx: number) => {
                        const serviceName = srv.service || srv.name;
                        const cost = srv.cost[0].value;
                        const etd = srv.cost[0].etd;
                        const isSelected = selectedService?.service === serviceName;
                        
                        return (
                          <div 
                            key={idx}
                            onClick={() => setSelectedService({ service: serviceName, cost })}
                            className={`p-3 rounded-xl border cursor-pointer flex justify-between items-center transition-colors ${
                              isSelected 
                                ? 'border-black bg-zinc-50' 
                                : 'border-zinc-200 hover:border-zinc-300'
                            }`}
                          >
                            <div>
                              <div className="font-medium text-zinc-900">{serviceName}</div>
                              {etd && <div className="text-xs text-zinc-500">{t("estimatedDays", { days: etd })}</div>}
                            </div>
                            <div className="font-bold text-zinc-900">
                              {formatCurrency(cost)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500 text-sm">
                      {t("serviceNotAvailable")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 mt-4 border-t border-zinc-100 flex gap-3 shrink-0 pb-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-zinc-100 text-zinc-700 font-medium rounded-xl hover:bg-zinc-200 transition-colors"
            >{t("cancel")}</button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedService}
              className="flex-1 px-4 py-3 bg-black text-white font-medium rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t("saving") : t("saveReturn")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
