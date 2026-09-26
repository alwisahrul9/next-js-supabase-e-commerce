import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { redirect } from "next/navigation";;
import EmployeeClient from "./_components/employee-client";

import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("sellerSettingsEmployees")
  };
}


export default async function EmployeesSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user || (session.user as any).role !== "SELLER") {
    redirect(`/${locale}/login`);
  }

  const storeProfileId = (session.user as any).storeProfile?.id;

  if (!storeProfileId) {
    redirect(`/${locale}/login`);
  }

  // Fetch employees for this store
  const employees = await prisma.employeeProfile.findMany({
    where: { storeProfileId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      warehouses: true,
    },
  });

  // Fetch all warehouses for this store so the seller can assign them
  const warehouses = await prisma.warehouse.findMany({
    where: { storeProfileId },
  });

  return (
    <div className="w-full">
      <EmployeeClient employees={employees} warehouses={warehouses} />
    </div>
  );
}
