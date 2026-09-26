"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";
import { z } from "zod";
import { prisma } from "@/app/lib/db";
import { revalidatePath } from "next/cache";
import { getTranslations, getLocale } from "next-intl/server";
import { compare, hash } from "bcrypt-ts";

const getAddressSchema = (t: any) => z.object({
  id: z.string().nullable().optional(),
  label: z.string().min(1, t("valLabelRequired")),
  receiverName: z.string().min(1, t("valReceiverNameRequired")),
  receiverPhone: z.string().min(1, t("valReceiverPhoneRequired")),
  province: z.string().min(1, t("valProvinceRequired")),
  cityId: z.string().nullable().optional(),
  city: z.string().min(1, t("valCityRequired")),
  district: z.string().min(1, t("valDistrictRequired")),
  districtId: z.string().nullable().optional(),
  village: z.string().min(1, t("valVillageRequired")),
  villageId: z.string().nullable().optional(),
  postcode: z.string().min(1, t("valPostcodeRequired")).regex(/^\d+$/, t("valPostcodeNumber")),
  streetAddress: z.string().min(1, t("valStreetAddressRequired")),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  isDefault: z.boolean().optional(),
});

export async function getBuyerProfileData() {
  const session = await getServerSession(authOptions);

  if (!(session?.user as any)?.id) {
    return { success: false, msg: "server.unauthorized" };
  }

  const userId = (session?.user as any)?.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        buyerProfile: {
          include: {
            addresses: {
              orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' }
              ]
            }
          }
        }
      }
    });

    if (!user) {
      return { success: false, msg: "server.error" };
    }

    // If buyer profile doesn't exist, create it
    if (!user.buyerProfile) {
      const newBuyerProfile = await prisma.buyerProfile.create({
        data: { userId },
        include: { addresses: true }
      });
      return {
        success: true,
        data: {
          name: user.name,
          email: user.email,
          phone: newBuyerProfile.phone,
          addresses: newBuyerProfile.addresses,
          isOAuthUser: !user.password,
        }
      };
    }

    return {
      success: true,
      data: {
        name: user.name,
        email: user.email,
        phone: user.buyerProfile.phone,
        addresses: user.buyerProfile.addresses,
        isOAuthUser: !user.password,
      }
    };
  } catch (error) {
    console.error("Failed to get profile data:", error);
    return { success: false, msg: "server.error" };
  }
}

const getProfileInfoSchema = (t: any) => z.object({
  name: z.string().min(1, t("valNameRequired") || "Name is required"),
  email: z.string().min(1, t("valEmailRequired") || "Email is required").email(t("valEmailInvalid") || "Invalid email"),
  phone: z.string().optional(),
  oldPassword: z.string().optional(),
  newPassword: z.string().optional().refine(val => !val || val.length >= 6, {
    message: t("valPasswordMin") || "Password minimum 6 characters",
  }),
}).refine(data => {
  if (data.newPassword && !data.oldPassword) {
    return false;
  }
  return true;
}, {
  message: t("valOldPasswordRequired") || "Old password is required to set a new password",
  path: ["oldPassword"]
});

export async function updateProfileAction(prevState: any, data: any) {
  const t = await getTranslations({ locale: await getLocale(), namespace: "Profile" });
  const schema = getProfileInfoSchema(t);

  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      msg: t("valFormError")
    };
  }

  return await updateProfile(parsed.data as any, t);
}

export async function updateProfile(data: { name: string; phone?: string; email: string; oldPassword?: string; newPassword?: string }, t?: any) {
  const session = await getServerSession(authOptions);

  if (!(session?.user as any)?.id) {
    return { success: false, msg: "server.unauthorized" };
  }

  const userId = (session?.user as any)?.id;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, msg: "server.error" };

    let newPasswordHash = undefined;

    if (data.newPassword) {
      if (!user.password) {
        return { success: false, msg: "server.error" };
      }

      if (!data.oldPassword) {
        return { success: false, errors: { oldPassword: [t ? t("valOldPasswordRequired") : "Old password is required"] } };
      }

      const isValid = await compare(data.oldPassword, user.password);
      if (!isValid) {
        return { success: false, errors: { oldPassword: [t ? t("valOldPasswordIncorrect") : "Old password is incorrect"] } };
      }

      newPasswordHash = await hash(data.newPassword, 10);
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          email: data.email,
          ...(newPasswordHash ? { password: newPasswordHash } : {})
        }
      });

      const buyerProfile = await tx.buyerProfile.findUnique({ where: { userId } });
      if (buyerProfile && data.phone !== undefined) {
        await tx.buyerProfile.update({
          where: { userId },
          data: { phone: data.phone }
        });
      }
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return { success: false, msg: "server.error" };
  }
}

