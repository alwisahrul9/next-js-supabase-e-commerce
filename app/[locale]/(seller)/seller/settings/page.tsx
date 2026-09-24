import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { redirect } from "next/navigation";;
import SettingsForm from "./_components/settings-form";

import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("sellerSettings")
  };
}


export default async function SellerSettingsPage({
  params,
}: {
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || (session.user as any).role !== "SELLER") {
    redirect(`/${params.locale}/login`);
  }

  const userId = (session.user as any).id;

  // Fetch full user data including store profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { storeProfile: true },
  });

  if (!user) {
    redirect(`/${params.locale}/login`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseToken = (session as any).supabaseToken || "";

  // The image can be from StoreProfile logoUrl (which we update in the action) or User image
  // We'll prioritize StoreProfile.logoUrl for the Seller settings
  const currentImage = user.storeProfile?.logoUrl || user.image || null;

  return (
    <div className="w-full">

      <SettingsForm
        initialData={{
          name: user.name || "",
          email: user.email,
          image: currentImage,
        }}
        supabaseToken={supabaseToken}
        supabaseUrl={supabaseUrl}
      />
    </div>
  );
}
