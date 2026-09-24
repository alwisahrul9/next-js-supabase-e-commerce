"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/app/lib/db";
import { settingsSchema } from "@/app/lib/validations/settings";
import { revalidatePath } from "next/cache";
import { hash } from "bcrypt-ts";
import { sendVerificationEmail } from "@/app/lib/mail";

// Utility to generate 6 digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
import { getTranslations } from "next-intl/server";

export async function requestEmailChange(newEmail: string, locale: string = "id") {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as any).role !== "SELLER") {
      return { success: false, error: "Unauthorized" };
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return { success: false, error: "User ID not found in session" };
    }

    const t = await getTranslations({ locale, namespace: "Settings" });

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
    });
    if (existingUser && existingUser.id !== userId) {
      return { success: false, error: "Email sudah digunakan oleh akun lain." }; // Keep default for now or add to translations later
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save to DB
    // First, delete any existing token for this email to prevent spam/duplicates
    await prisma.verificationToken.deleteMany({
      where: { email: newEmail },
    });

    await prisma.verificationToken.create({
      data: {
        email: newEmail,
        token: otp,
        expiresAt,
      },
    });

    // Send email
    const mailResult = await sendVerificationEmail({ to: newEmail, token: otp, locale });
    if (!mailResult.success) {
      return { success: false, error: t("errorSend") };
    }

    return { success: true };
  } catch (error) {
    console.error("[REQUEST_EMAIL_CHANGE]", error);
    return { success: false, error: "A server error occurred" };
  }
}

export async function updateSellerProfile(
  formData: {
    name: string;
    email: string;
    password?: string;
    image?: string | null;
  },
  otp?: string,
  locale: string = "id"
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as any).role !== "SELLER") {
      return { success: false, error: "Unauthorized" };
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return { success: false, error: "User ID not found in session" };
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    // Validate using zod
    const validation = settingsSchema.safeParse(formData);
    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || "Invalid input";
      return { success: false, error: errorMessage };
    }

    const t = await getTranslations({ locale, namespace: "Settings" });

    const { name, email, password, image } = validation.data;

    // Email change verification check
    if (email !== currentUser.email) {
      if (!otp) {
        return { success: false, error: "OTP_REQUIRED" };
      }

      // Verify OTP
      const verificationRecord = await prisma.verificationToken.findFirst({
        where: { email, token: otp },
      });

      if (!verificationRecord) {
        return { success: false, error: t("otpInvalid") };
      }

      if (verificationRecord.expiresAt < new Date()) {
        return { success: false, error: t("otpExpired") };
      }

      // Valid! Delete the token
      await prisma.verificationToken.delete({
        where: { id: verificationRecord.id },
      });
    }

    const dataToUpdate: any = {
      name,
      email,
    };

    if (image !== undefined) {
      dataToUpdate.image = image;
    }

    if (password && password.trim() !== "") {
      dataToUpdate.password = await hash(password, 10);
    }

    // Run in transaction to update both User and StoreProfile
    await prisma.$transaction(async (tx) => {
      // 1. Update User
      await tx.user.update({
        where: { id: userId },
        data: dataToUpdate,
      });

      // 2. Update StoreProfile logoUrl if image is provided
      if (image !== undefined) {
        await tx.storeProfile.update({
          where: { userId },
          data: { logoUrl: image },
        });
      }
    });

    revalidatePath("/", "layout"); // Revalidate layout to reflect changes across the app

    return { success: true };
  } catch (error) {
    console.error("[UPDATE_SELLER_PROFILE]", error);
    return { success: false, error: "A server error occurred" };
  }
}

export async function updateProfileImageOnly(imageUrl: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as any).role !== "SELLER") {
      return { success: false, error: "Unauthorized" };
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return { success: false, error: "User ID not found in session" };
    }

    // Ambil URL gambar lama untuk dihapus dari bucket
    const oldUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    });

    if (oldUser?.image && oldUser.image !== imageUrl) {
      const bucketUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profiles/`;
      if (oldUser.image.startsWith(bucketUrl)) {
        let path = oldUser.image.replace(bucketUrl, "");
        path = path.split("?")[0]; // Hapus query params jika ada

        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        await supabaseAdmin.storage.from("profiles").remove([path]);
      }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update User
      await tx.user.update({
        where: { id: userId },
        data: { image: imageUrl },
      });

      // 2. Update StoreProfile
      await tx.storeProfile.update({
        where: { userId },
        data: { logoUrl: imageUrl },
      });
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("[UPDATE_PROFILE_IMAGE]", error);
    return { success: false, error: "A server error occurred" };
  }
}

export async function removeProfileImage(imageUrl: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as any).role !== "SELLER") {
      return { success: false, error: "Unauthorized" };
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return { success: false, error: "User ID not found in session" };
    }

    const bucketUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profiles/`;
    if (imageUrl.startsWith(bucketUrl)) {
      let path = imageUrl.replace(bucketUrl, "");
      path = path.split("?")[0];

      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { error } = await supabaseAdmin.storage.from("profiles").remove([path]);
      if (error) {
        console.error("Failed to delete file from Supabase:", error);
      }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update User
      await tx.user.update({
        where: { id: userId },
        data: { image: null },
      });

      // 2. Update StoreProfile
      await tx.storeProfile.update({
        where: { userId },
        data: { logoUrl: null },
      });
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("[REMOVE_PROFILE_IMAGE]", error);
    return { success: false, error: "A server error occurred" };
  }
}