export async function addAddress(data: any) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return { success: false, msg: "server.unauthorized" };

  try {
    const buyerProfile = await prisma.buyerProfile.findUnique({ where: { userId: (session?.user as any)?.id } });
    if (!buyerProfile) return { success: false, msg: "server.error" };

    // If this is the first address, make it default
    const count = await prisma.address.count({ where: { buyerProfileId: buyerProfile.id } });
    const isDefault = count === 0 || data.isDefault;

    if (isDefault) {
      await prisma.address.updateMany({
        where: { buyerProfileId: buyerProfile.id },
        data: { isDefault: false }
      });
    }

    await prisma.address.create({
      data: {
        buyerProfileId: buyerProfile.id,
        label: data.label,
        receiverName: data.receiverName,
        receiverPhone: data.receiverPhone,
        province: data.province,
        city: data.city,
        cityId: data.cityId,
        district: data.district,
        districtId: data.districtId,
        village: data.village,
        villageId: data.villageId,
        postcode: data.postcode,
        streetAddress: data.streetAddress,
        latitude: data.latitude,
        longitude: data.longitude,
        isDefault: isDefault
      }
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Failed to add address:", error);
    return { success: false, msg: "server.error" };
  }
}

export async function updateAddress(addressId: string, data: any) {
  const session = await getServerSession(authOptions);

  if (!(session?.user as any)?.id) return { success: false, msg: "server.unauthorized" };

  try {
    const buyerProfile = await prisma.buyerProfile.findUnique({ where: { userId: (session?.user as any)?.id } });
    if (!buyerProfile) return { success: false, msg: "server.error" };

    // Ensure address belongs to user
    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.buyerProfileId !== buyerProfile.id) {
      return { success: false, msg: "server.unauthorized" };
    }

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { buyerProfileId: buyerProfile.id },
        data: { isDefault: false }
      });
    }

    await prisma.address.update({
      where: { id: addressId },
      data: {
        label: data.label,
        receiverName: data.receiverName,
        receiverPhone: data.receiverPhone,
        province: data.province,
        city: data.city,
        cityId: data.cityId,
        district: data.district,
        districtId: data.districtId,
        village: data.village,
        villageId: data.villageId,
        postcode: data.postcode,
        streetAddress: data.streetAddress,
        latitude: data.latitude,
        longitude: data.longitude,
        ...(data.isDefault !== undefined && { isDefault: data.isDefault })
      }
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update address:", error);
    return { success: false, msg: error?.message || "server.error" };
  }
}

export async function deleteAddress(addressId: string) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return { success: false, msg: "server.unauthorized" };

  try {
    const buyerProfile = await prisma.buyerProfile.findUnique({ where: { userId: (session?.user as any)?.id } });
    if (!buyerProfile) return { success: false, msg: "server.error" };

    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.buyerProfileId !== buyerProfile.id) {
      return { success: false, msg: "server.unauthorized" };
    }

    await prisma.address.delete({ where: { id: addressId } });

    // If we deleted the default address, set another one as default
    if (address.isDefault) {
      const remainingAddress = await prisma.address.findFirst({
        where: { buyerProfileId: buyerProfile.id }
      });
      if (remainingAddress) {
        await prisma.address.update({
          where: { id: remainingAddress.id },
          data: { isDefault: true }
        });
      }
    }

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete address:", error);
    return { success: false, msg: "server.error" };
  }
}

export async function setDefaultAddress(addressId: string) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return { success: false, msg: "server.unauthorized" };

  try {
    const buyerProfile = await prisma.buyerProfile.findUnique({ where: { userId: (session?.user as any)?.id } });
    if (!buyerProfile) return { success: false, msg: "server.error" };

    await prisma.$transaction([
      prisma.address.updateMany({
        where: { buyerProfileId: buyerProfile.id },
        data: { isDefault: false }
      }),
      prisma.address.update({
        where: { id: addressId },
        data: { isDefault: true }
      })
    ]);

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Failed to set default address:", error);
    return { success: false, msg: "server.error" };
  }
}

export async function saveAddressAction(prevState: any, data: any) {
  const t = await getTranslations({ locale: await getLocale(), namespace: "Profile" });
  const addressSchema = getAddressSchema(t);

  const parsed = addressSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      msg: t("valFormError")
    };
  }

  // If there's an ID, update, otherwise add
  if (parsed.data.id) {
    return await updateAddress(parsed.data.id, parsed.data);
  } else {
    return await addAddress(parsed.data);
  }
}
