import { getTranslations } from "next-intl/server";
import OnboardingClient from "./_components/onboarding-client";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: "Seller Onboarding | DRESS.CO"
  };
}

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  console.log(locale)
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-start justify-center">
      <OnboardingClient locale={locale} />
    </div>
  );
}
