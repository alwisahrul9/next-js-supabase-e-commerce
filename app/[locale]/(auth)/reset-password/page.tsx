import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/app/lib/db";
import { ShoppingBag, AlertCircle } from "lucide-react";
import Link from "next/link";
import ResetPasswordClient from "./_components/reset-password-client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocale } from "next-intl";

export default async function ResetPasswordPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const token = searchParams?.token as string;
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "ResetPassword" });

  let isValidToken = false;

  if (token) {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiry: {
          gt: new Date(),
        },
      },
    });

    if (user) {
      isValidToken = true;
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-zinc-50">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex justify-center">
          <Link href={`/${locale}`} className="flex items-center text-zinc-900 font-bold tracking-wider text-xl">
            <ShoppingBag className="mr-2 h-6 w-6" />
            DRESS.CO
          </Link>
        </div>

        {isValidToken ? (
          <ResetPasswordClient token={token} locale={locale} />
        ) : (
          <Card className="shadow-lg border-rose-100">
            <CardHeader className="space-y-2 text-center pb-4">
              <div className="flex justify-center mb-2">
                <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-rose-600" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold text-rose-600">{t("invalidTokenTitle")}</CardTitle>
              <CardDescription className="text-zinc-600">
                {t("invalidTokenDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-zinc-500">
              {t("invalidTokenAction")}
            </CardContent>
            <CardFooter className="flex justify-center border-t p-4">
              <Button className="w-full">
                <Link href={`/${locale}/forgot-password`}>
                  {t("backToForgot")}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
