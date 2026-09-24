"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  Menu,
  X,
  Bell,
  Store,
  LogOut,
  Warehouse,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/app/components/ui/theme-toggle";
import LangSwitcher from "@/app/components/ui/lang-switcher";
import { useSession, signOut } from "next-auth/react";
import { toTitleCase } from "@/lib/utils";
import { useTranslations } from "next-intl";
import Image from "next/image";
import NotificationBell from "@/app/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

export default function SellerLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split("/")[1];
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { data: session } = useSession();

  const t = useTranslations("SellerLayout");

  const menuItems = [
    { key: "dashboard", href: "/seller", icon: LayoutDashboard },
    { key: "products", href: "/seller/products", icon: Package },
    { key: "warehouses", href: "/seller/warehouses", icon: Warehouse },
    { key: "orders", href: "/seller/orders", icon: ShoppingBag },
    { key: "returns", href: "/seller/returns", icon: RotateCcw },
    { key: "customers", href: "/seller/customers", icon: Users },
    { key: "settings", href: "/seller/settings", icon: Settings },
  ];

  const userRole = (session?.user as any)?.role;
  const employeeProfile = (session?.user as any)?.employeeProfile;

  const filteredMenuItems = menuItems.filter((item) => {
    if (userRole === "SELLER") return true;
    if (userRole === "EMPLOYEE") {
      if (item.key === "dashboard") return true;
      if (item.key === "products" && employeeProfile?.canManageProducts) return true;
      if (item.key === "orders" && employeeProfile?.canManageOrders) return true;
      if (item.key === "returns" && employeeProfile?.canManageOrders) return true;
      if (item.key === "customers" && employeeProfile?.canManageCustomers) return true;
      // Employee tidak bisa akses settings untuk saat ini
      return false;
    }
    return false;
  });

  const isActive = (href: string) => {
    if (href === "/seller")
      return (
        pathname === href ||
        pathname === `/id${href}` ||
        pathname === `/en${href}`
      );
    return pathname.includes(href);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" }); // Mengarahkan user kembali ke homepage setelah logout
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300 flex">
      {/* ================= SIDEBAR (DESKTOP) ================= */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800 gap-2">
          <Store className="h-6 w-6 text-orange-600 dark:text-orange-500" />
          <span className="font-bold text-lg tracking-wider">DRESS.CO</span>
          <span className="text-[10px] bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-semibold px-2 py-0.5 rounded-full">
            {t("badge")}
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {filteredMenuItems.map((item) => {
            const ActiveIcon = item.icon;
            const active = isActive(item.href);
            
            // Perbaikan: tambahkan prefix locale agar tetap dalam bahasa yang sedang aktif
            const localizedHref = item.href === '/seller' 
              ? `/${locale}/seller` 
              : `/${locale}${item.href}`;

            return (
              <Link
                key={item.key}
                href={localizedHref}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/10"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-950 dark:hover:text-zinc-200"
                }`}
              >
                <ActiveIcon className="h-5 w-5" />
                {t(`menu.${item.key}`)}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 hidden">
          {/* Logout dipindahkan ke menu profil */}
        </div>
      </aside>

      {/* ================= MOBILE NAVIGATION / DRAWER ================= */}
      <div
        className={`fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
          isSidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-900 h-full flex flex-col transition-transform duration-300 transform lg:hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-orange-500" />
            <span className="font-bold text-lg tracking-wider">DRESS.CO</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {filteredMenuItems.map((item) => {
            const ActiveIcon = item.icon;
            const active = isActive(item.href);
            
            // Perbaikan: tambahkan prefix locale agar tetap dalam bahasa yang sedang aktif
            const localizedHref = item.href === '/seller' 
              ? `/${locale}/seller` 
              : `/${locale}${item.href}`;

            return (
              <Link
                key={item.key}
                href={localizedHref}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-orange-500 text-white"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <ActiveIcon className="h-5 w-5" />
                {t(`menu.${item.key}`)}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 hidden">
          {/* Logout dipindahkan ke menu profil */}
        </div>
      </aside>

      {/* ================= MAIN CONTENT CONTAINER ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <h2 className="font-semibold text-sm text-zinc-500 dark:text-zinc-400">
              {t("activeStore")}:
            </h2>
            <span className="font-medium text-sm text-zinc-800 dark:text-zinc-200">
              {(session?.user as any)?.storeProfile?.storeName ?? "-"}
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 p-1.5 rounded-lg flex items-center">
              <LangSwitcher />
            </div>

            <ThemeToggle />

            {(session?.user as any)?.id && <NotificationBell userId={(session?.user as any).id} />}

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 pl-1 cursor-pointer group outline-none">
                {(session?.user as any)?.storeProfile?.logoUrl ? (
                  <Image
                    alt="Profile"
                    src={(session?.user as any)?.storeProfile?.logoUrl}
                    width={100}
                    height={100}
                    className="rounded-full w-9 h-9 object-cover ring-2 ring-transparent group-hover:ring-orange-500 transition-all"
                  />
                ) : (
                  <span className="h-9 w-9 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center font-bold text-orange-600 dark:text-orange-400 ring-2 ring-transparent group-hover:ring-orange-500 transition-all">
                    {session?.user?.name
                      ? session.user.name.substring(0, 2).toUpperCase()
                      : "SF"}
                  </span>
                )}
                <span className="hidden md:block text-left">
                  <span className="block text-sm font-semibold leading-none text-zinc-950 dark:text-zinc-200">
                    {session?.user?.name?.split(" ")[0]}
                  </span>
                  <span className="block text-xs text-zinc-400 mt-0.5">
                    {toTitleCase((session?.user as any)?.role ?? "")}
                  </span>
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl border-zinc-200 dark:border-zinc-800 shadow-lg">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal p-3 border-b border-zinc-100 dark:border-zinc-800/50">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                      <p className="text-xs leading-none text-zinc-500 dark:text-zinc-400">
                        {session?.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                {userRole !== "EMPLOYEE" && (
                  <DropdownMenuGroup className="p-1.5">
                    <DropdownMenuItem 
                      onClick={() => router.push(`/${locale}/seller/settings`)}
                      className="cursor-pointer gap-2 py-2 rounded-lg text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    >
                      <Settings className="h-4 w-4 text-zinc-500" />
                      <span>{t("menu.settings")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                )}
                <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800" />
                <DropdownMenuGroup className="p-1.5">
                  <DropdownMenuItem 
                    onClick={() => setIsLogoutModalOpen(true)}
                    className="cursor-pointer gap-2 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t("logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 hidden xs:block"></div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {modal}
          {children}
        </main>
      </div>

      {/* ================= DIALOG / MODAL KONFIRMASI LOGOUT ================= */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay gelap */}
          <div
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsLogoutModalOpen(false)}
          />

          {/* Box Modal */}
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-6 transition-all transform scale-100">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {t("logoutModal.title")}
            </h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {t("logoutModal.description")}
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 transition-all"
              >
                {t("logoutModal.cancel")}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/10 transition-all"
              >
                {t("logoutModal.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
