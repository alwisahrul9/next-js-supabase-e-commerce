"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";;
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { registerUser } from "@/app/actions/auth";

interface RegisterFormInputs {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function FormRegister({ role }: { role: "buyer" | "seller" }) {
    const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations("SignUp");
  const tAuth = useTranslations("AuthValidation");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormInputs>();

  const password = watch("password");

  const onSubmit: SubmitHandler<RegisterFormInputs> = async (data) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const res = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        role: role,
      });

      if (!res.success) {
        setServerError(res.msg || "server.error");
      } else {
        toast.add({
          type: "success",
          title: t("registerSuccess"),
          description: t("registerSuccessDesc"),
        });
        
        // Arahkan ke halaman login
        router.push(`/${locale}/sign-in`);
      }
    } catch (error) {
      console.error("An error occurred during registration:", error);
      setServerError("server.error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    console.log(`Mencoba Google Login untuk ${role}`);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <CardContent className="space-y-4">
        {serverError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{tAuth(serverError as any)}</span>
          </div>
        )}

        {/* ────────────── Input Nama ────────────── */}
        <div className="space-y-1">
          <Label htmlFor={`name-${role}`}>{t("form.nameLabel")}</Label>
          <Input
            id={`name-${role}`}
            placeholder={t("form.namePlaceholder")}
            {...register("name", {
              required: tAuth("name.required"),
            })}
            className={`bg-zinc-50/50 ${
              errors.name ? "border-rose-500 focus-visible:ring-rose-500" : ""
            }`}
          />
          {errors.name && (
            <p className="text-xs text-rose-500 font-medium">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* ────────────── Input Email ────────────── */}
        <div className="space-y-1">
          <Label htmlFor={`email-${role}`}>{t("form.emailLabel")}</Label>
          <Input
            id={`email-${role}`}
            placeholder={
              role === "buyer"
                ? t("form.emailPlaceholderBuyer")
                : t("form.emailPlaceholderSeller")
            }
            type="email"
            {...register("email", {
              required: tAuth("email.required"),
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: tAuth("email.invalid"),
              },
            })}
            className={`bg-zinc-50/50 ${
              errors.email ? "border-rose-500 focus-visible:ring-rose-500" : ""
            }`}
          />
          {errors.email && (
            <p className="text-xs text-rose-500 font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* ────────────── Input Password ────────────── */}
        <div className="space-y-1">
          <Label htmlFor={`password-${role}`}>
            {t("form.passwordLabel")}
          </Label>
          <Input
            id={`password-${role}`}
            type="password"
            {...register("password", {
              required: tAuth("password.required"),
              minLength: {
                value: 6,
                message: tAuth("password.minLength", { min: 6 }),
              },
            })}
            className={`bg-zinc-50/50 ${
              errors.password
                ? "border-rose-500 focus-visible:ring-rose-500"
                : ""
            }`}
          />
          {errors.password && (
            <p className="text-xs text-rose-500 font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* ────────────── Input Confirm Password ────────────── */}
        <div className="space-y-1">
          <Label htmlFor={`confirmPassword-${role}`}>
            {t("form.confirmPasswordLabel")}
          </Label>
          <Input
            id={`confirmPassword-${role}`}
            type="password"
            {...register("confirmPassword", {
              required: tAuth("password.required"),
              validate: (value) =>
                value === password || tAuth("password.notMatch"),
            })}
            className={`bg-zinc-50/50 ${
              errors.confirmPassword
                ? "border-rose-500 focus-visible:ring-rose-500"
                : ""
            }`}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-rose-500 font-medium">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 mt-2">
        <Button
          className={`w-full text-white font-medium py-5 ${
            role === "buyer"
              ? "bg-zinc-900 hover:bg-zinc-800"
              : "bg-amber-600 hover:bg-amber-700"
          }`}
          disabled={isLoading}
          type="submit"
        >
          {isLoading
            ? t("form.loadingButton")
            : role === "buyer"
              ? t("form.buttonBuyer")
              : t("form.buttonSeller")}
          {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>

        {role === "buyer" && (
          <>
            <div className="relative w-full my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground font-medium">
                  {t("form.divider")}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className={`w-full py-5 bg-white font-medium transition-colors ${
                role === "buyer"
                  ? "hover:bg-zinc-50 hover:text-zinc-950 border-zinc-200"
                  : "hover:bg-amber-50/50 hover:text-amber-900 border-zinc-200"
              }`}
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg
                className="mr-2 h-4 w-4"
                aria-hidden="true"
                focusable="false"
                data-prefix="fab"
                data-icon="google"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                ></path>
              </svg>
              {t("form.googleButton")}
            </Button>
          </>
        )}

        <div className="text-sm text-center text-muted-foreground pt-2">
          {role === "buyer"
            ? t("footer.haveAccountBuyer")
            : t("footer.haveAccountSeller")}{" "}
          <Link
            href={`/${locale}/sign-in`}
            className={`font-semibold hover:underline ${
              role === "buyer" ? "text-zinc-900" : "text-amber-700"
            }`}
          >
            {t("footer.loginLink")}
          </Link>
        </div>
      </CardFooter>
    </form>
  );
}
