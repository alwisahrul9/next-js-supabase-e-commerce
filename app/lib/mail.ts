import nodemailer from "nodemailer";

interface SendVerificationEmailOptions {
  to: string;
  token: string;
}
import { getTranslations } from "next-intl/server";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

export async function sendVerificationEmail({
  to,
  token,
  locale = "id",
}: {
  to: string;
  token: string;
  locale?: string;
}) {
  try {
    const t = await getTranslations({ locale, namespace: "Settings" });

    // Fallback if no SMTP configured
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.warn(
        "⚠️ SMTP credentials not found in environment variables. Simulating email sending:",
      );
      console.log("-----------------------------------------");
      console.log(`To: ${to}`);
      console.log(`Subject: ${t("emailSubject")} (Simulated)`);
      console.log(`OTP Token: ${token}`);
      console.log("-----------------------------------------");
      return { success: true, simulated: true };
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Dress Commerce" <${SMTP_USER}>`,
      to,
      subject: t("emailSubject"),
      text: t("emailText", { token }),
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>${t("emailTitle")}</h2>
          <p>${t("emailLine1")}</p>
          <p>${t("emailLine2")}</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #f4f4f4; border-radius: 8px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px;">
            ${token}
          </div>
          <p style="color: #666; font-size: 14px;">${t("emailValidTime")}</p>
          <p style="color: #666; font-size: 14px;">${t("emailIgnore")}</p>
        </div>
      `,
    });

    console.log("Email sent: %s", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { success: false, error };
  }
}

export async function sendShipmentNotificationEmail({
  to,
  orderId,
  warehouseName,
  courier,
  service,
}: {
  to: string;
  orderId: string;
  warehouseName: string;
  courier: string;
  service: string;
}) {
  try {
    const t = await getTranslations({ locale: "id", namespace: "Notifications" });

    // Fallback if no SMTP configured
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.warn("⚠️ SMTP credentials not found. Simulating email sending:");
      console.log("-----------------------------------------");
      console.log(`To: ${to}`);
      console.log(`Subject: ${t("emailShippedSubject")}`);
      console.log(
        `Message: ${t("emailShippedText", { orderId, warehouseName, courier, service })}`,
      );
      console.log("-----------------------------------------");
      return { success: true, simulated: true };
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Dress Commerce" <${SMTP_USER}>`,
      to,
      subject: t("emailShippedSubject"),
      text: t("emailShippedText", { orderId, warehouseName, courier, service }),
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>${t("emailShippedHeading")}</h2>
          <p>${t.markup("emailShippedLine1", { orderId, warehouseName, strong: (chunks) => `<strong>${chunks}</strong>` })}</p>
          <p>${t.markup("emailShippedLine2", { courier, service, strong: (chunks) => `<strong>${chunks}</strong>` })}</p>
          <p>${t("emailShippedLine3")}</p>
          <br/>
          <p>${t("emailShippedThanks")}</p>
        </div>
      `,
    });

    console.log("Shipment Email sent: %s", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("Error sending shipment email:", error);
    return { success: false, error };
  }
}
