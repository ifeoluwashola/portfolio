"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Megaphone,
  Inbox,
  CheckCircle,
  AtSign,
  CheckCheck,
  Zap,
  ArrowRight,
  Heart
} from "lucide-react";
import { getUnreadNotifications, markNotificationRead, markAllNotificationsRead } from "@/app/academy/actions";

interface Notification {
  id: string;
  user_id: string;
  actor_id?: string;
  type: string;
  message: string;
  reference_url?: string;
  is_read: boolean;
  created_at: string;
  actor_name?: string;
  actor_avatar?: string;
}

function getNotifIcon(type: string) {
  switch (type) {
    case "system":
      return <Megaphone className="w-4 h-4 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]" />;
    case "submission":
      return <Inbox className="w-4 h-4 text-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.3)]" />;
    case "feedback":
      return <CheckCircle className="w-4 h-4 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />;
    case "mention":
      return <AtSign className="w-4 h-4 text-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.3)]" />;
    case "like":
      return <Heart className="w-4 h-4 text-rose-500 fill-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]" />;
    default:
      return <Bell className="w-4 h-4 text-muted-foreground" />;
  }
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function DashboardNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getUnreadNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleNotifClick = async (notif: Notification) => {
    setLoading(true);
    try {
      await markNotificationRead(notif.id);
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      if (notif.reference_url) {
        router.push(notif.reference_url);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await markAllNotificationsRead();
      setNotifications([]);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-bold text-foreground flex items-center gap-2.5 tracking-tight uppercase text-xs">
          <Zap className="w-4 h-4 text-yellow-500 animate-pulse" /> Live Terminal Feed
        </h4>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={loading}
            className="text-[10px] font-bold uppercase tracking-wider text-yellow-500 hover:text-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Clear All
          </button>
        )}
      </div>

      <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1 scrollbar-hide">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border/50 rounded-2xl">
            <Bell className="w-7 h-7 text-muted-foreground/30 mb-2" />
            <p className="text-xs font-semibold text-muted-foreground">Console Clear</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">No unread notifications pending</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => handleNotifClick(notif)}
              disabled={loading}
              className="w-full flex items-start gap-3 p-4 bg-background/30 hover:bg-yellow-500/5 border border-border/50 hover:border-yellow-500/30 rounded-2xl transition-all text-left group/item disabled:opacity-50"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center mt-0.5 group-hover/item:bg-yellow-500/10 transition-colors">
                {getNotifIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground/80 dark:text-muted-foreground/90 leading-relaxed font-semibold">
                  {notif.message}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">
                    {timeAgo(notif.created_at)}
                  </span>
                  {notif.reference_url && (
                    <span className="text-[9px] font-black uppercase tracking-wider text-yellow-500/50 group-hover/item:text-yellow-500 flex items-center gap-1 transition-colors">
                      Inspect <ArrowRight className="w-3 h-3 group-hover/item:translate-x-0.5 transition-transform" />
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
