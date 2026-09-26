import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShoppingBag, Store } from "lucide-react";
import FormLogin from "@/app/components/ui/auth/form-login";
import { Metadata } from "next";
import { useTranslations, useLocale } from "next-intl";
import LangSwitcher from "@/app/components/ui/lang-switcher";
import Link from "next/link";

import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("signIn"),
  };
}

export default async function SignInPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SignIn" });

  const bgImageUrl =
    "url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop')";

  return (
    <div
      className={`container relative min-h-screen grid max-w-full lg:max-w-none lg:grid-cols-2 lg:px-0 lg:bg-none bg-[${bgImageUrl}] bg-cover bg-center`}
    >
      <div className="absolute top-5 right-5 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-1.5 rounded-xl shadow-sm border border-zinc-200/50">
        <LangSwitcher />
      </div>

      {/* Overlay Gelap + Blur Halus (Hanya Aktif di Mobile agar teks terbaca) */}
      <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-[3px] lg:hidden" />

      {/* ================= SISI KIRI (DESKTOP ONLY) ================= */}
      <div className="relative hidden h-full flex-col p-10 text-white lg:flex">
        {/* Gambar latar belakang khusus sisi kiri */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: bgImageUrl }}
        />
        <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]" />

        <Link href={`/${locale}`} className="relative z-20 flex items-center text-lg font-medium tracking-tight w-fit hover:opacity-80 transition-opacity">
          <ShoppingBag className="mr-2 h-6 w-6" />
          <span className="font-bold tracking-wider text-xl">DRESS.CO</span>
        </Link>

        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg font-light leading-relaxed">
              {t("sidebar.quote")}
            </p>
            <footer className="text-sm font-medium opacity-80">
              {t("sidebar.author")}
            </footer>
          </blockquote>
        </div>
      </div>

      {/* ================= SISI KANAN (DESKTOP & MOBILE) ================= */}
      {/* Bersih tanpa background abu-abu/putih di desktop (lg:bg-transparent) */}
      <div className="relative z-10 flex items-center justify-center w-full min-h-screen bg-transparent">
        <div className="w-full max-w-[450px] p-4 sm:p-0">
          {/* Main Card Pembungkus */}
          <Card className="border-zinc-200/80 shadow-2xl bg-white/90 backdrop-blur-md lg:bg-white lg:shadow-md">
            <CardHeader className="space-y-2 text-center pt-8">
              {/* Logo Tambahan Khusus Mobile */}
              <div className="flex justify-center lg:hidden mb-2">
                <Link href={`/${locale}`} className="flex items-center text-zinc-900 font-bold tracking-wider text-xl hover:opacity-80 transition-opacity">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  DRESS.CO
                </Link>
              </div>
              <CardTitle className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
                {t("header.title")}
              </CardTitle>
              <CardDescription className="text-sm text-zinc-600">
                {t("header.subtitle")}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="buyer" className="w-full">
                {/* Tab Switcher */}
                <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-zinc-100 rounded-xl mb-6">
                  <TabsTrigger
                    value="buyer"
                    className="rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    {t("tabs.buyer")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="seller"
                    className="rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center justify-center gap-2"
                  >
                    <Store className="h-4 w-4" />
                    {t("tabs.seller")}
                  </TabsTrigger>
                </TabsList>

                {/* FORM PEMBELI */}
                <TabsContent value="buyer" className="space-y-4">
                  <FormLogin role="buyer" />
                </TabsContent>

                {/* FORM PENJUAL */}
                <TabsContent value="seller" className="space-y-4">
                  <FormLogin role="seller" />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
