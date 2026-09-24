"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";
import { forgotPassword } from "@/app/actions/reset-password";

export default function ForgotPasswordPage() {
  const t = useTranslations("ForgotPassword");
  const locale = useLocale()
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const result = await forgotPassword(email);

    if (result.success) {
      setMessage({ type: "success", text: t("successMessage") });
      setEmail("");
    } else {
      setMessage({ type: "error", text: result.error || t("errorDefault") });
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-zinc-50">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex justify-center">
          <Link href={`/${locale}`} className="flex items-center text-zinc-900 font-bold tracking-wider text-xl">
            <ShoppingBag className="mr-2 h-6 w-6" />
            DRESS.CO
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
            <CardDescription>{t("subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("emailLabel")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  required
                  disabled={isLoading}
                />
              </div>

              {message && (
                <div className={`p-3 text-sm rounded-md ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {message.text}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
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
      </div>
    </div>
  );
}
