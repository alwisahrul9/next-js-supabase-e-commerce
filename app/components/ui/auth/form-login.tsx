"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, SubmitHandler } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";

// Interface untuk data form
interface LoginFormInputs {
  email: string;
  password: string;
}

export default function FormLogin({ role }: { role: "buyer" | "seller" }) {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("SignIn");
  const tAuth = useTranslations("AuthValidation");

  // Inisialisasi React Hook Form Native
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>();

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data: LoginFormInputs) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
        role,
      });

      if (result?.error) {
        // Menampilkan pesan error yang dikirim dari server (NextAuth authorize)
        setServerError(result.error);
      } else {
        console.log("Login berhasil!");
        // Redirect ke halaman sebelumnya (callbackUrl) atau halaman default
        const callbackUrl = searchParams.get("callbackUrl");
        const defaultRedirect = role === "buyer" ? "/" : "/seller";
        window.location.href = callbackUrl || defaultRedirect;
      }
    } catch (error) {
      console.error("An error occurred during login:", error);
      setServerError("server.defaultError");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const callbackUrl = searchParams.get("callbackUrl") || (role === "buyer" ? "/" : "/seller");
    
    try {
      await signIn("google", { callbackUrl });
    } catch (error) {
      console.error("An error occurred during Google login:", error);
      setServerError("server.googleError");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <CardContent className="space-y-4">
        {/* ────────────── Banner Pesan Error dari Server/NextAuth ────────────── */}
        {serverError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              {serverError.startsWith("server.roleMismatch:")
                ? tAuth("server.roleMismatch", { role: serverError.split(":")[1] })
                : tAuth(serverError as any)}
            </span>
          </div>
        )}

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
              required: tAuth("email.required"), // atau string langsung: "Email wajib diisi"
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: tAuth("email.invalid"),
              },
            })}
            className={`bg-zinc-50/50 ${
              errors.email ? "border-rose-500 focus-visible:ring-rose-500" : ""
            }`}
          />
          {/* Pesan Error Client Realtime */}
          {errors.email && (
            <p className="text-xs text-rose-500 font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* ────────────── Input Password ────────────── */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor={`password-${role}`}>
              {t("form.passwordLabel")}
            </Label>
            <Link
              href={`/${locale}/forgot-password`}
              className="text-xs text-muted-foreground hover:underline"
            >
              {t("form.forgotPassword")}
            </Link>
          </div>
          <Input
            id={`password-${role}`}
            type="password"
            {...register("password", {
              required: tAuth("password.required"), // atau string langsung: "Password wajib diisi"
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
          {/* Pesan Error Client Realtime */}
          {errors.password && (
            <p className="text-xs text-rose-500 font-medium">
              {errors.password.message}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 mt-2">
        {/* Tombol Login Utama (Email & Password) */}
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
            ? t("form.processing")
            : role === "buyer"
              ? t("form.buttonBuyer")
              : t("form.buttonSeller")}
          {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>

        {/* 🚀 Tombol Sign In With Google */}
        {role === "buyer" && (
          <>
            {/* ────────────── Garis Pembatas "Atau" ────────────── */}
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
              {/* SVG Icon Google */}
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
            ? t("footer.noAccountBuyer")
            : t("footer.noAccountSeller")}{" "}
          <Link
            href={role === "buyer" ? "/sign-up" : "/sign-up?role=seller"}
            className={`font-semibold hover:underline ${
              role === "buyer" ? "text-zinc-900" : "text-amber-700"
            }`}
          >
            {role === "buyer"
              ? t("footer.registerBuyer")
              : t("footer.registerSeller")}
          </Link>
        </div>
      </CardFooter>
    </form>
  );
}
