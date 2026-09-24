import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/db";
import { getTranslations } from "next-intl/server";
import { Users } from "lucide-react";
import CustomersClient from "./_components/customers-client";
import { useLocale } from "next-intl";

export default async function SellerCustomersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/${locale}`);
  }

  let storeId = "";

  if (session.user.role === "SELLER") {
    const store = await prisma.storeProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!store) redirect(`/${locale}/onboarding`);
    storeId = store.id;
  } else if (session.user.role === "EMPLOYEE") {
    const employee = await prisma.employeeProfile.findUnique({
      where: { userId: session.user.id },
      select: { storeProfileId: true },
    });
    if (!employee) redirect(`/${locale}`);
    storeId = employee.storeProfileId;
  } else {
    redirect(`/${locale}`);
  }

  const customers = await prisma.user.findMany({
    where: {
      orders: {
        some: {
          items: {
            some: {
              product: {
                storeProfileId: storeId,
              },
            },
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      buyerProfile: {
        select: {
          phone: true,
        },
      },
      orders: {
        where: {
          items: {
            some: {
              product: {
                storeProfileId: storeId,
              },
            },
          },
        },
        select: {
          id: true,
        },
      },
    },
  });

  // Sort by order count descending
  customers.sort((a, b) => b.orders.length - a.orders.length);

  // Initial 10 items
  const initialCustomers = customers.slice(0, 10);

  const t = await getTranslations({ locale, namespace: "SellerCustomers" });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {t("title")}
          </h1>
          <p className="text-sm text-zinc-500">
            {t("subtitle")}
          </p>
        </div>
      </div>

      <CustomersClient initialCustomers={initialCustomers} storeId={storeId} />
    </div>
  );
}
