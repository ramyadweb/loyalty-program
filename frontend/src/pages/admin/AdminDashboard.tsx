import {
  Users,
  UserCheck,
  Ticket,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Gift,
  ArrowUpRight,
  CalendarDays,
  Search,
  Menu,
  Sparkles,
  PlusCircle,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/AdminSidebar";
import CreateNotificationModal from "../../components/CreateNotificationModal";
import AdminNotificationDropdown from "../../components/AdminNotificationDropdown";
import {
  dashboardService,
  adminService,
  type AdminDashboardStats,
  type RecentActivityItem,
  type AdminUserItem,
} from "../../services/api";

function AdminDashboard() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [statsData, setStatsData] = useState<AdminDashboardStats | null>(null);
  const [pendingUsers, setPendingUsers] = useState<AdminUserItem[]>([]);
  const [activities, setActivities] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const adminName = user?.name ?? "Admin";
  const initials = adminName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, pendingRes, activitiesRes] = await Promise.allSettled([
        dashboardService.getAdminStats(),
        adminService.getPendingUsers(),
        dashboardService.getRecentActivities(),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value.data?.data) {
        setStatsData(statsRes.value.data.data);
      }
      if (pendingRes.status === "fulfilled" && pendingRes.value.data?.data) {
        setPendingUsers(pendingRes.value.data.data.slice(0, 5));
      }
      if (activitiesRes.status === "fulfilled" && activitiesRes.value.data?.data) {
        setActivities(activitiesRes.value.data.data.slice(0, 5));
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const stats = [
    {
      title: "Total Users",
      value: (statsData?.totalUsers ?? 0).toLocaleString(),
      change: "+12.5%",
      positive: true,
      icon: Users,
      color: "bg-indigo-50 text-indigo-600 border border-indigo-100",
    },
    {
      title: "Pending Approvals",
      value: (statsData?.pendingUsers ?? 0).toLocaleString(),
      change: statsData?.pendingUsers ? `${statsData.pendingUsers} awaiting` : "All clear",
      positive: !statsData?.pendingUsers,
      icon: Clock,
      color: "bg-amber-50 text-amber-600 border border-amber-100",
    },
    {
      title: "Active Users",
      value: (statsData?.activeUsers ?? 0).toLocaleString(),
      change: "+18.4%",
      positive: true,
      icon: UserCheck,
      color: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    },
    {
      title: "Open Tickets",
      value: (statsData?.openTickets ?? 0).toLocaleString(),
      change: statsData?.openTickets ? `${statsData.openTickets} open` : "0 open",
      positive: (statsData?.openTickets ?? 0) === 0,
      icon: Ticket,
      color: "bg-purple-50 text-purple-600 border border-purple-100",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingCount={statsData?.pendingUsers ?? pendingUsers.length}
      />

      {/* Main content */}
      <main className="min-h-screen lg:ml-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>
            <div>
              <h2 className="text-lg font-bold sm:text-xl text-[#1E293B]">Admin Overview</h2>
              <p className="hidden text-xs text-[#64748B] sm:block">
                Welcome back, {adminName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200/80 bg-[#F8FAFC] px-3.5 py-2 md:flex">
              <Search size={16} className="text-slate-400" />
              <input
                placeholder="Search metrics, users..."
                className="w-48 bg-transparent text-xs outline-none placeholder:text-slate-400 text-[#1E293B]"
              />
            </div>

            {/* Admin Notifications Activity Bell */}
            <AdminNotificationDropdown onRefreshStats={fetchDashboardData} />

            <div className="flex items-center gap-3 border-l border-slate-200 pl-3 sm:pl-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-xs font-bold text-white shadow-md shadow-indigo-500/20">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-[#1E293B]">{adminName}</p>
                <p className="text-[10px] font-semibold text-[#6366F1]">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard body */}
        <div className="space-y-7 p-5 sm:p-8 lg:p-10">
          {/* Welcome section */}
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#6366F1]">
                <Sparkles size={14} />
                <span>{today}</span>
              </div>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl text-[#1E293B]">
                Dashboard Overview
              </h1>
              <p className="mt-1 text-xs text-[#64748B]">
                Real-time insights across member activities, points redemptions, and approvals.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition hover:from-indigo-600 hover:to-purple-600"
              >
                <PlusCircle size={15} />
                Create Notification
              </button>

              <button className="flex w-fit items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-xs font-semibold text-[#1E293B] shadow-sm transition hover:bg-slate-50">
                <CalendarDays size={15} className="text-[#6366F1]" />
                Live DB Synced
              </button>
            </div>
          </section>

          {/* Statistics Cards */}
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.title}
                  className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                      {stat.title}
                    </p>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                      <Icon size={20} />
                    </div>
                  </div>

                  <div className="mt-4 flex items-baseline gap-3">
                    <h3 className="text-3xl font-extrabold tracking-tight text-[#1E293B]">
                      {loading ? "..." : stat.value}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
                      {stat.positive ? (
                        <TrendingUp size={14} className="text-emerald-500" />
                      ) : (
                        <TrendingDown size={14} className="text-amber-500" />
                      )}
                      <span>{stat.change}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Two-Column Grid: Registrations & Audit */}
          <section className="grid grid-cols-1 gap-7 lg:grid-cols-3">
            {/* Registrations Review */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <h3 className="text-sm font-bold text-[#1E293B]">Pending Registrations</h3>
                  <p className="mt-0.5 text-xs text-[#64748B]">
                    New users awaiting administrator approval
                  </p>
                </div>
                <Link
                  to="/admin/user-approval"
                  className="flex items-center gap-1 text-xs font-bold text-[#6366F1] transition hover:text-[#4F46E5]"
                >
                  View All <ArrowUpRight size={14} />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px] text-left">
                  <thead className="bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    <tr>
                      <th className="px-6 py-3.5">User</th>
                      <th className="px-6 py-3.5">Registered</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-xs text-slate-400">
                          {loading ? "Loading registrations..." : "No pending registrations awaiting approval."}
                        </td>
                      </tr>
                    ) : (
                      pendingUsers.map((u) => {
                        const userInitials = u.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase();
                        return (
                          <tr key={u.id} className="transition hover:bg-slate-50/80">
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-[#6366F1] border border-indigo-100">
                                  {userInitials}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-[#1E293B]">{u.name}</p>
                                  <p className="text-[11px] text-[#64748B]">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-3.5 text-xs text-[#64748B]">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-3.5">
                              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 capitalize">
                                {u.status}
                              </span>
                            </td>
                            <td className="px-6 py-3.5">
                              <Link
                                to="/admin/user-approval"
                                className="text-xs font-bold text-[#6366F1] hover:underline"
                              >
                                Review →
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-100 px-6 py-3 text-xs text-[#64748B]">
                Showing {pendingUsers.length} pending registration records
              </div>
            </div>

            {/* Recent activity */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm flex flex-col justify-between">
              <div>
                <div className="border-b border-slate-100 px-6 py-5">
                  <h3 className="text-sm font-bold text-[#1E293B]">Live Audit Stream</h3>
                  <p className="mt-0.5 text-xs text-[#64748B]">
                    Latest platform security & operations log
                  </p>
                </div>

                <div className="space-y-4 p-6">
                  {activities.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">
                      {loading ? "Loading audit stream..." : "No recent activity logged."}
                    </p>
                  ) : (
                    activities.map((act) => (
                      <div key={act.id} className="flex gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                          <CheckCircle2 size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1E293B]">
                            {act.activityType}
                          </p>
                          <p className="text-xs text-[#64748B] truncate">
                            {act.userName} ({act.userEmail})
                          </p>
                          <p className="mt-1 text-[10px] font-medium text-slate-400">
                            {new Date(act.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 px-6 py-3.5">
                <Link
                  to="/admin/user-audit"
                  className="text-xs font-bold text-[#6366F1] transition hover:text-[#4F46E5]"
                >
                  View All Activity →
                </Link>
              </div>
            </div>
          </section>

          {/* Bottom Fintech Banner */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#111827] via-[#1E1B4B] to-[#312E81] p-6 text-white sm:p-8 shadow-xl shadow-indigo-950/20">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,#8B5CF6_0%,transparent_70%)] opacity-30 blur-[60px]" />

            <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2 text-indigo-300">
                  <Gift size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-[2px]">
                    Loyalty Insights
                  </span>
                </div>
                <h3 className="mt-2 text-xl font-bold">
                  Keep your member rewards engagement high!
                </h3>
                <p className="mt-1 max-w-lg text-xs leading-5 text-slate-300">
                  You have {statsData?.pendingUsers || 0} pending member approvals and {statsData?.openTickets || 0} support tickets requiring attention.
                </p>
              </div>

              <Link
                to="/admin/user-approval"
                className="flex w-fit shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-600 hover:to-purple-600"
              >
                Review Approvals <ArrowUpRight size={15} />
              </Link>
            </div>
          </section>

          <footer className="pb-2 text-center text-xs text-[#64748B]">
            © 2026 Loyalty+ SaaS Platform. All rights reserved.
          </footer>
        </div>
      </main>

      {/* Create Notification Modal */}
      <CreateNotificationModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}

export default AdminDashboard;
