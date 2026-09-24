"use server";

import { signIn } from "next-auth/react";

export async function loginHandle(
  email: string,
  password: string,
  role: "buyer" | "seller",
) {
  try {
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      role,
    });

    return result
  } catch (error) {
    console.error("An error occurred during login:", error);
    return { error: "An error occurred during login." };
  }
}

import { hash } from "bcrypt-ts";
import { prisma } from "@/app/lib/db";

export async function registerUser(data: any) {
  try {
    const { name, email, password, role } = data;

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, msg: "server.emailRegistered" };
    }

    const hashedPassword = await hash(password, 10);
    const userRole = role === "seller" ? "SELLER" : "BUYER";

    // Cek apakah sudah ada seller jika mencoba mendaftar sebagai seller
    if (userRole === "SELLER") {
      const sellerCount = await prisma.user.count({
        where: { role: "SELLER" }
      });
      if (sellerCount >= 1) {
        return { success: false, msg: "server.sellerLimitReached" };
      }
    }

    // Buat User dan Profile dalam satu transaksi
    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: userRole as any, // Cast to any to avoid strict type error if needed, but it should accept "BUYER"|"SELLER"
        },
      });

      if (userRole === "BUYER") {
        await tx.buyerProfile.create({
          data: {
            userId: newUser.id,
          },
        });
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Register Error:", error);
    return { success: false, msg: "server.error" };
  }
}
