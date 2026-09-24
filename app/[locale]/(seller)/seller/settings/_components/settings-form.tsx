"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { settingsSchema, SettingsFormValues } from "@/app/lib/validations/settings";
import { updateSellerProfile, requestEmailChange, updateProfileImageOnly, removeProfileImage } from "@/app/actions/settings";
import { toast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";
import ProfileImageUpload from "./profile-image-upload";
import { useRouter } from "next/navigation";;
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { translateServerMessage } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SettingsFormProps {
  initialData: {
    name: string;
    email: string;
    image: string | null;
  };
  supabaseToken: string;
  supabaseUrl: string;
}

export default function SettingsForm({
  initialData,
  supabaseToken,
  supabaseUrl,
}: SettingsFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const t = useTranslations("Settings");
  const tValidation = useTranslations("Validation");
  const locale = useLocale();
  const [isPending, setIsPending] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [pendingData, setPendingData] = useState<SettingsFormValues | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: initialData.name || "",
      email: initialData.email || "",
      password: "",
      image: initialData.image || null,
    },
  });

  const imageValue = watch("image");

  const onSubmit = async (data: SettingsFormValues) => {
    setIsPending(true);
    try {
      if (data.email !== initialData.email) {
        // Request OTP
        const result = await requestEmailChange(data.email, locale);
        if (result.success) {
          setPendingData(data);
          setShowOtpModal(true);
          setOtpError("");
          toast.add({
            type: "success",
            title: t("successSent"),
            description: t("successSentDesc"),
          });
        } else {
          toast.add({
            type: "error",
            title: result.error || t("errorSend"),
          });
        }
        setIsPending(false);
        return;
      }

      // If no email change, update profile directly
      await finalizeUpdate(data);
    } catch (error) {
      toast.add({
        type: "error",
        title: t("errorUpdate"),
      });
      setIsPending(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (!pendingData) return;
    if (otp.length < 6) {
      setOtpError(t("otpInvalid"));
      return;
    }

    setIsPending(true);
    setOtpError("");
    try {
      await finalizeUpdate(pendingData, otp);
    } catch (error) {
      setOtpError(t("otpError"));
      setIsPending(false);
    }
  };

  const finalizeUpdate = async (data: SettingsFormValues, otpCode?: string) => {
    const result = await updateSellerProfile({
      name: data.name,
      email: data.email,
      password: data.password || undefined,
      image: data.image,
    }, otpCode, locale);

    if (result.success) {
      // Update session token data
      await update({
        name: data.name,
        email: data.email,
        image: data.image,
      });

      toast.add({
        type: "success",
        title: t("successUpdate"),
      });
      setValue("password", ""); // Clear password after successful update
      setShowOtpModal(false);
      setOtp("");
      setOtpError("");
      router.refresh();
    } else {
      if (otpCode && (result.error === t("otpInvalid") || result.error === t("otpExpired"))) {
        setOtpError(result.error);
      } else {
        toast.add({
          type: "error",
          title: result.error || t("errorUpdate"),
        });
      }
    }
    setIsPending(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
            {t("profileImageTitle")}
          </h3>
          <ProfileImageUpload
            image={imageValue ?? null}
            onChange={(img) => setValue("image", img, { shouldValidate: true })}
            onUploadComplete={async (url) => {
              const res = await updateProfileImageOnly(url);
              if (res.success) {
                await update({ image: url });
                toast.add({ type: "success", title: t("successUpdate") });
                router.refresh();
              } else {
                toast.add({ type: "error", title: res.error || t("errorUpdate") });
              }
            }}
            onRemove={async (url) => {
              const res = await removeProfileImage(url);
              if (res.success) {
                await update({ image: null });
                toast.add({ type: "success", title: t("successUpdate") }); // Reusing generic success for simplicity, or we can add specific delete message
                router.refresh();
              } else {
                toast.add({ type: "error", title: res.error || t("errorUpdate") });
              }
            }}
            supabaseToken={supabaseToken}
            supabaseUrl={supabaseUrl}
            bucketName="profiles"
          />
          {errors.image && errors.image.message && (
            <p className="text-rose-500 text-sm mt-2 text-center">
              {translateServerMessage(errors.image.message, tValidation)}
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            {t("title")}
          </h3>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("nameLabel")}
            </label>
            <input
              {...register("name")}
              type="text"
              className="w-full px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              placeholder={t("namePlaceholder")}
            />
            {errors.name && errors.name.message && (
              <p className="text-rose-500 text-sm">{translateServerMessage(errors.name.message, tValidation)}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("emailLabel")}
            </label>
            <input
              {...register("email")}
              type="email"
              className="w-full px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              placeholder={t("emailPlaceholder")}
            />
            {errors.email && errors.email.message && (
              <p className="text-rose-500 text-sm">{translateServerMessage(errors.email.message, tValidation)}</p>
            )}
          </div>

          <div className="space-y-2 pt-4">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("passwordLabel")}
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
              {t("passwordDesc")}
            </p>
            <input
              {...register("password")}
              type="password"
              className="w-full px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              placeholder={t("passwordPlaceholder")}
            />
            {errors.password && errors.password.message && (
              <p className="text-rose-500 text-sm">{translateServerMessage(errors.password.message, tValidation)}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center justify-center min-w-[120px] bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t("btnSave")
            )}
          </button>
        </div>
      </form>

      <Dialog open={showOtpModal} onOpenChange={setShowOtpModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("modalTitle")}</DialogTitle>
            <DialogDescription
              dangerouslySetInnerHTML={{
                __html: t.raw("modalDesc").replace("{email}", pendingData?.email || ""),
              }}
            />
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("otpLabel")}
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  setOtpError("");
                }}
                maxLength={6}
                className="w-full px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-center tracking-widest font-mono text-lg"
                placeholder="000000"
              />
              {otpError && (
                <p className="text-rose-500 text-sm text-center font-medium mt-1">
                  {otpError}
                </p>
              )}
            </div>
            <button
              onClick={handleOtpSubmit}
              disabled={isPending || otp.length < 6}
              className="w-full flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 px-6 rounded-xl shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t("btnConfirm")
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
