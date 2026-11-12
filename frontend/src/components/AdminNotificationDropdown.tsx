import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  UserCheck,
  Ticket,
  CheckCheck,
  ChevronRight,
  ExternalLink,
  Clock,
  Loader2,
} from "lucide-react";
import {
  adminService,
  ticketsService,
  notificationsService,
  type AdminUserItem,
  type TicketItem,
} from "../services/api";

interface AdminNotificationDropdownProps {
  onRefreshStats?: () => void;
}

export default function AdminNotificationDropdown({
  onRefreshStats,
}: AdminNotificationDropdownProps) {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "tickets">("users");

  // Data states
  const [recentUsers, setRecentUsers] = useState<AdminUserItem[]>([]);
  const [recentTickets, setRecentTickets] = useState<TicketItem[]>([]);
  const [unreadTotal, setUnreadTotal] = useState<number>(0);
  const [pendingUsersCount, setPendingUsersCount] = useState<number>(0);
  const [openTicketsCount, setOpenTicketsCount] = useState<number>(0);
  const [readUserIds, setReadUserIds] = useState<number[]>([]);
  const [readTicketIds, setReadTicketIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch admin unread counts & recent activities
  const loadNotificationData = async () => {
    try {
      setLoading(true);
      const [countRes, usersRes, ticketsRes] = await Promise.allSettled([
        notificationsService.getAdminUnreadCount(),
        adminService.getRecentUsers(8),
        ticketsService.getRecentTickets(8),
      ]);

      if (countRes.status === "fulfilled" && countRes.value.data?.data) {
        const counts = countRes.value.data.data;
        setUnreadTotal(counts.total ?? counts.totalUnread ?? 0);
        setPendingUsersCount(counts.pendingUsers);
        setOpenTicketsCount(counts.openTickets);
      }

      if (usersRes.status === "fulfilled" && usersRes.value.data?.data) {
        setRecentUsers(usersRes.value.data.data);
      }

      if (ticketsRes.status === "fulfilled" && ticketsRes.value.data?.data) {
        setRecentTickets(ticketsRes.value.data.data);
      }
    } catch (err) {
      console.error("Failed to load admin notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotificationData();
  }, []);

  // Close dropdown on outside click
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

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
    } catch {
      // Backend mark-all-read
    }
    // Locally mark all loaded users and tickets as viewed
    setReadUserIds(recentUsers.map((u) => u.id));
    setReadTicketIds(recentTickets.map((t) => t.id));
    setUnreadTotal(0);
    setPendingUsersCount(0);
    setOpenTicketsCount(0);
    if (onRefreshStats) onRefreshStats();
  };

  const handleUserClick = (userId: number) => {
    setReadUserIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    setIsOpen(false);
    navigate("/admin/user-approval");
  };

  const handleTicketClick = (ticketId: number) => {
    setReadTicketIds((prev) => (prev.includes(ticketId) ? prev : [...prev, ticketId]));
    setIsOpen(false);
    navigate("/admin/manage-tickets");
  };

  const getPriorityBadge = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === "high") {
      return "bg-rose-50 text-rose-600 border border-rose-200";
    }
    if (p === "medium") {
      return "bg-amber-50 text-amber-600 border border-amber-200";
    }
    return "bg-emerald-50 text-emerald-600 border border-emerald-200";
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "open") {
      return "bg-indigo-50 text-[#6366F1] border border-indigo-200";
    }
    if (s === "in_progress") {
      return "bg-amber-50 text-amber-600 border border-amber-200";
    }
    if (s === "resolved") {
      return "bg-emerald-50 text-emerald-600 border border-emerald-200";
    }
    return "bg-slate-100 text-slate-600 border border-slate-200";
  };

  const getUserStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "approved" || s === "active") {
      return "bg-emerald-50 text-emerald-600 border border-emerald-200";
    }
    if (s === "pending") {
      return "bg-amber-50 text-amber-600 border border-amber-200";
    }
    if (s === "rejected") {
      return "bg-rose-50 text-rose-600 border border-rose-200";
    }
    return "bg-slate-100 text-slate-600 border border-slate-200";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => {
          if (!isOpen) loadNotificationData();
          setIsOpen(!isOpen);
        }}
        className={`relative rounded-xl border p-2.5 transition ${
          isOpen
            ? "border-[#6366F1] bg-indigo-50/50 text-[#6366F1]"
            : "border-slate-200/80 bg-white text-slate-500 hover:bg-slate-50 hover:text-[#1E293B]"
        }`}
        aria-label="Admin Notifications"
        title="Admin Notifications"
      >
        <Bell size={18} />
        {unreadTotal > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-md ring-2 ring-white">
            {unreadTotal > 99 ? "99+" : unreadTotal}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-slate-200/90 bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Top Panel Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 bg-[#F8FAFC]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1E293B]">Activities & Alerts</span>
              {unreadTotal > 0 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                  {unreadTotal} unread
                </span>
              )}
            </div>

            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1 text-[11px] font-bold text-[#6366F1] hover:text-[#4F46E5] transition"
              title="Mark all as read"
            >
              <CheckCheck size={14} />
              <span>Mark all read</span>
            </button>
          </div>

          {/* Segmented Category Tabs */}
          <div className="flex border-b border-slate-100 bg-white p-1.5 gap-1.5">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition ${
                activeTab === "users"
                  ? "bg-indigo-50 text-[#6366F1]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <UserCheck size={14} />
              <span>Registered Users</span>
              {pendingUsersCount > 0 && (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-700">
                  {pendingUsersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("tickets")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition ${
                activeTab === "tickets"
                  ? "bg-indigo-50 text-[#6366F1]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Ticket size={14} />
              <span>Support Tickets</span>
              {openTicketsCount > 0 && (
                <span className="rounded-full bg-purple-100 px-1.5 py-0.2 text-[10px] font-bold text-[#6366F1]">
                  {openTicketsCount}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                <Loader2 size={20} className="animate-spin text-[#6366F1]" />
                <span className="text-xs">Fetching latest activities...</span>
              </div>
            ) : activeTab === "users" ? (
              /* CATEGORY A: New Registered Users */
              recentUsers.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  No registered users found.
                </div>
              ) : (
                recentUsers.map((u) => {
                  const isUnread =
                    u.status === "pending" && !readUserIds.includes(u.id);
                  const regDate = new Date(u.createdAt).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleUserClick(u.id)}
                      className={`group relative flex items-start gap-3 p-3.5 transition cursor-pointer hover:bg-slate-50 ${
                        isUnread ? "bg-amber-50/40" : ""
                      }`}
                    >
                      {/* Unread indicator */}
                      {isUnread && (
                        <span className="absolute left-1.5 top-5 h-2 w-2 rounded-full bg-amber-500" />
                      )}

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-[#6366F1] border border-indigo-100 group-hover:bg-[#6366F1] group-hover:text-white transition">
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-[#1E293B] truncate">
                            {u.name}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${getUserStatusBadge(
                              u.status
                            )}`}
                          >
                            {u.status}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#64748B] truncate">{u.email}</p>

                        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> Registered: {regDate}
                          </span>
                          <span className="font-semibold text-[#6366F1] opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
                            Review <ChevronRight size={12} />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              /* CATEGORY B: Newly Raised Support Tickets */
              recentTickets.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  No support tickets found.
                </div>
              ) : (
                recentTickets.map((t) => {
                  const isUnread =
                    t.status === "open" && !readTicketIds.includes(t.id);
                  const ticketDate = new Date(t.createdAt).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleTicketClick(t.id)}
                      className={`group relative flex items-start gap-3 p-3.5 transition cursor-pointer hover:bg-slate-50 ${
                        isUnread ? "bg-purple-50/40" : ""
                      }`}
                    >
                      {/* Unread indicator */}
                      {isUnread && (
                        <span className="absolute left-1.5 top-5 h-2 w-2 rounded-full bg-[#6366F1]" />
                      )}

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-xs font-bold text-[#6366F1] border border-purple-100 group-hover:bg-[#6366F1] group-hover:text-white transition">
                        <Ticket size={16} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-mono font-bold text-[#6366F1]">
                            #TK-{1000 + t.id}
                          </span>
                          <div className="flex items-center gap-1">
                            <span
                              className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold capitalize ${getPriorityBadge(
                                t.priority
                              )}`}
                            >
                              {t.priority}
                            </span>
                            <span
                              className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold capitalize ${getStatusBadge(
                                t.status
                              )}`}
                            >
                              {t.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>

                        <p className="mt-0.5 text-xs font-bold text-[#1E293B] truncate">
                          {t.subject}
                        </p>

                        <p className="text-[11px] text-[#64748B] line-clamp-1 mt-0.5">
                          {t.description}
                        </p>

                        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                          <span>By: {t.user?.name || "User #" + t.userId}</span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {ticketDate}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>

          {/* Footer Navigation */}
          <div className="border-t border-slate-100 bg-[#F8FAFC] px-4 py-2.5 flex items-center justify-between text-xs font-bold text-[#6366F1]">
            {activeTab === "users" ? (
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/admin/user-approval");
                }}
                className="flex items-center gap-1 hover:underline"
              >
                <span>View All User Approvals</span>
                <ExternalLink size={12} />
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/admin/manage-tickets");
                }}
                className="flex items-center gap-1 hover:underline"
              >
                <span>View All Support Tickets</span>
                <ExternalLink size={12} />
              </button>
            )}

            <button
              onClick={() => {
                loadNotificationData();
              }}
              className="text-[11px] text-slate-500 hover:text-slate-800"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
