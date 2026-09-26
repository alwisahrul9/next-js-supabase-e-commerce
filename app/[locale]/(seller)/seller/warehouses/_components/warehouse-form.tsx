/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { warehouseSchema, WarehouseInput } from "@/app/lib/validations/seller";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Controller, useWatch } from "react-hook-form";
import { Loader2, ArrowLeft, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";;
import { toast } from "@/components/ui/toast";
import { useTranslations, useLocale } from "next-intl";
import { createWarehouse, updateWarehouse } from "@/app/actions/warehouse";
import { getProvinces, getCities, getDistricts, getVillages } from "@/app/actions/shipping";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/map-picker"), { ssr: false, loading: () => <div className="h-64 w-full bg-zinc-100 animate-pulse rounded-xl" /> });

interface WarehouseFormProps {
  initialData?: WarehouseInput;
  warehouseId?: string;
}

export default function WarehouseForm({ initialData, warehouseId }: WarehouseFormProps) {
    const locale = useLocale();
  const t = useTranslations("WarehousePage");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [provinces, setProvinces] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cities, setCities] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [districts, setDistricts] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [villages, setVillages] = useState<any[]>([]);

  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingVillages, setIsLoadingVillages] = useState(false);
  const [isManualVillage, setIsManualVillage] = useState(false);

  const form = useForm<WarehouseInput>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: initialData || {
      warehouseName: "",
      province: "",
      city: "",
      cityId: "",
      district: "",
      districtId: "",
      village: "",
      villageId: "",
      postcode: "",
      streetAddress: "",
      latitude: -6.2088,
      longitude: 106.8456,
    },
  });

  const provinceValue = useWatch({ control: form.control, name: "province" });
  const cityIdValue = useWatch({ control: form.control, name: "cityId" });
  const districtIdValue = useWatch({ control: form.control, name: "districtId" });
  const latValue = useWatch({ control: form.control, name: "latitude" });
  const lngValue = useWatch({ control: form.control, name: "longitude" });
  const villageValue = useWatch({ control: form.control, name: "village" });

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

  const tAlerts = useTranslations("Alerts");

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("latitude", position.coords.latitude);
          form.setValue("longitude", position.coords.longitude);
          toast.add({ type: "success", title: tAlerts("locationSuccess") });
        },
        () => {
          toast.add({ type: "error", title: tAlerts("locationError") });
        }
      );
    } else {
      toast.add({ type: "error", title: "Geolocation tidak didukung" });
    }
  };

  const isEditMode = !!warehouseId;

  const onSubmit = async (data: WarehouseInput) => {
    setIsSubmitting(true);
    try {
      let res;
      if (isEditMode) {
        res = await updateWarehouse(warehouseId, data);
      } else {
        res = await createWarehouse(data);
      }

      if (res.success) {
        toast.add({ type: "success", title: isEditMode ? t("updateSuccess") : t("createSuccess") });
        router.push(`/${locale}/seller/warehouses`);
        router.refresh();
      } else {
        toast.add({ type: "error", title: res.message || t("failed") });
        if (res.errors) {
          const errors = res.errors as Record<string, string[]>;
          Object.keys(errors).forEach((key) => {
            form.setError(key as keyof WarehouseInput, {
              type: "server",
              message: errors[key][0],
            });
          });
        }
      }
    } catch {
      toast.add({ type: "error", title: t("failed") });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/seller/warehouses`}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isEditMode ? t("editWarehouseTitle") : t("createWarehouseTitle")}
              </h1>
              <p className="text-sm text-zinc-500">
                {isEditMode ? t("editWarehouseSubtitle") : t("createWarehouseSubtitle")}
              </p>
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditMode ? t("saveChanges") : t("createWarehouse")}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("basicInfo")}</CardTitle>
                <CardDescription>{t("basicInfoDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label className="text-sm font-semibold leading-none">{t("warehouseName")}</label>
                  <Controller
                    control={form.control}
                    name="warehouseName"
                    render={({ field }) => (
                      <Input placeholder={t("warehouseNamePlaceholder")} {...field} disabled={isSubmitting} />
                    )}
                  />
                  {form.formState.errors.warehouseName && (
                    <p className="text-[0.8rem] font-medium text-destructive">
                      {t(form.formState.errors.warehouseName.message as string)}
                    </p>
                  )}
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4 bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="space-y-0.5">
                      <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t("setAsMainWarehouse") || "Jadikan Gudang Utama"}</label>
                      <p className="text-xs text-zinc-500">
                        Gudang utama digunakan sebagai titik awal pengiriman default.
                      </p>
                    </div>
                    <Controller
                      control={form.control}
                      name="isMain"
                      render={({ field }) => (
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card>
              <CardHeader>
                <CardTitle>{t("location")}</CardTitle>
                <CardDescription>{t("locationDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold leading-none">{t("province")}</label>
                    <Controller
                      control={form.control}
                      name="province"
                      render={({ field }) => (
                        <select
                          {...field}
                          disabled={isLoadingProvinces}
                          onChange={(e) => {
                            field.onChange(e);
                            form.setValue("city", "");
                            form.setValue("cityId", null);
                            form.setValue("district", "");
                            form.setValue("districtId", null);
                            form.setValue("village", "");
                            form.setValue("villageId", null);
                          }}
                          className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring ${form.formState.errors.province ? 'border-destructive' : 'border-input'}`}
                        >
                          <option value="">{t("selectProvince")}</option>
                          {provinces.map((p, i) => (
                            <option key={i} value={p.name || p.province}>{p.name || p.province}</option>
                          ))}
                        </select>
                      )}
                    />
                    {form.formState.errors.province && (
                      <p className="text-[0.8rem] font-medium text-destructive">
                        {t(form.formState.errors.province.message as string)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold leading-none">{t("city")}</label>
                    <Controller
                      control={form.control}
                      name="cityId"
                      render={({ field }) => (
                        <select
                          {...field}
                          value={field.value ?? ""}
                          disabled={isLoadingCities || !provinceValue}
                          onChange={(e) => {
                            field.onChange(e);
                            const selectedCity = cities.find(c => (c.id?.toString() || c.city_id) === e.target.value);
                            if (selectedCity) {
                              form.setValue("city", selectedCity.name || `${selectedCity.type} ${selectedCity.city_name}`);
                            }
                            form.setValue("district", "");
                            form.setValue("districtId", null);
                            form.setValue("village", "");
                            form.setValue("villageId", null);
                          }}
                          className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring ${form.formState.errors.city ? 'border-destructive' : 'border-input'}`}
                        >
                          <option value="">{t("selectCity")}</option>
                          {cities.map((c, i) => (
                            <option key={i} value={c.id || c.city_id}>{c.name || `${c.type} ${c.city_name}`}</option>
                          ))}
                        </select>
                      )}
                    />
                    {form.formState.errors.cityId && (
                      <p className="text-[0.8rem] font-medium text-destructive">
                        {t(form.formState.errors.cityId.message as string)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold leading-none">{t("district")}</label>
                    <Controller
                      control={form.control}
                      name="districtId"
                      render={({ field }) => (
                        <select
                          {...field}
                          value={field.value ?? ""}
                          disabled={isLoadingDistricts || !cityIdValue}
                          onChange={(e) => {
                            field.onChange(e);
                            const selectedDistrict = districts.find(d => (d.id?.toString() || d.subdistrict_id) === e.target.value);
                            if (selectedDistrict) {
                              form.setValue("district", selectedDistrict.name || selectedDistrict.subdistrict_name);
                            } else {
                              form.setValue("district", e.target.value);
                            }
                            form.setValue("village", "");
                            form.setValue("villageId", null);
                          }}
                          className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring ${form.formState.errors.district ? 'border-destructive' : 'border-input'}`}
                        >
                          <option value="">{t("selectDistrict")}</option>
                          {districts.map((d, i) => (
                            <option key={i} value={d.id || d.subdistrict_id}>{d.name || d.subdistrict_name}</option>
                          ))}
                        </select>
                      )}
                    />
                    {form.formState.errors.districtId && (
                      <p className="text-[0.8rem] font-medium text-destructive">
                        {t(form.formState.errors.districtId.message as string)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-semibold leading-none">{t("village")}</label>
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
                      control={form.control}
                      name="villageId"
                      render={({ field }) => isManualVillage || villages.length === 0 ? (
                        <Input
                          placeholder={t("villagePlaceholder")}
                          value={villageValue || ""}
                          onChange={(e) => {
                            form.setValue("village", e.target.value);
                            field.onChange(null);
                          }}
                          className={form.formState.errors.village ? 'border-destructive' : ''}
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
                              form.setValue("village", selectedVillage.name);
                              if (selectedVillage.zip_code) {
                                form.setValue("postcode", selectedVillage.zip_code);
                              }
                            }
                          }}
                          className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring ${form.formState.errors.village ? 'border-destructive' : 'border-input'}`}
                        >
                          <option value="">{t("selectVillage")}</option>
                          {villages.map((v, i) => (
                            <option key={i} value={v.id}>{v.name}</option>
                          ))}
                        </select>
                      )}
                    />
                    {(form.formState.errors.village || form.formState.errors.villageId) && (
                      <p className="text-[0.8rem] font-medium text-destructive">
                        {t((form.formState.errors.village?.message || form.formState.errors.villageId?.message) as string)}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold leading-none">{t("postcode")}</label>
                    <Controller
                      control={form.control}
                      name="postcode"
                      render={({ field }) => (
                        <Input placeholder={t("postcodePlaceholder")} {...field} />
                      )}
                    />
                    {form.formState.errors.postcode && (
                      <p className="text-[0.8rem] font-medium text-destructive">
                        {t(form.formState.errors.postcode.message as string)}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold leading-none">{t("streetAddress")}</label>
                    <Controller
                      control={form.control}
                      name="streetAddress"
                      render={({ field }) => (
                        <textarea
                          {...field}
                          rows={3}
                          placeholder={t("streetAddressPlaceholder")}
                          className={`flex min-h-[60px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none ${form.formState.errors.streetAddress ? 'border-destructive' : 'border-input'}`}
                        />
                      )}
                    />
                    {form.formState.errors.streetAddress && (
                      <p className="text-[0.8rem] font-medium text-destructive">
                        {t(form.formState.errors.streetAddress.message as string)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t("locationMap")}</label>
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
                      form.setValue("latitude", pos.lat);
                      form.setValue("longitude", pos.lng);
                    }}
                  />
                  {(form.formState.errors.latitude || form.formState.errors.longitude) && (
                    <p className="text-[0.8rem] font-medium text-destructive mt-2">
                      {t("locationRequired")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
