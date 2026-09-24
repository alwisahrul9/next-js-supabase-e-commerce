import { getBuyerProfileData } from "@/app/actions/profile";
import ProfileClient from "./_components/profile-client";
import { redirect } from "next/navigation";
import { useLocale } from "next-intl";

;

export default async function ProfilePage() {
    const locale = useLocale();
  const profileRes = await getBuyerProfileData();
  
  if (!profileRes.success) {
    redirect(`/${locale}/sign-in`);
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProfileClient initialData={profileRes.data} />
      </div>
    </div>
  );
}
