import { withAuth } from "next-auth/middleware";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";

// Konfigurasi Localization
const locales = ["id", "en"];
const defaultLocale = "id";
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
});

// Daftar Halaman Terproteksi (Sesuai dengan variabel yang kamu miliki sebelumnya)
const buyerPage = [
  "/orders",
  "/profile",
  "/settings",
  "/cart",
  "/checkout",
  "/wishlist",
];
const adminPage = ["/seller"];

// Fungsi pembantu untuk membersihkan prefix locale dari URL agar logika startsWith tetap akurat
// Contoh: "/id/orders" -> "/orders"
function getCleanPathname(pathname: string): string {
  const segments = pathname.split("/");
  if (locales.includes(segments[1])) {
    return "/" + segments.slice(2).join("/");
  }
  return pathname;
}

export default withAuth(
  function middleware(req) {
    const getToken = req.nextauth.token;
    const rawUrl = req.nextUrl.pathname;

    // Bersihkan prefix bahasa untuk pengecekan rute
    const cleanUrl = getCleanPathname(rawUrl);

    // Ambil locale aktif dari URL untuk mempertahankan bahasa saat redirect
    const activeLocale = rawUrl.split("/")[1] || defaultLocale;
    const localePrefix = locales.includes(activeLocale)
      ? `/${activeLocale}`
      : `/${defaultLocale}`;

    // 1. Kalau user SUDAH LOGIN tapi mencoba akses /sign-in, tendang keluar
    if (cleanUrl.startsWith("/sign-in") && getToken) {
      const redirectUrl =
        getToken.role === "SELLER"
          ? `${localePrefix}/seller`
          : `${localePrefix}`;
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }

    // 2. Kalau role user tidak sesuai untuk adminPage, tendang keluar
    if (
      adminPage.some((page) => cleanUrl.startsWith(page)) &&
      getToken?.role !== "SELLER" &&
      getToken?.role !== "EMPLOYEE"
    ) {
      return NextResponse.redirect(new URL(`${localePrefix}`, req.url));
    }

    // 2.1 Cek apakah Seller sudah menyelesaikan onboarding (punya storeProfile)
    if (
      adminPage.some((page) => cleanUrl.startsWith(page)) &&
      getToken?.role === "SELLER" &&
      !(getToken as any).storeProfile &&
      !cleanUrl.startsWith("/seller/onboarding")
    ) {
      return NextResponse.redirect(new URL(`${localePrefix}/seller/onboarding`, req.url));
    }
    
    // Jika Seller sudah memiliki profile tapi mencoba ke halaman onboarding, redirect ke dashboard
    if (
      cleanUrl.startsWith("/seller/onboarding") &&
      getToken?.role === "SELLER" &&
      (getToken as any).storeProfile
    ) {
      return NextResponse.redirect(new URL(`${localePrefix}/seller`, req.url));
    }

    // 3. Kalau role user tidak sesuai untuk buyerPage, tendang keluar
    if (
      buyerPage.some((page) => cleanUrl.startsWith(page)) &&
      getToken?.role !== "BUYER"
    ) {
      return NextResponse.redirect(new URL(`${localePrefix}`, req.url));
    }

    // Jika lolos semua filter keamanan Next-Auth, serahkan kontrol rute ke next-intl
    return intlMiddleware(req);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const rawUrl = req.nextUrl.pathname;
        const cleanUrl = getCleanPathname(rawUrl);

        // Abaikan pengecekan login untuk rute sign-in
        if (cleanUrl.startsWith("/sign-in")) {
          return true;
        }

        // Tentukan apakah rute yang sedang diakses butuh login atau publik (seperti HomePage)
        const isProtectedRoute =
          buyerPage.some((page) => cleanUrl.startsWith(page)) ||
          adminPage.some((page) => cleanUrl.startsWith(page));

        // Jika rute tersebut publik (tidak ada di daftar terproteksi), izinkan lewat tanpa token
        if (!isProtectedRoute) {
          return true;
        }

        // Jika rute terproteksi, pastikan user memiliki hak akses yang valid
        return token?.role === "SELLER" || token?.role === "EMPLOYEE" || token?.role === "BUYER";
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
  },
);

export const config = {
  matcher: [
    "/",
    "/seller/:path*",
    "/orders/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/cart/:path*",
    "/checkout/:path*",
    "/wishlist/:path*",
    "/sign-in",
    "/(id|en)/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
