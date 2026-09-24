"use server";

import { prisma } from "@/app/lib/db";

export async function getCustomersAction(storeId: string, page: number) {
  const take = 10;
  
  const customers = await prisma.user.findMany({
    where: {
      orders: {
        some: {
          items: { some: { product: { storeProfileId: storeId } } },
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      buyerProfile: {
        select: { phone: true },
      },
      orders: {
        where: {
          items: { some: { product: { storeProfileId: storeId } } },
        },
        select: { id: true },
      },
    },
  });

  // Sort by order count descending
  customers.sort((a, b) => b.orders.length - a.orders.length);

  // Return paginated slice
  return customers.slice((page - 1) * take, page * take);
}
