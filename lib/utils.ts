import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toTitleCase(str: string) {
  return str?.replace(
    /\w\S*/g,
    (text: string) =>
      text.charAt(0).toUpperCase() + text.substring(1).toLowerCase(),
  );
}

// Format angka murni ke string berformat ribuan (contoh: 100000 -> "100.000")
export const formatCurrencyInput = (
  value: number | string,
  currentLocale: string,
) => {
  if (value === 0 || value === "0" || !value) return "";
  const num =
    typeof value === "string" ? parseInt(value.replace(/\D/g, ""), 10) : value;
  if (isNaN(num)) return "";

  return new Intl.NumberFormat(
    currentLocale === "id" ? "id-ID" : "en-US",
  ).format(num);
};

// Mengubah string berformat kembali ke angka murni (contoh: "100.000" -> 100000)
export const parseCurrencyInput = (formattedValue: string) => {
  const cleanNumber = formattedValue.replace(/\D/g, ""); // Hapus semua karakter non-digit
  return cleanNumber === "" ? 0 : parseInt(cleanNumber, 10);
};

export const translateServerMessage = (
  keyOrText: string,
  t: (key: string) => string,
): string => {
  if (!keyOrText) return "";
  try {
    return t(keyOrText);
  } catch {
    return keyOrText;
  }
};

export function formatCurrency(
  value: number,
  currency: string = "IDR",
  locale: string = "id-ID"
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius bumi dalam kilometer
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Jarak dalam kilometer
}
