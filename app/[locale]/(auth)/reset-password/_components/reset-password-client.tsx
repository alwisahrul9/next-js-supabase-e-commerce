"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";;
import { resetPassword } from "@/app/actions/reset-password";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ResetPasswordClient({ token, locale }: { token: string, locale: string }) {
  const t = useTranslations("ResetPassword");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: t("passwordMismatch") });
      setIsLoading(false);
      return;
    }

    const result = await resetPassword(password, token);

    if (result.success) {
      setMessage({ type: "success", text: t("successMessage") });
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push(`/${locale}/sign-in`);
      }, 3000);
    } else {
      setMessage({ type: "error", text: result.error || t("errorDefault") });
    }

    setIsLoading(false);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t("passwordLabel")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("passwordPlaceholder")}
              required
              disabled={isLoading || message?.type === "success"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("confirmLabel")}</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("confirmPlaceholder")}
              required
              disabled={isLoading || message?.type === "success"}
            />
          </div>

          {message && (
            <div className={`p-3 text-sm rounded-md ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {message.text}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || message?.type === "success"}>
            {isLoading ? t("processing") : t("submit")}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t p-4">
        <Link href={`/${locale}/sign-in`} className="text-sm text-zinc-600 hover:text-zinc-900 font-medium">
          {t("backToLogin")}
        </Link>
      </CardFooter>
    </Card>
  );
}
