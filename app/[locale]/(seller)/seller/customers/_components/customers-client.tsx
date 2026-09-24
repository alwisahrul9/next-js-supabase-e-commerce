"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getCustomersAction } from "../actions";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

interface Customer {
  id: string;
  name: string | null;
  email: string;
  buyerProfile: { phone: string | null } | null;
  orders: { id: string }[];
}

interface CustomersClientProps {
  initialCustomers: Customer[];
  storeId: string;
}

function censorEmail(email: string) {
  if (!email || !email.includes('@')) return email;
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name.substring(0, 2)}***${name.substring(name.length - 1)}@${domain}`;
}

function censorPhone(phone?: string | null) {
  if (!phone) return "-";
  if (phone.length <= 4) return phone;
  return `${phone.substring(0, 4)}****${phone.substring(phone.length - 4)}`;
}

export default function CustomersClient({ initialCustomers, storeId }: CustomersClientProps) {
  const t = useTranslations("SellerCustomers");
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialCustomers.length === 10);
  const [loading, setLoading] = useState(false);
  
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const newCustomers = await getCustomersAction(storeId, nextPage);
      
      if (newCustomers.length > 0) {
        setCustomers(prev => [...prev, ...newCustomers]);
        setPage(nextPage);
      }
      
      if (newCustomers.length < 10) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more customers:", error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, storeId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [observerTarget, loadMore, hasMore, loading]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="pb-3 font-medium text-zinc-500 dark:text-zinc-400">{t("name")}</th>
              <th className="pb-3 font-medium text-zinc-500 dark:text-zinc-400">{t("email")}</th>
              <th className="pb-3 font-medium text-zinc-500 dark:text-zinc-400">{t("phone")}</th>
              <th className="pb-3 font-medium text-zinc-500 dark:text-zinc-400 text-center">{t("purchases")}</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-zinc-500">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              customers.map((c, index) => (
                <tr key={`${c.id}-${index}`} className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
                  <td className="py-4 text-zinc-900 dark:text-zinc-100 font-medium">
                    {c.name || "User"}
                  </td>
                  <td className="py-4 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                    {censorEmail(c.email)}
                  </td>
                  <td className="py-4 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                    {censorPhone(c.buyerProfile?.phone)}
                  </td>
                  <td className="py-4 text-zinc-900 dark:text-zinc-100 font-bold text-center">
                    {c.orders.length}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Loading trigger element */}
        {hasMore && (
          <div ref={observerTarget} className="py-6 flex justify-center w-full">
            {loading && <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />}
          </div>
        )}
      </div>
    </div>
  );
}
