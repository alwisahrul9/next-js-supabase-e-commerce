"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { revalidatePath } from "next/cache";
import { sellerOnboardingSchema } from "@/app/lib/validations/seller";

export async function completeSellerOnboarding(data: unknown) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as any).role !== "SELLER") {
      return { success: false, message: "Unauthorized" };
    }

    const validatedData = sellerOnboardingSchema.safeParse(data);

    if (!validatedData.success) {
      return { success: false, errors: validatedData.error.flatten().fieldErrors, message: "Periksa kembali data form Anda" };
    }

    const { storeName, storeDescription, logoUrl, warehouses } = validatedData.data;
    const userId = (session.user as any).id;

    // Cek apakah user sudah punya store profile
    const existingProfile = await prisma.storeProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      return { success: false, message: "Store profile already exists" };
    }

    // Cek apakah storeName sudah terpakai
    const existingStoreName = await prisma.storeProfile.findUnique({
      where: { storeName }
    });

    if (existingStoreName) {
      return { success: false, message: "storeNameTaken" };
    }

    // Gunakan Prisma Transaction untuk membuat StoreProfile, Warehouse, dan StoreWallet
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat StoreProfile
      const storeProfile = await tx.storeProfile.create({
        data: {
          userId,
          storeName,
          storeDescription,
          logoUrl: logoUrl || null,
        },
      });

      // 2. Buat Gudang (bisa lebih dari satu)
      await tx.warehouse.createMany({
        data: warehouses.map((w, index) => ({
          storeProfileId: storeProfile.id,
          warehouseName: w.warehouseName,
          isMain: w.isMain || (index === 0 && !warehouses.some(wh => wh.isMain)),
          province: w.province,
          city: w.city,
          cityId: w.cityId,
          district: w.district,
          districtId: w.districtId,
          village: w.village,
          villageId: w.villageId,
          postcode: w.postcode,
          streetAddress: w.streetAddress,
          latitude: w.latitude,
          longitude: w.longitude,
        })),
      });

      // 3. Buat Store Wallet
      await tx.storeWallet.create({
        data: {
          storeProfileId: storeProfile.id,
          escrowBalance: 0,
          withdrawableBalance: 0,
        },
      });

      return storeProfile;
    });

    revalidatePath("/", "layout");

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Onboarding Error:", error);
    if (error.code === 'P2002') {
      return { success: false, message: "storeNameTaken" };
    }
    return { success: false, message: error.message || "Failed to complete onboarding" };
  }
}
