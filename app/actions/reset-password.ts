"use server";

import { prisma } from "@/app/lib/db";
import { hash } from "bcrypt-ts";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { getTranslations, getLocale } from "next-intl/server";

export async function forgotPassword(email: string) {
  const t = await getTranslations({ locale: await getLocale(), namespace: "ResetPassword" });
  const locale = await getLocale();
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return { success: true };
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save token to DB
    await prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: token,
        resetPasswordExpiry: tokenExpiry,
      },
    });

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Create reset link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/${locale}/reset-password?token=${token}`;

    // Send email
    const info = await transporter.sendMail({
      from: `"Dress.co Support" <${process.env.SMTP_USER || 'support@dress.co'}>`,
      to: email,
      subject: t("emailSubject"),
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
          <h2>${t("title")}</h2>
          <p>${t("emailGreeting")}</p>
          <p>${t("emailReason")}</p>
          <p>${t("emailInstruction")}</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px; margin-bottom: 20px;">${t("emailButton")}</a>
          <p>${t("emailIgnore")}</p>
          <p>${t("emailSignature1")}<br>${t("emailSignature2")}</p>
        </div>
      `,
    });

    console.log("Message sent: %s", info.messageId);

    return { success: true };
  } catch (error) {
    console.log(error)
    return { success: false, error: t("errorDefault") };
  }
}

export async function resetPassword(password: string, token: string) {
  const t = await getTranslations({ locale: await getLocale(), namespace: "ResetPassword" });

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return { success: false, error: t("errorDefault") };
    }

    const hashedPassword = await hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return { success: false, error: t("errorDefault") };
  }
}
