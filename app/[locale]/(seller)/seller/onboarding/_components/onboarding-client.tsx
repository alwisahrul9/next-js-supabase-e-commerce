"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";;
import { Store, MapPin, CheckCircle2, ChevronRight, Loader2, Upload, Plus, Trash2, Navigation } from "lucide-react";
import { getProvinces, getCities, getDistricts, getVillages } from "@/app/actions/shipping";
import { completeSellerOnboarding } from "@/app/actions/seller-onboarding";
import { toast } from "@/components/ui/toast";
import { uploadImage } from "@/app/actions/storage";
import { useSession } from "next-auth/react";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { useTranslations, useLocale } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { sellerOnboardingSchema, SellerOnboardingInput } from "@/app/lib/validations/seller";
import { Switch } from "@/components/ui/switch";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/map-picker"), { ssr: false, loading: () => <div className="h-64 w-full bg-zinc-100 animate-pulse rounded-xl" /> });

function WarehouseForm({
  index,
  control,
  remove,
  canRemove,
  setValue,
  errors,
  t,
  onSetMain
}: {
  index: number;
  control: any;
  remove: (index: number) => void;
  canRemove: boolean;
  setValue: any;
  errors: any;
  t: any;
  onSetMain?: (index: number) => void;
}) {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingVillages, setIsLoadingVillages] = useState(false);
  const [isManualVillage, setIsManualVillage] = useState(false);

  const provinceValue = useWatch({ control, name: `warehouses.${index}.province` });
  const cityIdValue = useWatch({ control, name: `warehouses.${index}.cityId` });
  const districtIdValue = useWatch({ control, name: `warehouses.${index}.districtId` });
  const latValue = useWatch({ control, name: `warehouses.${index}.latitude` });
  const lngValue = useWatch({ control, name: `warehouses.${index}.longitude` });
  const villageValue = useWatch({ control, name: `warehouses.${index}.village` });

  useEffect(() => {
    setIsLoadingProvinces(true);
    getProvinces().then((data) => {
      setProvinces(data || []);
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setIsLoadingProvinces(false);
    });
  }, []);

  useEffect(() => {
    if (provinceValue) {
      const prov = provinces.find(p => p.name === provinceValue || p.province === provinceValue);
      if (prov) {
        setIsLoadingCities(true);
        const provId = prov.id || prov.province_id;
        getCities(provId).then(data => {
          setCities(data || []);
        }).finally(() => {
          setIsLoadingCities(false);
        });
      }
    } else {
      setCities([]);
    }
  }, [provinceValue, provinces]);

  useEffect(() => {
    if (cityIdValue) {
      setIsLoadingDistricts(true);
      getDistricts(cityIdValue).then(data => {
        setDistricts(data || []);
      }).finally(() => {
        setIsLoadingDistricts(false);
      });
    } else {
      setDistricts([]);
    }
  }, [cityIdValue]);

  useEffect(() => {
    if (districtIdValue) {
      setIsLoadingVillages(true);
      getVillages(districtIdValue).then(data => {
        setVillages(data || []);
        setIsManualVillage(!data || data.length === 0);
      }).finally(() => {
        setIsLoadingVillages(false);
      });
    } else {
      setVillages([]);
      setIsManualVillage(false);
    }
  }, [districtIdValue]);

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue(`warehouses.${index}.latitude`, position.coords.latitude);
          setValue(`warehouses.${index}.longitude`, position.coords.longitude);
          toast.add({ type: "success", title: t("locationSuccess") });
        },
        () => {
          toast.add({ type: "error", title: t("locationFailed") });
        }
      );
    } else {
      toast.add({ type: "error", title: t("geolocationNotSupported") });
    }
  };

  return (
    <div className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-xl relative space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h3 className="font-semibold">{t("warehouse")} {index + 1} {index === 0 ? t("primary") : ""}</h3>
        {canRemove && (
          <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-600 flex items-center gap-1 text-sm font-semibold">
            <Trash2 className="h-4 w-4" /> {t("delete")}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 flex items-center justify-between p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-900/50 dark:border-zinc-800">
          <div>
            <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t("setAsMainWarehouse") || "Jadikan Gudang Utama"}</label>
            <p className="text-xs text-zinc-500">Gudang utama digunakan sebagai titik awal pengiriman default.</p>
          </div>
          <Controller
            control={control}
            name={`warehouses.${index}.isMain`}
            render={({ field }) => (
              <Switch
                checked={field.value || false}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  if (checked && onSetMain) {
                    onSetMain(index);
                  }
                }}
              />
            )}
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t("warehouseName")}</label>
          <Controller
            control={control}
            name={`warehouses.${index}.warehouseName`}
            render={({ field }) => (
              <input
                {...field}
                value={field.value ?? ""}
                type="text"
                placeholder={t("warehouseNamePlaceholder")}
                className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-zinc-950 outline-none transition-all ${errors?.warehouseName ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/20'}`}
              />
            )}
          />
          {errors?.warehouseName?.message && <p className="text-xs text-red-500">{t(errors.warehouseName.message as any)}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t("province")}</label>
          <Controller
            control={control}
            name={`warehouses.${index}.province`}
            render={({ field }) => (
              <select
                {...field}
                value={field.value ?? ""}
                disabled={isLoadingProvinces}
                onChange={(e) => {
                  field.onChange(e);
                  setValue(`warehouses.${index}.city`, "");
                  setValue(`warehouses.${index}.cityId`, null);
                  setValue(`warehouses.${index}.district`, "");
                  setValue(`warehouses.${index}.districtId`, null);
                  setValue(`warehouses.${index}.village`, "");
                  setValue(`warehouses.${index}.villageId`, null);
                }}
                className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-zinc-950 outline-none transition-all ${errors?.province ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/20'}`}
              >
                <option value="">{t("selectProvince")}</option>
                {provinces.map((p, i) => (
                  <option key={i} value={p.name || p.province}>{p.name || p.province}</option>
                ))}
              </select>
            )}
          />
          {errors?.province?.message && <p className="text-xs text-red-500">{t(errors.province.message as any)}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t("city")}</label>
          <Controller
            control={control}
            name={`warehouses.${index}.cityId`}
            render={({ field }) => (
              <select
                {...field}
                value={field.value ?? ""}
                disabled={isLoadingCities || !provinceValue}
                onChange={(e) => {
                  field.onChange(e);
                  const selectedCity = cities.find(c => (c.id?.toString() || c.city_id) === e.target.value);
                  if (selectedCity) {
                    setValue(`warehouses.${index}.city`, selectedCity.name || `${selectedCity.type} ${selectedCity.city_name}`);
                  }
                  setValue(`warehouses.${index}.district`, "");
                  setValue(`warehouses.${index}.districtId`, null);
                  setValue(`warehouses.${index}.village`, "");
                  setValue(`warehouses.${index}.villageId`, null);
                }}
                className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-zinc-950 outline-none transition-all ${errors?.city ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/20'}`}
              >
                <option value="">{t("selectCity")}</option>
                {cities.map((c, i) => (
                  <option key={i} value={c.id || c.city_id}>{c.name || `${c.type} ${c.city_name}`}</option>
                ))}
              </select>
            )}
          />
          {errors?.city?.message && <p className="text-xs text-red-500">{t(errors.city.message as any)}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t("district")}</label>
          <Controller
            control={control}
            name={`warehouses.${index}.districtId`}
            render={({ field }) => (
              <select
                {...field}
                value={field.value ?? ""}
                disabled={isLoadingDistricts || !cityIdValue}
                onChange={(e) => {
                  field.onChange(e);
                  const selectedDistrict = districts.find(d => (d.id?.toString() || d.subdistrict_id) === e.target.value);
                  if (selectedDistrict) {
                    setValue(`warehouses.${index}.district`, selectedDistrict.name || selectedDistrict.subdistrict_name);
                  } else {
                    setValue(`warehouses.${index}.district`, e.target.value);
                  }
                  setValue(`warehouses.${index}.village`, "");
                  setValue(`warehouses.${index}.villageId`, null);
                }}
                className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-zinc-950 outline-none transition-all ${errors?.district ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/20'}`}
              >
                <option value="">{t("selectDistrict")}</option>
                {districts.map((d, i) => (
                  <option key={i} value={d.id || d.subdistrict_id}>{d.name || d.subdistrict_name}</option>
                ))}
              </select>
            )}
          />
          {errors?.district?.message && <p className="text-xs text-red-500">{t(errors.district.message as any)}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t("village")}</label>
            {villages.length > 0 && (
              <button
                type="button"
                onClick={() => setIsManualVillage(!isManualVillage)}
                className="text-xs text-orange-600 hover:underline"
              >
                {isManualVillage ? t("chooseFromList") : t("enterManually")}
              </button>
            )}
          </div>
          <Controller
            control={control}
            name={`warehouses.${index}.villageId`}
            render={({ field }) => isManualVillage || villages.length === 0 ? (
              <input
                type="text"
                placeholder={t("villagePlaceholder")}
                value={villageValue || ""}
                onChange={(e) => {
                  setValue(`warehouses.${index}.village`, e.target.value);
                  field.onChange(null);
                }}
                className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-zinc-950 outline-none transition-all ${errors?.village ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/20'}`}
              />
            ) : (
              <select
                {...field}
                value={field.value ?? ""}
                disabled={isLoadingVillages || !districtIdValue}
                onChange={(e) => {
                  field.onChange(e);
                  const selectedVillage = villages.find(v => v.id?.toString() === e.target.value);
                  if (selectedVillage) {
                    setValue(`warehouses.${index}.village`, selectedVillage.name);
                    if (selectedVillage.zip_code) {
                      setValue(`warehouses.${index}.postcode`, selectedVillage.zip_code);
                    }
                  }
                }}
                className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-zinc-950 outline-none transition-all ${errors?.village ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/20'}`}
              >
                <option value="">{t("selectVillage")}</option>
                {villages.map((v, i) => (
                  <option key={i} value={v.id}>{v.name}</option>
                ))}
              </select>
            )}
          />
          {errors?.village?.message && <p className="text-xs text-red-500">{t(errors.village.message as any)}</p>}
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t("postcode")}</label>
          <Controller
            control={control}
            name={`warehouses.${index}.postcode`}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                placeholder={t("postcodePlaceholder")}
                className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-zinc-950 outline-none transition-all ${errors?.postcode ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/20'}`}
              />
            )}
          />
          {errors?.postcode?.message && <p className="text-xs text-red-500">{t(errors.postcode.message as any)}</p>}
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t("streetAddress")}</label>
          <Controller
            control={control}
            name={`warehouses.${index}.streetAddress`}
            render={({ field }) => (
              <textarea
                {...field}
                rows={3}
                placeholder={t("streetAddressPlaceholder")}
                className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-zinc-950 outline-none transition-all resize-none ${errors?.streetAddress ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/20'}`}
              />
            )}
          />
          {errors?.streetAddress?.message && <p className="text-xs text-red-500">{t(errors.streetAddress.message as any)}</p>}
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t("location")}</label>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Navigation className="h-3.5 w-3.5" /> {t("useCurrentLocation")}
            </button>
          </div>
          <MapPicker
            position={latValue && lngValue ? { lat: latValue, lng: lngValue } : null}
            setPosition={(pos) => {
              setValue(`warehouses.${index}.latitude`, pos.lat);
              setValue(`warehouses.${index}.longitude`, pos.lng);
            }}
          />
          {(errors?.latitude || errors?.longitude) && (
            <p className="text-xs text-red-500">{t((errors.latitude?.message || errors.longitude?.message) as any)}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OnboardingClient({ locale }: { locale: string }) {
  const t = useTranslations("SellerOnboarding");
  const router = useRouter();
  const { update } = useSession();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<SellerOnboardingInput>({
    resolver: zodResolver(sellerOnboardingSchema),
    mode: "onChange",
    defaultValues: {
      storeName: "",
      storeDescription: "",
      logoUrl: "",
      warehouses: [{
        warehouseName: "",
        isMain: true,
        province: "",
        city: "",
        district: "",
        village: "",
        postcode: "",
        streetAddress: "",
      }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "warehouses"
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const storeNameValue = watch("storeName");

  const onSubmit = async (data: SellerOnboardingInput) => {
    setIsSubmitting(true);
    try {
      let finalLogoUrl = data.logoUrl;

      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);
        formData.append("bucket", "profiles");

        const uploadRes = await uploadImage(formData);
        if (!uploadRes.success) {
          toast.add({
            title: t("uploadLogoFailed"),
            description: uploadRes.message || t("uploadLogoFailedDesc"),
            type: "error"
          });
          setIsSubmitting(false);
          return;
        }
        if (uploadRes.url) {
          finalLogoUrl = uploadRes.url;
        }
      }

      const submitData = { ...data, logoUrl: finalLogoUrl };
      const res = await completeSellerOnboarding(submitData);

      if (res.success) {
        toast.add({
          title: t("success"),
          description: t("storeCreated"),
          type: "success"
        });

        // Memaksa update session di client
        await update({ storeProfile: res.data });
        router.push(`/${locale}/seller`);
      } else {
        toast.add({
          title: t("failed"),
          description: res.message === "storeNameTaken" ? t("storeNameTaken") : (res.message || t("createStoreFailed")),
          type: "error"
        });
        console.log(res.message)
        setIsSubmitting(false);
      }
    } catch (e: any) {
      console.error(e);
      toast.add({
        title: t("error"),
        description: t("somethingWentWrong"),
        type: "error"
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 sm:p-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{t("welcome")}</h1>
          <p className="text-zinc-500 mt-3 text-sm">{t("welcomeDesc")}</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center mb-12">
          <div className={`flex items-center gap-3 ${step >= 1 ? 'text-orange-600' : 'text-zinc-400'}`}>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
              1
            </div>
            <span className="font-semibold text-sm hidden sm:block">{t("storeProfile")}</span>
          </div>
          <div className={`h-0.5 w-16 sm:w-24 mx-4 ${step >= 2 ? 'bg-orange-600' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
          <div className={`flex items-center gap-3 ${step >= 2 ? 'text-orange-600' : 'text-zinc-400'}`}>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
              2
            </div>
            <span className="font-semibold text-sm hidden sm:block">{t("shippingWarehouse")}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Store Profile */}
          <div className={`${step === 1 ? 'block animate-in fade-in slide-in-from-right-4 duration-500' : 'hidden'}`}>
            <h2 className="text-xl font-semibold flex items-center gap-2 border-b pb-4 mb-6">
              <Store className="h-5 w-5 text-orange-500" />
              {t("storeInfo")}
            </h2>

            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="h-28 w-28 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center overflow-hidden relative group bg-zinc-50 dark:bg-zinc-800/50">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-zinc-400">
                    <Upload className="h-6 w-6 mb-1" />
                    <span className="text-[10px] font-medium uppercase tracking-wider">{t("logo")}</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <p className="text-xs text-zinc-500">{t("logoFormat")}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{t("storeName")}</label>
                <Controller
                  control={control}
                  name="storeName"
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder={t("storeNamePlaceholder")}
                      className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-zinc-950 outline-none transition-all ${errors.storeName ? 'border-red-500 focus:ring-red-500/20' : 'border-zinc-200 dark:border-zinc-800 focus:ring-orange-500/20 focus:border-orange-500'}`}
                    />
                  )}
                />
                {errors.storeName?.message && <p className="text-xs text-red-500 mt-1">{t(errors.storeName.message as any)}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{t("storeDescription")}</label>
                <Controller
                  control={control}
                  name="storeDescription"
                  render={({ field }) => (
                    <textarea
                      {...field}
                      placeholder={t("storeDescriptionPlaceholder")}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-none"
                    />
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                type="button"
                onClick={() => {
                  if (storeNameValue?.length >= 3) setStep(2);
                }}
                disabled={!storeNameValue || storeNameValue.length < 3}
                className="flex items-center gap-2 px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl font-semibold disabled:opacity-50 transition-all"
              >
                {t("next")}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Step 2: Warehouse */}
          <div className={`${step === 2 ? 'block animate-in fade-in slide-in-from-right-4 duration-500' : 'hidden'}`}>
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-500" />
                {t("shippingLocation")}
              </h2>
              <button
                type="button"
                onClick={() => append({
                  warehouseName: "",
                  isMain: false,
                  province: "",
                  city: "",
                  district: "",
                  village: "",
                  postcode: "",
                  streetAddress: "",
                } as any)}
                className="flex items-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-sm font-semibold rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" /> {t("addWarehouse")}
              </button>
            </div>

            <div className="space-y-6">
              {fields.map((field, index) => (
                <WarehouseForm
                  key={field.id}
                  index={index}
                  control={control}
                  remove={remove}
                  canRemove={fields.length > 1}
                  setValue={setValue}
                  errors={errors?.warehouses?.[index]}
                  t={t}
                  onSetMain={(selectedIndex) => {
                    fields.forEach((_, idx) => {
                      if (idx !== selectedIndex) {
                        setValue(`warehouses.${idx}.isMain`, false, { shouldValidate: true });
                      }
                    });
                  }}
                />
              ))}
            </div>

            {errors.warehouses?.root && (
              <p className="text-sm text-red-500 mt-2">{errors.warehouses.root.message}</p>
            )}

            <div className="flex justify-between pt-6 mt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3.5 text-zinc-600 dark:text-zinc-400 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
              >
                {t("back")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-600/20 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    {t("finishAndSell")}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
