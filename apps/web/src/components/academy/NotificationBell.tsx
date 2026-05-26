"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Megaphone,
  Inbox,
  CheckCircle,
  AtSign,
  X,
  CheckCheck
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
      return <Megaphone className="w-4 h-4 text-yellow-500" />;
    case "submission":
      return <Inbox className="w-4 h-4 text-blue-400" />;
    case "feedback":
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    case "mention":
      return <AtSign className="w-4 h-4 text-purple-400" />;
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

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getUnreadNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, []);

  // Initial fetch + polling every 15 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      setIsOpen(false);
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

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-yellow-500 transition-colors rounded-lg hover:bg-yellow-500/10"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[9px] font-black text-slate-950 bg-yellow-500 rounded-full ring-2 ring-background animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-background border border-border rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <span className="text-xs font-black uppercase tracking-[0.15em] text-foreground">
              Notifications
            </span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="text-[10px] font-bold uppercase tracking-wider text-yellow-500 hover:text-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Clear All
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto">
            {unreadCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground/60 mt-1">No new notifications.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  disabled={loading}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-yellow-500/5 transition-all border-b border-border/50 last:border-0 disabled:opacity-50 group"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center mt-0.5 group-hover:bg-yellow-500/10 transition-colors">
                    {getNotifIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mt-1">
                      {timeAgo(notif.created_at)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-yellow-500 mt-2 animate-pulse" />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
