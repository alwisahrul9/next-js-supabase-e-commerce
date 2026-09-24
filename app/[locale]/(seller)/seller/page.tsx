import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/db";
import { getTranslations } from "next-intl/server";
import DashboardClient from "./_components/dashboard-client";
import { useLocale } from "next-intl";

interface SellerDashboardProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}

export default async function SellerDashboard({
  params,
  searchParams,
}: SellerDashboardProps) {
    const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/${locale}`);
  }

  const sp = await searchParams;
  const currentYear = new Date().getFullYear();
  const t = await getTranslations({ locale, namespace: "SellerDashboard" });
  const defaultStartDate = new Date(`${currentYear}-01-01T00:00:00Z`);
  const defaultEndDate = new Date(`${currentYear}-12-31T23:59:59.999Z`);

  const startDate = sp.startDate ? new Date(`${sp.startDate}-01T00:00:00Z`) : defaultStartDate;
  let endDate = defaultEndDate;
  if (sp.endDate) {
    const [year, month] = sp.endDate.split('-');
    endDate = new Date(Date.UTC(parseInt(year), parseInt(month), 0, 23, 59, 59, 999));
  }

  // Dapatkan profil toko milik user
  const store = await prisma.storeProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!store) {
    return (
      <div className="p-6">
        <h1 className="text-xl text-red-500">Toko tidak ditemukan.</h1>
      </div>
    );
  }

  const storeId = store.id;

  // 1. KPI & Ringkasan (Raw Query for Speed)
  // Hitung Total Pendapatan, Produk Terjual
  const kpiRaw = await prisma.$queryRaw<
    { revenue: bigint; total_sold: bigint }[]
  >`
    SELECT 
      COALESCE(SUM(oi.price * oi.quantity), 0) as revenue,
      COALESCE(SUM(oi.quantity), 0) as total_sold
    FROM order_items oi
    JOIN products p ON oi."productId" = p.id
    JOIN orders o ON oi."orderId" = o.id
    WHERE p."storeProfileId" = ${storeId}
      AND o.status IN ('PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED')
      AND o."createdAt" >= ${startDate}
      AND o."createdAt" <= ${endDate}
  `;

  // Hitung Total Pesanan & Pesanan Menunggu (Pending/Siap Kirim)
  const orderCountRaw = await prisma.$queryRaw<
    { total_orders: bigint; pending_orders: bigint }[]
  >`
    SELECT 
      COUNT(DISTINCT o.id) as total_orders,
      COUNT(DISTINCT CASE WHEN o.status = 'PAID' THEN o.id END) as pending_orders
    FROM orders o
    JOIN order_items oi ON o.id = oi."orderId"
    JOIN products p ON oi."productId" = p.id
    WHERE p."storeProfileId" = ${storeId}
      AND o."createdAt" >= ${startDate}
      AND o."createdAt" <= ${endDate}
  `;

  // 2. Data Grafik 12 Bulan (Raw Query)
  const chartRaw = await prisma.$queryRaw<
    { month: Date; revenue: bigint }[]
  >`
    SELECT 
      DATE_TRUNC('month', o."createdAt") as month,
      COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
    FROM order_items oi
    JOIN products p ON oi."productId" = p.id
    JOIN orders o ON oi."orderId" = o.id
    WHERE p."storeProfileId" = ${storeId}
      AND o.status IN ('PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED')
      AND o."createdAt" >= ${startDate}
      AND o."createdAt" <= ${endDate}
    GROUP BY DATE_TRUNC('month', o."createdAt")
    ORDER BY month ASC
  `;

  // Format array dinamis sesuai rentang bulan
  const monthsData: { date: Date; label: string; revenue: number }[] = [];
  let currDate = new Date(startDate);
  currDate.setUTCDate(1);
  const end = new Date(endDate);
  end.setUTCDate(1);

  while (currDate <= end) {
    monthsData.push({
      date: new Date(currDate),
      label: currDate.toLocaleDateString("id-ID", { timeZone: "UTC", month: "short", year: "numeric" }),
      revenue: 0,
    });
    currDate.setUTCMonth(currDate.getUTCMonth() + 1);
  }

  chartRaw.forEach((row) => {
    const rowDate = new Date(row.month);
    const match = monthsData.find(m => m.date.getUTCMonth() === rowDate.getUTCMonth() && m.date.getUTCFullYear() === rowDate.getUTCFullYear());
    if (match) {
      match.revenue = Number(row.revenue);
    }
  });

  const chartLabels = monthsData.map((m) => m.label);
  const monthlyRevenue = monthsData.map((m) => m.revenue);

  // 3. 5 Produk Terlaris (Top 5 Products)
  const topProductsRaw = await prisma.$queryRaw<
    { id: string; name: string; image: string; sold: bigint; revenue: bigint }[]
  >`
    SELECT 
      p.id, 
      p.name,
      p.images[1] as image,
      COALESCE(SUM(oi.quantity), 0) as sold,
      COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
    FROM products p
    LEFT JOIN order_items oi ON p.id = oi."productId"
    LEFT JOIN orders o ON oi."orderId" = o.id 
      AND o.status IN ('PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED') 
      AND o."createdAt" >= ${startDate} 
      AND o."createdAt" <= ${endDate}
    WHERE p."storeProfileId" = ${storeId}
    GROUP BY p.id, p.name, p.images[1]
    ORDER BY sold DESC, revenue DESC
    LIMIT 5
  `;

  // 4. 5 Pesanan Terbaru (Prisma Query for relationships)
  const recentOrders = await prisma.orderItem.findMany({
    where: {
      product: { storeProfileId: storeId },
      order: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    },
    include: {
      order: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
      product: {
        select: { name: true, images: true },
      },
    },
    orderBy: {
      order: { createdAt: "desc" },
    },
    take: 5,
    distinct: ["orderId"],
  });

  // Susun data untuk dikirim ke Client
  const kpis = {
    totalRevenue: Number(kpiRaw[0]?.revenue || 0),
    totalOrders: Number(orderCountRaw[0]?.total_orders || 0),
    pendingOrders: Number(orderCountRaw[0]?.pending_orders || 0),
    productsSold: Number(kpiRaw[0]?.total_sold || 0),
  };

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Pendapatan Bulanan",
        data: monthlyRevenue,
        backgroundColor: "rgba(234, 88, 12, 0.8)", // Orange 600
        borderColor: "rgba(234, 88, 12, 1)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {t("title")}
        </h1>
        <p className="text-sm text-zinc-500">
          {t("subtitle")}
        </p>
      </div>

      <DashboardClient
        kpis={kpis}
        chartData={chartData}
        topProducts={topProductsRaw.map((p) => ({
          ...p,
          sold: Number(p.sold),
          revenue: Number(p.revenue),
        }))}
        recentOrders={recentOrders}
      />
    </div>
  );
}