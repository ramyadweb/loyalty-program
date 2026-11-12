import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  X,
  Ticket,
  Gift,
  TrendingUp,
  ShieldCheck,
  UserX,
  ChevronRight,
  ExternalLink,
  Clock,
  Inbox,
  Search,
} from "lucide-react";
import {
  notificationsService,
  type NotificationItem,
} from "../services/api";

interface UserNotificationDropdownProps {
  onRefreshStats?: () => void;
}

export const formatRelativeTime = (dateStr: string): string => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return "Just now";
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export default function UserNotificationDropdown({
  onRefreshStats,
}: UserNotificationDropdownProps) {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "ticket" | "reward" | "account">("all");
  const [historySearch, setHistorySearch] = useState("");

  // Fetch unread count & recent notifications
  const fetchNotifications = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const [countRes, listRes] = await Promise.allSettled([
        notificationsService.getUserUnreadCount(),
        notificationsService.getNotifications(),
      ]);

      if (countRes.status === "fulfilled" && countRes.value.data?.data) {
        setUnreadCount(countRes.value.data.data.unreadCount ?? countRes.value.data.data.count ?? 0);
      }

      if (listRes.status === "fulfilled" && listRes.value.data?.data) {
        setNotifications(listRes.value.data.data);
      }
    } catch (err) {
      console.error("Failed to load user notifications:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Initial load and auto-refresh every 25 seconds
  useEffect(() => {
    fetchNotifications(true);

    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 25000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // Mark individual notification as read & intelligently navigate
  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await notificationsService.markNotificationAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        if (onRefreshStats) onRefreshStats();
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }

    setIsOpen(false);
    setHistoryModalOpen(false);

    // Intelligently route user based on notification type & title
    const t = (notif.type || "").toLowerCase();
    const title = (notif.title || "").toLowerCase();

    if (t.includes("ticket") || title.includes("ticket")) {
      navigate("/user/raise-ticket");
    } else if (t.includes("reward") || title.includes("reward") || title.includes("voucher")) {
      navigate("/user/rewards");
    } else if (t.includes("points") || title.includes("point")) {
      navigate("/user/transaction");
    } else if (t.includes("account") || title.includes("account")) {
      navigate("/user/dashboard");
    }
  };

  // Icon renderer for notification types
  const renderNotificationIcon = (type: string, title: string) => {
    const t = type.toLowerCase();
    const tit = title.toLowerCase();

    if (t === "account" || tit.includes("account")) {
      if (tit.includes("reject")) {
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
            <UserX size={17} />
          </div>
        );
      }
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
          <ShieldCheck size={17} />
        </div>
      );
    }

    if (t === "ticket" || tit.includes("ticket")) {
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#8B5CF6] border border-purple-200">
          <Ticket size={17} />
        </div>
      );
    }

    if (t === "points" || tit.includes("point") || tit.includes("credited")) {
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
          <TrendingUp size={17} />
        </div>
      );
    }

    // Default reward / announcement
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[#6366F1] border border-indigo-200">
        <Gift size={17} />
      </div>
    );
  };

  // Filtered list for dropdown
  const filteredNotifications = notifications.filter((n) => {
    const t = (n.type || "").toLowerCase();
    if (activeFilter === "unread") return !n.isRead;
    if (activeFilter === "ticket") return t.includes("ticket");
    if (activeFilter === "reward") return t.includes("reward") || t.includes("point");
    if (activeFilter === "account") return t.includes("account");
    return true;
  });

  // Filtered list for full history modal
  const historyFiltered = notifications.filter((n) => {
    const query = historySearch.toLowerCase();
    const matchesSearch =
      n.title.toLowerCase().includes(query) ||
      n.message.toLowerCase().includes(query) ||
      n.type.toLowerCase().includes(query);

    const t = (n.type || "").toLowerCase();
    if (activeFilter === "unread") return matchesSearch && !n.isRead;
    if (activeFilter === "ticket") return matchesSearch && t.includes("ticket");
    if (activeFilter === "reward") return matchesSearch && (t.includes("reward") || t.includes("point"));
    if (activeFilter === "account") return matchesSearch && t.includes("account");
    return matchesSearch;
  });

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Notification Bell Trigger Button */}
        <button
          onClick={() => {
            if (!isOpen) fetchNotifications(true);
            setIsOpen(!isOpen);
          }}
          className={`relative rounded-xl border p-2.5 transition-all duration-200 active:scale-95 ${
            isOpen
              ? "border-[#6366F1] bg-indigo-50/50 text-[#6366F1]"
              : "border-slate-200/80 bg-white text-slate-500 hover:border-indigo-200 hover:bg-slate-50 hover:text-[#1E293B]"
          }`}
          aria-label="View notifications"
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-1 text-[9px] font-black text-white shadow-md ring-2 ring-white animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-slate-200/90 bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1E293B]">Notifications</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-bold text-[#6366F1]">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#6366F1] hover:text-[#4F46E5] transition"
                    title="Mark all notifications as read"
                  >
                    <CheckCheck size={13} />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100 overflow-x-auto no-scrollbar bg-white">
              {(
                [
                  { key: "all", label: "All" },
                  { key: "unread", label: "Unread" },
                  { key: "ticket", label: "Tickets" },
                  { key: "reward", label: "Rewards" },
                  { key: "account", label: "Account" },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition whitespace-nowrap ${
                    activeFilter === f.key
                      ? "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Notification Items List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {loading ? (
                /* Skeleton Loader */
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="h-9 w-9 rounded-xl bg-slate-200 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-slate-200 rounded-md w-3/4" />
                        <div className="h-2.5 bg-slate-100 rounded-md w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-[#6366F1] mb-2">
                    <Inbox size={22} />
                  </div>
                  <p className="text-xs font-bold text-[#1E293B]">No notifications</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5 max-w-[200px]">
                    {activeFilter === "unread"
                      ? "You are all caught up! No unread notifications."
                      : "Important updates on your account, tickets, and rewards will appear here."}
                  </p>
                </div>
              ) : (
                filteredNotifications.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`group relative flex items-start gap-3 p-3.5 transition cursor-pointer hover:bg-slate-50/90 ${
                      !item.isRead ? "bg-indigo-50/40" : ""
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!item.isRead && (
                      <span className="absolute left-1.5 top-5 h-2 w-2 rounded-full bg-[#6366F1] shadow-xs" />
                    )}

                    {renderNotificationIcon(item.type, item.title)}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs truncate ${
                            !item.isRead
                              ? "font-extrabold text-[#1E293B]"
                              : "font-semibold text-slate-700"
                          }`}
                        >
                          {item.title}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-0.5">
                          <Clock size={10} />
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      <p className="mt-0.5 text-[11px] text-[#64748B] line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className="capitalize font-semibold text-slate-400 text-[10px]">
                          {item.type}
                        </span>
                        <span className="font-bold text-[#6366F1] opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
                          View Details <ChevronRight size={11} />
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Dropdown Footer */}
            <div className="border-t border-slate-100 bg-[#F8FAFC] px-4 py-2.5 flex items-center justify-between">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setHistoryModalOpen(true);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-[#6366F1] hover:text-[#4F46E5] transition"
              >
                <span>View Full Notification History</span>
                <ExternalLink size={12} />
              </button>

              <button
                onClick={() => fetchNotifications(true)}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Full Notification History Modal */}
      {historyModalOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setHistoryModalOpen(false)}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-white shadow-md shadow-indigo-500/20">
                  <Bell size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1E293B]">Notification History</h2>
                  <p className="text-xs text-[#64748B]">
                    Complete archive of your account events, rewards, and support tickets
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1 text-xs font-bold text-[#6366F1] hover:underline"
                  >
                    <CheckCheck size={14} />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  onClick={() => setHistoryModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2">
                <Search size={15} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search notifications by title or message..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-[#1E293B] outline-none placeholder:text-slate-400"
                />
                {historySearch && (
                  <button
                    onClick={() => setHistorySearch("")}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {(
                  [
                    { key: "all", label: "All Notifications" },
                    { key: "unread", label: "Unread Only" },
                    { key: "ticket", label: "Support Tickets" },
                    { key: "reward", label: "Rewards & Points" },
                    { key: "account", label: "Account Status" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                      activeFilter === f.key
                        ? "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 max-h-[50vh]">
              {historyFiltered.length === 0 ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
                  <Inbox size={32} className="text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-[#1E293B]">No matching notifications</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Try adjusting your search terms or category filters.
                  </p>
                </div>
              ) : (
                historyFiltered.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`flex items-start gap-3.5 p-3.5 rounded-xl cursor-pointer transition hover:bg-slate-50 ${
                      !item.isRead ? "bg-indigo-50/40" : ""
                    }`}
                  >
                    {renderNotificationIcon(item.type, item.title)}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-xs ${
                              !item.isRead
                                ? "font-extrabold text-[#1E293B]"
                                : "font-semibold text-slate-700"
                            }`}
                          >
                            {item.title}
                          </p>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 uppercase">
                            {item.type}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(item.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
                        {item.message}
                      </p>
                    </div>

                    {!item.isRead && (
                      <span className="h-2 w-2 rounded-full bg-[#6366F1] shrink-0 mt-2" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 bg-[#F8FAFC] px-6 py-3.5 flex items-center justify-between">
              <span className="text-xs text-[#64748B]">
                Total: {historyFiltered.length} notification(s)
              </span>

              <button
                onClick={() => setHistoryModalOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#1E293B] shadow-xs hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
