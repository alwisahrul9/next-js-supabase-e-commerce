"use server";

import { prisma } from "@/app/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";

export async function getNotifications() {
  const session = await getServerSession(authOptions);

  if (!(session?.user as any)?.id) return [];

  return prisma.notification.findMany({
    where: {
      userId: (session?.user as any)?.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });
}

export async function markAsRead(id: string) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return null;

  return prisma.notification.update({
    where: { id, userId: (session?.user as any)?.id },
    data: { isRead: true },
  });
}

export async function markAllAsRead() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return null;

  return prisma.notification.updateMany({
    where: { userId: (session?.user as any)?.id, isRead: false },
    data: { isRead: true },
  });
}
