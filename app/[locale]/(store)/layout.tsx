"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";;
import {
  ShoppingBag,
  ShoppingCart,
  Store,
  Search,
  User,
  Menu,
  X,
  Sparkles,
  ArrowRight,
  Heart,
  Settings,
  UserCircle
} from "lucide-react";
import LangSwitcher from "@/app/components/ui/lang-switcher";
import { useSession, signOut } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { useCartStore } from "@/app/hooks/use-cart";
import NotificationBell from "@/app/components/NotificationBell";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const locale = useLocale();
  const pathname = usePathname();
  const { data: session } = useSession();
  const t = useTranslations("StoreNav");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  const isSellerOrEmployee = (session?.user as any)?.role === "SELLER" || (session?.user as any)?.role === "EMPLOYEE";

  const { items, isLoaded, fetchCart } = useCartStore();

  useEffect(() => {
    if (session?.user && !isSellerOrEmployee && !isLoaded) {
      fetchCart();
    }
  }, [session, isSellerOrEmployee, isLoaded, fetchCart]);

  const cartCount = items.reduce((total, item) => total + item.quantity, 0);
  const navItems = [
    { label: t("home"), href: "/" },
    { label: t("products"), href: "/products" },
  ];
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors duration-300 flex flex-col">
      {/* Top Banner */} 
      {isBannerVisible && (
        <div className="relative bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 text-white py-2 px-8 sm:px-4 text-center text-[10px] sm:text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 sm:gap-2"> 
          <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-pulse flex-shrink-0" /> 
          <span className="line-clamp-1 sm:line-clamp-none">
            {t("freeShippingBanner")}
          </span> 
          <button 
            onClick={() => setIsBannerVisible(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label={t("closeBanner")}
          >
            <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
        </div>
      )} 
      {/* Main Header / Navbar */}{" "}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200/80 shadow-xs">
        {" "}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {" "}
          {/* Left: Brand Logo */}{" "}
          <div className="flex items-center gap-6">
            {" "}
            <Link href={`/${locale}`} className="flex items-center gap-2.5 group">
              {" "}
              <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform duration-200">
                {" "}
                <ShoppingBag className="h-5 w-5" />{" "}
              </div>{" "}
              <div className="flex flex-col">
                {" "}
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  {" "}
                  DRESS.CO{" "}
                </span>{" "}
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest -mt-1 font-semibold">
                  {" "}
                  FASHION STORE{" "}
                </span>{" "}
              </div>{" "}
            </Link>{" "}
            {/* Desktop Navigation Links */}{" "}
            <nav className="hidden md:flex items-center gap-1">
              {" "}
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.endsWith(item.href) ||
                  (item.href === "/products" && pathname.includes("/products"));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isActive ? "text-orange-600 bg-orange-50 " : "text-zinc-600 hover:text-zinc-950 :text-zinc-100 hover:bg-zinc-100 :bg-zinc-800/50"}`}
                  >
                    {" "}
                    {item.label}{" "}
                  </Link>
                );
              })}{" "}
            </nav>{" "}
          </div>{" "}
          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher (Hidden on Mobile) */}
            <div className="hidden md:block bg-zinc-100 border border-zinc-200 p-1 rounded-lg">
              <LangSwitcher />
            </div>
            
            {/* Cart Icon (Hidden on Mobile) */}
            {!isSellerOrEmployee && (
              <Link
                href={`/${locale}/cart`}
                className="hidden md:flex relative p-2.5 rounded-xl bg-zinc-100 text-zinc-700 hover:bg-orange-50 hover:text-orange-600 transition-all group"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-orange-600 text-white text-[11px] font-bold flex items-center justify-center shadow-md animate-bounce">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            
            {/* Notification Bell */}
            {session?.user && (
              <NotificationBell userId={(session.user as any).id} />
            )}
            
            {/* Auth / Profile & Seller Dashboard button (Hidden on Mobile) */}
            {session?.user ? (
              <div className="hidden md:flex items-center gap-2">
                {(session.user as any).role === "SELLER" && (
                  <Link
                    href={`/${locale}/seller`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
                  >
                    <Store className="h-3.5 w-3.5" />
                    {t("sellerDashboard")}
                  </Link>
                )}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsProfileDropdownOpen(!isProfileDropdownOpen);
                    }}
                    className="p-2 rounded-xl text-zinc-500 hover:text-orange-600 hover:bg-orange-50 text-xs font-semibold transition-all flex items-center"
                    title={t("profile") || "Profile"}
                  >
                    <UserCircle className="h-5 w-5" />
                  </button>
                  
                  {isProfileDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsProfileDropdownOpen(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2">
                        {(session.user as any).role !== "SELLER" && (session.user as any).role !== "EMPLOYEE" && (
                          <>
                            <Link 
                              href={`/${locale}/orders`} 
                              className="flex items-center px-4 py-2 text-sm text-zinc-700 hover:bg-orange-50 hover:text-orange-600"
                              onClick={() => setIsProfileDropdownOpen(false)}
                            >
                              <ShoppingBag className="h-4 w-4 mr-2" /> {t("orders")}
                            </Link>
                            <Link 
                              href={`/${locale}/profile`} 
                              className="flex items-center px-4 py-2 text-sm text-zinc-700 hover:bg-orange-50 hover:text-orange-600"
                              onClick={() => setIsProfileDropdownOpen(false)}
                            >
                              <UserCircle className="h-4 w-4 mr-2" /> {t("accountSettings")}
                            </Link>
                          </>
                        )}
                        <div className="h-px bg-zinc-100 my-1"></div>
                        <button 
                          onClick={() => { setIsLogoutModalOpen(true); setIsProfileDropdownOpen(false); }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          {t("logout")}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <Link
                href={`/${locale}/sign-in`}
                className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
              >
                <User className="h-4 w-4" /> <span>{t("signIn")}</span>
              </Link>
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-xl bg-zinc-100 text-zinc-600 md:hidden hover:bg-zinc-200 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <div className="relative">
                  <Menu className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-orange-600 border-2 border-zinc-100" />
                  )}
                </div>
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-4 space-y-4 shadow-xl">
            {/* Mobile Navigation Links */}
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-base font-semibold text-zinc-700 hover:bg-orange-50 hover:text-orange-600"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            
            {/* Mobile Actions Divider */}
            <div className="h-px w-full bg-zinc-100" />
            
            <div className="space-y-3">
              {/* Mobile Cart */}
              {!isSellerOrEmployee && (
                <Link
                  href={`/${locale}/cart`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-50 text-zinc-700 font-medium"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-5 w-5 text-zinc-500" />
                    <span>{t("cart")}</span>
                  </div>
                  {cartCount > 0 && (
                    <span className="h-6 w-6 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}
              
              {/* Mobile Language Switcher */}
              <div className="px-3 py-2 bg-zinc-50 rounded-lg flex items-center justify-between">
                <span className="font-medium text-zinc-700 text-sm">{t("changeLanguage")}</span>
                <LangSwitcher />
              </div>
              
              {/* Mobile Auth */}
              {session?.user ? (
                <div className="space-y-2 pt-2">
                  {(session.user as any).role === "SELLER" && (
                    <Link
                      href={`/${locale}/seller`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 justify-center w-full px-4 py-3 rounded-xl text-sm font-semibold text-white bg-orange-500"
                    >
                      <Store className="h-4 w-4" /> {t("sellerDashboard")}
                    </Link>
                  )}
                  {(session.user as any).role !== "SELLER" && (session.user as any).role !== "EMPLOYEE" && (
                    <>
                      <Link
                        href={`/${locale}/orders`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center w-full px-4 py-3 rounded-xl text-sm font-semibold text-zinc-700 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 mb-2"
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" /> {t("orders")}
                      </Link>
                      <Link
                        href={`/${locale}/profile`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center w-full px-4 py-3 rounded-xl text-sm font-semibold text-zinc-700 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 mb-2"
                      >
                        <UserCircle className="h-4 w-4 mr-2" /> {t("accountSettings")}
                      </Link>
                    </>
                  )}
                  <button
                    onClick={() => { setIsLogoutModalOpen(true); setIsMobileMenuOpen(false); }}
                    className="flex items-center justify-center w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100"
                  >
                    {t("logout")}
                  </button>
                </div>
              ) : (
                <div className="pt-2">
                  <Link
                    href={`/${locale}/sign-in`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-zinc-900 text-white text-sm font-semibold rounded-xl"
                  >
                    <User className="h-4 w-4" /> <span>{t("signIn")}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>{" "}
      {/* Page Body Content */}{" "}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {" "}
        {children}{" "}
      </main>{" "}
      {/* Footer */}{" "}
      <footer className="mt-auto border-t border-zinc-200 bg-white text-zinc-600 py-12">
        {" "}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          {" "}
          <div className="flex items-center gap-2">
            {" "}
            <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold">
              {" "}
              D{" "}
            </div>{" "}
            <span className="font-bold text-lg text-zinc-900 tracking-wider">
              {" "}
              DRESS.CO{" "}
            </span>{" "}
          </div>{" "}
          <p className="text-xs text-zinc-500 text-center">
            {" "}
            &copy; {new Date().getFullYear()} DRESS.CO. All rights reserved.
            Platform Fashion Multi-Warehouse Terdepan.{" "}
          </p>{" "}
          <div className="flex gap-4 text-xs font-semibold">
            {" "}
            <Link
              href={`/${locale}/products`}
              className="hover:text-orange-500 transition-colors"
            >
              {" "}
              Produk{" "}
            </Link>{" "}
            <Link
              href={`/${locale}/seller`}
              className="hover:text-orange-500 transition-colors"
            >
              {" "}
              Seller Hub{" "}
            </Link>{" "}
          </div>{" "}
        </div>{" "}
      </footer>{" "}

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-zinc-200 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-zinc-900 mb-2">{t("logoutConfirmTitle")}</h3>
            <p className="text-zinc-600 text-sm mb-6">{t("logoutConfirmMessage")}</p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors"
              >
                {t("cancel")}
              </button>
              <button 
                onClick={() => signOut()}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                {t("confirmLogout")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
