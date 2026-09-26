"use client";

import { useState, useEffect, useActionState, startTransition } from "react";
import { useTranslations } from "next-intl";
import { updateProfile, addAddress, updateAddress, deleteAddress, setDefaultAddress, saveAddressAction, updateProfileAction } from "@/app/actions/profile";
import { toast } from "@/components/ui/toast";
import { signOut } from "next-auth/react";
import { Loader2, Plus, MapPin, Building, Home, Navigation, Trash2, Edit2, CheckCircle2, User, Phone, Save, LogOut } from "lucide-react";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { getCities, getProvinces, getDistricts, getVillages } from "@/app/actions/shipping";

const MapPicker = dynamic(() => import("@/components/map-picker"), { ssr: false, loading: () => <div className="h-64 w-full bg-zinc-100 animate-pulse rounded-xl" /> });

export default function ProfileClient({ initialData }: { initialData: any }) {
  const t = useTranslations("Profile");
  const tAlerts = useTranslations("Alerts");

  const [activeTab, setActiveTab] = useState<"info" | "address">("info");

  // Profile Info State
  const [name, setName] = useState(initialData.name || "");
  const [email, setEmail] = useState(initialData.email || "");
  const [phone, setPhone] = useState(initialData.phone || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [updateProfileState, updateProfileFormAction, isUpdatingProfile] = useActionState<any, any>(updateProfileAction, null);

  // Address State
  const [addresses, setAddresses] = useState<any[]>(initialData.addresses || []);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<any>(null);

  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingVillages, setIsLoadingVillages] = useState(false);
  const [isManualVillage, setIsManualVillage] = useState(false);

  const [isDeleteAddressModalOpen, setIsDeleteAddressModalOpen] = useState(false);
  const [addressToDeleteId, setAddressToDeleteId] = useState<string | null>(null);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);

  useEffect(() => {
    if (isAddingAddress && provinces.length === 0) {
      setIsLoadingProvinces(true);
      getProvinces().then((data) => {
        setProvinces(data || []);
      }).catch((err) => {
        console.error("Failed to fetch provinces", err);
        setProvinces([]);
      }).finally(() => {
        setIsLoadingProvinces(false);
      });
    }
  }, [isAddingAddress]);

  useEffect(() => {
    if (addressForm?.province) {
      const prov = provinces.find(p => p.name === addressForm.province || p.province === addressForm.province);
      if (prov) {
        setIsLoadingCities(true);
        const provId = prov.id || prov.province_id;
        getCities(provId).then(data => {
          setCities(data || []);
        }).catch((err) => {
          console.error("Failed to fetch cities", err);
          setCities([]);
        }).finally(() => {
          setIsLoadingCities(false);
        });
      }
    }
  }, [addressForm?.province, provinces]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      updateProfileFormAction({ name, email, phone, oldPassword, newPassword });
    });
  };

  useEffect(() => {
    if (updateProfileState) {
      if (updateProfileState.success) {
        toast.add({ type: "success", title: t("profileUpdated") });
        setOldPassword("");
        setNewPassword("");
      } else if (updateProfileState.msg) {
        toast.add({ type: "error", title: updateProfileState.msg });
      }
    }
  }, [updateProfileState, t]);

  useEffect(() => {
    if (addressForm?.cityId) {
      setIsLoadingDistricts(true);
      getDistricts(addressForm.cityId).then(data => {
        setDistricts(data || []);
      }).catch((err) => {
        console.error("Failed to fetch districts", err);
        setDistricts([]);
      }).finally(() => {
        setIsLoadingDistricts(false);
      });
    } else {
      setDistricts([]);
    }
  }, [addressForm?.cityId]);

  useEffect(() => {
    if (addressForm?.districtId) {
      setIsLoadingVillages(true);
      getVillages(addressForm.districtId).then(data => {
        setVillages(data || []);
        if (data && data.length === 0) {
          setIsManualVillage(true);
        } else {
          setIsManualVillage(false);
        }
      }).catch((err) => {
        console.error("Failed to fetch villages", err);
        setVillages([]);
        setIsManualVillage(true);
      }).finally(() => {
        setIsLoadingVillages(false);
      });
    } else {
      setVillages([]);
      setIsManualVillage(false);
    }
  }, [addressForm?.districtId]);

  const resetAddressForm = () => {
    setAddressForm({
      label: "home",
      receiverName: name,
      receiverPhone: phone,
      province: "",
      cityId: null,
      city: "",
      districtId: null,
      district: "",
      villageId: null,
      village: "",
      postcode: "",
      streetAddress: "",
      latitude: null,
      longitude: null,
      isDefault: addresses.length === 0
    });
  };

  const handleOpenAddAddress = () => {
    resetAddressForm();
    setEditingAddressId(null);
    setIsAddingAddress(true);
  };

  const handleOpenEditAddress = (addr: any) => {
    setAddressForm({ ...addr });
    setEditingAddressId(addr.id);
    setIsAddingAddress(true);
  };

  const [saveAddressState, saveAddressFormAction, isSavingAddress] = useActionState<any, any>(saveAddressAction, null);

  useEffect(() => {
    if (saveAddressState) {
      if (saveAddressState.success) {
        toast.add({ type: "success", title: editingAddressId ? t("addressUpdated") : t("addressAdded") });
        setIsAddingAddress(false);
        window.location.reload();
      } else if (saveAddressState.msg) {
        toast.add({ type: "error", title: saveAddressState.msg });
      }
    }
  }, [saveAddressState, editingAddressId, t]);

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setAddressForm((prev: any) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
          toast.add({ type: "success", title: tAlerts("locationSuccess") });
        },
        (error) => {
          toast.add({ type: "error", title: tAlerts("locationError") });
        }
      );
    } else {
      toast.add({ type: "error", title: tAlerts("geoNotSupported") });
    }
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      saveAddressFormAction({ ...addressForm, id: editingAddressId });
    });
  };

  const openDeleteAddressModal = (id: string) => {
    setAddressToDeleteId(id);
    setIsDeleteAddressModalOpen(true);
  };

  const executeDeleteAddress = async () => {
    if (!addressToDeleteId) return;
    setIsDeletingAddress(true);
    const res = await deleteAddress(addressToDeleteId);
    setIsDeletingAddress(false);
    if (res.success) {
      toast.add({ type: "success", title: t("addressDeleted") });
      setIsDeleteAddressModalOpen(false);
      setAddressToDeleteId(null);
      window.location.reload();
    } else {
      toast.add({ type: "error", title: t("actionFailed") });
    }
  };

  const handleSetPrimary = async (id: string) => {
    const res = await setDefaultAddress(id);
    if (res.success) {
      toast.add({ type: "success", title: t("addressSetPrimary") });
      window.location.reload();
    } else {
      toast.add({ type: "error", title: t("actionFailed") });
    }
  };

  const getLabelIcon = (label: string) => {
    if (label === "rumah") return <Home className="h-4 w-4" />;
    if (label === "kantor") return <Building className="h-4 w-4" />;
    if (label === "kos") return <Building className="h-4 w-4" />;
    return <MapPin className="h-4 w-4" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">{t("title")}</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-200">
        <button
          onClick={() => setActiveTab("info")}
          className={`pb-3 font-semibold text-sm transition-colors relative ${activeTab === "info" ? "text-orange-600" : "text-zinc-500 hover:text-zinc-700"
            }`}
        >
          {t("personalInfo")}
          {activeTab === "info" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab("address")}
          className={`pb-3 font-semibold text-sm transition-colors relative ${activeTab === "address" ? "text-orange-600" : "text-zinc-500 hover:text-zinc-700"
            }`}
        >
          {t("addresses")}
          {activeTab === "address" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600 rounded-t-full" />}
        </button>
      </div>

      {activeTab === "info" && (
        <form onSubmit={handleUpdateProfile} className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">{t("name")}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-xl text-sm outline-none transition-colors ${updateProfileState?.errors?.name ? 'border-red-500 focus:ring-red-500 bg-red-50/50' : 'border-zinc-200 focus:ring-2 focus:ring-orange-500'}`}
                />
              </div>
              {updateProfileState?.errors?.name && <p className="text-xs text-red-500">{updateProfileState.errors.name[0]}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={initialData.isOAuthUser}
                className={`w-full px-4 py-2 border rounded-xl text-sm outline-none transition-colors ${updateProfileState?.errors?.email ? 'border-red-500 focus:ring-red-500 bg-red-50/50' : 'border-zinc-200 focus:ring-2 focus:ring-orange-500'} ${initialData.isOAuthUser ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed' : ''}`}
              />
              {initialData.isOAuthUser && <p className="text-xs text-zinc-500">{t("emailDisabledOAuth") || "Email tidak dapat diubah karena menggunakan login sosial."}</p>}
              {updateProfileState?.errors?.email && <p className="text-xs text-red-500">{updateProfileState.errors.email[0]}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">{t("phone")}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  type="text"
                  value={phone || ""}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-xl text-sm outline-none transition-colors ${updateProfileState?.errors?.phone ? 'border-red-500 focus:ring-red-500 bg-red-50/50' : 'border-zinc-200 focus:ring-2 focus:ring-orange-500'}`}
                />
              </div>
              {updateProfileState?.errors?.phone && <p className="text-xs text-red-500">{updateProfileState.errors.phone[0]}</p>}
            </div>

            {!initialData.isOAuthUser && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">{t("oldPassword") || "Password Lama"}</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder={t("oldPasswordPlaceholder") || "Kosongkan jika tidak ingin mengubah"}
                    className={`w-full px-4 py-2 border rounded-xl text-sm outline-none transition-colors ${updateProfileState?.errors?.oldPassword ? 'border-red-500 focus:ring-red-500 bg-red-50/50' : 'border-zinc-200 focus:ring-2 focus:ring-orange-500'}`}
                  />
                  {updateProfileState?.errors?.oldPassword && <p className="text-xs text-red-500">{updateProfileState.errors.oldPassword[0]}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">{t("newPassword") || "Password Baru"}</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("newPasswordPlaceholder") || "Minimal 6 karakter"}
                    className={`w-full px-4 py-2 border rounded-xl text-sm outline-none transition-colors ${updateProfileState?.errors?.newPassword ? 'border-red-500 focus:ring-red-500 bg-red-50/50' : 'border-zinc-200 focus:ring-2 focus:ring-orange-500'}`}
                  />
                  {updateProfileState?.errors?.newPassword && <p className="text-xs text-red-500">{updateProfileState.errors.newPassword[0]}</p>}
                </div>
              </>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
            <Dialog>
              <DialogTrigger className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-semibold transition-colors">
                <LogOut className="h-4 w-4" />
                {t("logout")}
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{t("logout")}</DialogTitle>
                  <DialogDescription>
                    {t("logoutConfirm")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 gap-2 space-x-3 sm:gap-0">
                  <DialogClose className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-lg text-sm font-semibold transition-colors">
                    {t("cancel")}
                  </DialogClose>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: '/sign-in' })}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    {t("logout")}
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-70"
            >
              {isUpdatingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t("saveChanges")}
            </button>
          </div>
        </form>
      )}

      {activeTab === "address" && (
        <div className="space-y-6">
          {!isAddingAddress ? (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-zinc-900">{t("addresses")}</h2>
                <button
                  onClick={handleOpenAddAddress}
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  {t("addAddress")}
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-zinc-200 border-dashed">
                  <MapPin className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
                  <p className="text-zinc-500 font-medium">{t("noAddress")}</p>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {addresses.map((addr) => (
                    <div key={addr.id} className={`p-5 rounded-2xl border ${addr.isDefault ? 'border-orange-500 bg-orange-50/30' : 'border-zinc-200 bg-white'} relative group`}>
                      {addr.isDefault && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-lg">
                          <CheckCircle2 className="h-3 w-3" /> {t("primary")}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="p-1.5 bg-zinc-100 rounded-lg text-zinc-600">
                          {getLabelIcon(addr.label)}
                        </span>
                        <h3 className="font-bold text-zinc-900 capitalize">{t(`addressLabels.${addr.label}`) || addr.label}</h3>
                      </div>

                      <div className="space-y-1 text-sm text-zinc-600 mb-4">
                        <p className="font-semibold text-zinc-900">{addr.receiverName}</p>
                        <p>{addr.receiverPhone}</p>
                        <p className="line-clamp-2 mt-2 leading-relaxed">{addr.streetAddress}, {addr.village}, {addr.district}, {addr.city}, {addr.province} {addr.postcode}</p>
                      </div>

                      <div className="flex items-center gap-3 pt-3 border-t border-zinc-100">
                        <button onClick={() => handleOpenEditAddress(addr)} className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1">
                          <Edit2 className="h-3.5 w-3.5" /> {t("edit")}
                        </button>
                        <button onClick={() => openDeleteAddressModal(addr.id)} className="text-xs font-semibold text-zinc-500 hover:text-red-600 transition-colors flex items-center gap-1">
                          <Trash2 className="h-3.5 w-3.5" /> {t("delete")}
                        </button>
                        {!addr.isDefault && (
                          <button onClick={() => handleSetPrimary(addr.id)} className="ml-auto text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors">
                            {t("setPrimary")}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Delete Address Confirmation Modal */}
              <Dialog open={isDeleteAddressModalOpen} onOpenChange={(open) => {
                if (!isDeletingAddress) {
                  setIsDeleteAddressModalOpen(open);
                  if (!open) setAddressToDeleteId(null);
                }
              }}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{t("deleteAddress")}</DialogTitle>
                    <DialogDescription>
                      {t("deleteAddressConfirm")}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="mt-4 gap-2 space-x-3 sm:gap-0">
                    <button
                      onClick={() => { setIsDeleteAddressModalOpen(false); setAddressToDeleteId(null); }}
                      disabled={isDeletingAddress}
                      className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      onClick={executeDeleteAddress}
                      disabled={isDeletingAddress}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      {isDeletingAddress ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {isDeletingAddress ? t("deleting") : t("delete")}
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <form onSubmit={handleSaveAddress} className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <h2 className="text-lg font-bold text-zinc-900">{editingAddressId ? t("editAddress") : t("addAddress")}</h2>
                <button type="button" onClick={() => setIsAddingAddress(false)} className="text-sm font-semibold text-zinc-500 hover:text-zinc-900">{t("cancel")}</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">{t("label")}</label>
                  <select
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-xl text-sm outline-none transition-colors ${saveAddressState?.errors?.label ? 'border-red-500 focus:ring-red-500 bg-red-50/50' : 'border-zinc-200 focus:ring-2 focus:ring-orange-500'}`}
                  >
                    <option value="home">{t("addressLabels.home")}</option>
                    <option value="office">{t("addressLabels.office")}</option>
                    <option value="apartment">{t("addressLabels.apartment")}</option>
                    <option value="other">{t("addressLabels.other")}</option>
                  </select>
                  {saveAddressState?.errors?.label && <p className="text-xs text-red-500">{saveAddressState.errors.label[0]}</p>}
                </div>

                <div className="flex items-center mt-8">
                  <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                    />
                    {t("setPrimary")}
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">{t("receiverName")}</label>
                  <input
                    type="text"
                    value={addressForm.receiverName}
                    onChange={(e) => setAddressForm({ ...addressForm, receiverName: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-xl text-sm outline-none transition-colors ${saveAddressState?.errors?.receiverName ? 'border-red-500 focus:ring-red-500 bg-red-50/50' : 'border-zinc-200 focus:ring-2 focus:ring-orange-500'}`}
                  />
                  {saveAddressState?.errors?.receiverName && <p className="text-xs text-red-500">{saveAddressState.errors.receiverName[0]}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-zinc-700">{t("receiverPhone")}</label>
                    <button
                      type="button"
                      onClick={() => setAddressForm({ ...addressForm, receiverPhone: phone })}
                      className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                    >
                      {t("usePersonalPhone")}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={addressForm.receiverPhone}
                    onChange={(e) => setAddressForm({ ...addressForm, receiverPhone: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-xl text-sm outline-none transition-colors ${saveAddressState?.errors?.receiverPhone ? 'border-red-500 focus:ring-red-500 bg-red-50/50' : 'border-zinc-200 focus:ring-2 focus:ring-orange-500'}`}
                  />
                  {saveAddressState?.errors?.receiverPhone && <p className="text-xs text-red-500">{saveAddressState.errors.receiverPhone[0]}</p>}
                </div>

                <div className="col-span-1 md:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-zinc-700">{t("location")}</label>
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Navigation className="h-3.5 w-3.5" /> {t("useCurrentLocation")}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500">{t("locationDesc")}</p>
                  <MapPicker
                    position={addressForm.latitude && addressForm.longitude ? { lat: addressForm.latitude, lng: addressForm.longitude } : null}
                    setPosition={(pos) => setAddressForm({ ...addressForm, latitude: pos.lat, longitude: pos.lng })}
                  />
                  {(saveAddressState?.errors?.latitude || saveAddressState?.errors?.longitude) && (
                    <p className="text-xs text-red-500">{saveAddressState.errors.latitude?.[0] || saveAddressState.errors.longitude?.[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">{t("province")}</label>
                  <select
                    value={addressForm.province}
                    disabled={isLoadingProvinces}
                    onChange={(e) => setAddressForm({
                      ...addressForm,
                      province: e.target.value,
                      city: "",
                      cityId: null,
                      district: "",
                      districtId: null,
                      village: "",
                      villageId: null
                    })}
                    className={`w-full px-4 py-2 border rounded-xl text-sm outline-none transition-colors ${saveAddressState?.errors?.province ? 'border-red-500 focus:ring-red-500 bg-red-50/50' : 'border-zinc-200 focus:ring-2 focus:ring-orange-500'}`}
                  >
                    <option value="">{t("selectProvince")}</option>
                    {provinces.map((prov, index) => (
                      <option key={index} value={prov.name || prov.province}>{prov.name || prov.province}</option>
                    ))}
                  </select>
                  {saveAddressState?.errors?.province && <p className="text-xs text-red-500">{saveAddressState.errors.province[0]}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">{t("city")}</label>
                  <select
                    value={addressForm.cityId || ""}
                    disabled={isLoadingCities || !addressForm.province}
                    onChange={(e) => {
                      const selectedCity = cities.find(c => (c.id?.toString() || c.city_id) === e.target.value);
                      if (selectedCity) {
                        const cityName = selectedCity.name || `${selectedCity.type} ${selectedCity.city_name}`;
                        setAddressForm({
                          ...addressForm,
                          cityId: selectedCity.id?.toString() || selectedCity.city_id,
                          city: cityName,
                          district: "",
                          districtId: null,
                          village: "",
                          villageId: null
                        });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-xl text-sm outline-none transition-colors ${saveAddressState?.errors?.cityId ? 'border-red-500 focus:ring-red-500 bg-red-50/50' : 'border-zinc-200 focus:ring-2 focus:ring-orange-500'}`}
                  >
                    <option value="">{t("selectCity")}</option>
                    {cities.map((city, index) => (
                      <option key={index} value={city.id || city.city_id}>
                        {city.name || `${city.type} ${city.city_name}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">{t("district")}</label>
                  <select
                    value={addressForm.districtId || ""}
                    disabled={isLoadingDistricts || !addressForm.cityId}
                    onChange={(e) => {
                      const selectedDistrict = districts.find(d => (d.id?.toString() || d.subdistrict_id) === e.target.value);
                      if (selectedDistrict) {
                        setAddressForm({
                          ...addressForm,
                          districtId: selectedDistrict.id?.toString() || selectedDistrict.subdistrict_id,
                          district: selectedDistrict.name || selectedDistrict.subdistrict_name,
                          village: "",
                          villageId: null
                        });
                      } else {
                        setAddressForm({
                          ...addressForm,
                          districtId: null,
                          district: e.target.value,
                          village: "",
                          villageId: null
                        });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-xl text-sm outline-none transition-colors ${saveAddressState?.errors?.district ? 'border-red-500 focus:ring-red-500 bg-red-50/50' : 'border-zinc-200 focus:ring-2 focus:ring-orange-500'}`}
                  >
                    <option value="">{t("selectDistrict")}</option>
                    {districts.map((dist, index) => (
                      <option key={index} value={dist.id || dist.subdistrict_id}>
                        {dist.name || dist.subdistrict_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-zinc-700">{t("village")}</label>
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

                  {isManualVillage || villages.length === 0 ? (
                    <input
                      type="text"
                      value={addressForm.village}
                      onChange={(e) => setAddressForm({ ...addressForm, village: e.target.value, villageId: null })}
                      className={`w-full px-4 py-2 border rounded-xl text-sm outline-none transition-colors ${saveAddressState?.errors?.village ? 'border-red-500 focus:ring-red-500 bg-red-50/50' : 'border-zinc-200 focus:ring-2 focus:ring-orange-500'}`}
                      placeholder={t("villagePlaceholder")}
                    />
                  ) : (
                    <select
                      value={addressForm.villageId || ""}
                      disabled={isLoadingVillages || !addressForm.districtId}
                      onChange={(e) => {
                        const selectedVillage = villages.find(v => v.id?.toString() === e.target.value);
                        if (selectedVillage) {
                          setAddressForm({
                            ...addressForm,
                            villageId: selectedVillage.id?.toString(),
                            village: selectedVillage.name,
                            postcode: selectedVillage.zip_code || addressForm.postcode
                          });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-xl text-sm outline-none transition-colors ${saveAddressState?.errors?.village ? 'border-red-500 focus:ring-red-500 bg-red-50/50' : 'border-zinc-200 focus:ring-2 focus:ring-orange-500'}`}
                    >
                      <option value="">{t("selectVillage")}</option>
                      {villages.map((vil, index) => (
                        <option key={index} value={vil.id}>
                          {vil.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {saveAddressState?.errors?.village && <p className="text-xs text-red-500">{saveAddressState.errors.village[0]}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">{t("postcode")}</label>
                  <input
                    type="text"
                    value={addressForm.postcode}
                    onChange={(e) => setAddressForm({ ...addressForm, postcode: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-xl text-sm outline-none transition-colors ${saveAddressState?.errors?.postcode ? 'border-red-500 focus:ring-red-500 bg-red-50/50' : 'border-zinc-200 focus:ring-2 focus:ring-orange-500'}`}
                  />
                  {saveAddressState?.errors?.postcode && <p className="text-xs text-red-500">{saveAddressState.errors.postcode[0]}</p>}
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">{t("streetAddress")}</label>
                  <textarea
                    rows={3}
                    value={addressForm.streetAddress}
                    onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-xl text-sm outline-none resize-none transition-colors ${saveAddressState?.errors?.streetAddress ? 'border-red-500 focus:ring-red-500 bg-red-50/50' : 'border-zinc-200 focus:ring-2 focus:ring-orange-500'}`}
                  />
                  {saveAddressState?.errors?.streetAddress && <p className="text-xs text-red-500">{saveAddressState.errors.streetAddress[0]}</p>}
                </div>

              </div>

              <div className="pt-4 border-t border-zinc-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-70"
                >
                  {isSavingAddress ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t("saveChanges")}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
