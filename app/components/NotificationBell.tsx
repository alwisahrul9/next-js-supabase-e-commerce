"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";;
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNotifications, markAsRead, markAllAsRead } from "@/app/actions/notifications";
import { createClient } from "@/app/lib/supabase-client";

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const router = useRouter();

  const fetchNotifications = async () => {
    const data = await getNotifications();
    setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();

    if ("Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }

    const supabase = createClient();
    const channel = supabase
      .channel("realtime_notifications_bell")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `userId=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as any;
          setNotifications((prev) => [newNotification, ...prev].slice(0, 10));

          if ("Notification" in window && Notification.permission === "granted") {
            const notification = new Notification(newNotification.title, {
              body: newNotification.message,
            });

            if (newNotification.link) {
              notification.onclick = () => {
                window.focus();
                router.push(newNotification.link);
                notification.close();
              };
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log("Supabase Realtime status:", status);
        if (err) console.error("Supabase Realtime error:", err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 relative outline-none">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-orange-600 rounded-full animate-pulse"></span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 rounded-xl shadow-lg border-zinc-200 dark:border-zinc-800">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 font-semibold flex items-center justify-between">
          <span>Notifikasi</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-medium bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">
              {unreadCount} Baru
            </span>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-zinc-500">Belum ada notifikasi.</div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer ${!notif.isRead ? "bg-orange-50/50 dark:bg-orange-950/10" : ""
                  }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className={`font-medium text-sm ${!notif.isRead ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"}`}>
                    {notif.title}
                  </div>
                  <span className="text-xs text-zinc-500 whitespace-nowrap">
                    {formatDistanceToNow(new Date(notif.createdAt), {
                      addSuffix: true,
                      locale: idLocale,
                    })}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  {notif.message}
                </p>
              </div>
            ))
          )}
        </div>
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 text-center">
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-orange-600 dark:text-orange-500 hover:underline font-medium p-1 w-full"
            >
              Tandai semua dibaca
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
