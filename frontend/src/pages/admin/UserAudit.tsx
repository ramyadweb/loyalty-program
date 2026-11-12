import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  LogIn,
  LogOut,
  Activity,
  Download,
  Menu,
  Shield,
  Loader2,
  UserCheck,
  UserX,
  KeyRound,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/AdminSidebar";
import AdminNotificationDropdown from "../../components/AdminNotificationDropdown";
import { auditService, type AuditLogItem } from "../../services/api";

function UserAudit() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await auditService.getAllAuditLogs({ limit: 100 });
      if (res.data?.data?.logs) {
        setLogs(res.data.data.logs);
      } else if (Array.isArray(res.data?.data)) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const formattedLogs = useMemo(() => {
    return logs.map((log) => {
      const createdDate = new Date(log.createdAt);
      const dateStr = !isNaN(createdDate.getTime())
        ? createdDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "N/A";

      const timeStr = !isNaN(createdDate.getTime())
        ? createdDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "N/A";

      const email = log.actorEmail || log.targetUserEmail || "system@loyalty.local";
      const name = email.split("@")[0].replace(/[._]/g, " ");
      const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

      let action = log.activityType;
      let displayAction = log.activityType;
      if (log.activityType === "LOGIN") displayAction = "Login";
      else if (log.activityType === "LOGOUT") displayAction = "Logout";
      else if (log.activityType === "USER_APPROVED") displayAction = "Approved User";
      else if (log.activityType === "USER_REJECTED") displayAction = "Rejected User";
      else if (log.activityType === "PASSWORD_RESET") displayAction = "Password Reset";

      const role =
        log.activityType.includes("USER_") || email.includes("admin")
          ? "Admin"
          : "User";

      return {
        id: log.id,
        name: capitalizedName,
        email: email,
        role: role as "Admin" | "User",
        action: displayAction,
        rawAction: action,
        status: "Success" as "Success" | "Failed",
        date: dateStr,
        time: timeStr,
        ipAddress: log.ipAddress || "127.0.0.1",
      };
    });
  }, [logs]);

  const filteredRecords = useMemo(() => {
    return formattedLogs.filter((record) => {
      const q = search.toLowerCase();
      const matchesSearch =
        record.name.toLowerCase().includes(q) ||
        record.email.toLowerCase().includes(q) ||
        record.action.toLowerCase().includes(q);

      const matchesAction =
        actionFilter === "All" ||
        record.action.toLowerCase() === actionFilter.toLowerCase() ||
        record.rawAction.toLowerCase() === actionFilter.toLowerCase();

      return matchesSearch && matchesAction;
    });
  }, [formattedLogs, search, actionFilter]);

  const loginCount = formattedLogs.filter((r) => r.action === "Login").length;
  const logoutCount = formattedLogs.filter((r) => r.action === "Logout").length;
  const adminActionsCount = formattedLogs.filter(
    (r) => r.action === "Approved User" || r.action === "Rejected User"
  ).length;

  const exportCSV = () => {
    const headers = ["ID", "User", "Email", "Role", "Action", "Result", "Date", "Time", "IP Address"];
    const rows = filteredRecords.map((r) => [
      r.id,
      r.name,
      r.email,
      r.role,
      r.action,
      r.status,
      r.date,
      r.time,
      r.ipAddress,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `user-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case "login":
        return <LogIn size={13} className="text-emerald-600" />;
      case "logout":
        return <LogOut size={13} className="text-slate-600" />;
      case "approved user":
        return <UserCheck size={13} className="text-indigo-600" />;
      case "rejected user":
        return <UserX size={13} className="text-rose-600" />;
      case "password reset":
        return <KeyRound size={13} className="text-amber-600" />;
      default:
        return <Activity size={13} className="text-[#6366F1]" />;
    }
  };

  const adminName = user?.name ?? "Admin";
  const initials = adminName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="min-h-screen lg:ml-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>
            <div>
              <h2 className="text-lg font-bold sm:text-xl text-[#1E293B]">Security & Audit</h2>
              <p className="hidden text-xs text-[#64748B] sm:block">
                Session logs, authentication events, and device provenance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={exportCSV}
              className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-600 hover:to-purple-600 sm:flex"
            >
              <Download size={14} />
              Export CSV
            </button>
            <AdminNotificationDropdown onRefreshStats={fetchAuditLogs} />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-xs font-bold text-white shadow-md shadow-indigo-500/20">
              {initials}
            </div>
          </div>
        </header>

        <div className="space-y-6 p-5 sm:p-8 lg:p-10">
          {/* Page heading */}
          <section>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#6366F1]">
                  Compliance Records
                </p>
                <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl text-[#1E293B]">User Audit Trail</h1>
                <p className="mt-1 text-xs text-[#64748B]">
                  Cryptographically track all user authentication and privilege requests across sessions.
                </p>
              </div>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 py-2.5 text-xs font-bold text-white shadow-sm sm:hidden"
              >
                <Download size={15} /> Export
              </button>
            </div>
          </section>

          {/* Statistics */}
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Logged Activities",
                value: formattedLogs.length,
                icon: Activity,
                color: "bg-indigo-50 text-indigo-600 border border-indigo-100",
              },
              {
                title: "Successful Logins",
                value: loginCount,
                icon: LogIn,
                color: "bg-emerald-50 text-emerald-600 border border-emerald-100",
              },
              {
                title: "Normal Logouts",
                value: logoutCount,
                icon: LogOut,
                color: "bg-purple-50 text-purple-600 border border-purple-100",
              },
              {
                title: "Admin Approvals / Actions",
                value: adminActionsCount,
                icon: UserCheck,
                color: "bg-amber-50 text-amber-600 border border-amber-100",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#64748B]">{item.title}</p>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.color}`}>
                      <Icon size={16} />
                    </div>
                  </div>
                  <h3 className="mt-3 text-2xl font-black text-[#1E293B]">{item.value}</h3>
                </div>
              );
            })}
          </section>

          {/* Audit table */}
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1E293B]">Session History</h3>
                <p className="mt-0.5 text-xs text-[#64748B]">Real-time sign-in and sign-out timestamps</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search user or email..."
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2 pl-9 pr-3 text-xs text-[#1E293B] outline-none focus:border-[#6366F1] focus:bg-white sm:w-56"
                  />
                </div>

                <div className="relative">
                  <Filter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs font-semibold text-[#1E293B] outline-none focus:border-[#6366F1] sm:w-44"
                  >
                    <option value="All">All Actions</option>
                    <option value="Login">Login</option>
                    <option value="Logout">Logout</option>
                    <option value="Approved User">User Approval</option>
                    <option value="Rejected User">User Rejection</option>
                    <option value="Password Reset">Password Reset</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-[#6366F1]" />
                  <p className="text-xs font-semibold text-slate-500">Loading audit trail...</p>
                </div>
              ) : (
                <table className="w-full min-w-[800px] text-left">
                  <thead className="bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    <tr>
                      <th className="px-5 py-3.5">User</th>
                      <th className="px-5 py-3.5">Role</th>
                      <th className="px-5 py-3.5">Action</th>
                      <th className="px-5 py-3.5">Result</th>
                      <th className="px-5 py-3.5">Date & Time</th>
                      <th className="px-5 py-3.5">Origin IP</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="transition hover:bg-slate-50/80">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-[#6366F1] border border-indigo-100">
                              {record.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-bold text-[#1E293B]">{record.name}</p>
                              <p className="text-[11px] text-[#64748B]">{record.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              record.role === "Admin"
                                ? "bg-purple-50 text-purple-600 border border-purple-200"
                                : "bg-indigo-50 text-indigo-600 border border-indigo-200"
                            }`}
                          >
                            {record.role}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 font-bold text-slate-700">
                            {getActionIcon(record.action)}
                            {record.action}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            {record.status}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <p className="font-medium text-[#1E293B]">{record.date}</p>
                          <p className="text-[11px] text-[#64748B]">{record.time}</p>
                        </td>

                        <td className="px-5 py-3.5 font-mono text-[11px] text-[#64748B]">
                          {record.ipAddress}
                        </td>
                      </tr>
                    ))}

                    {filteredRecords.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center">
                          <Shield size={32} className="mx-auto mb-2 text-slate-300" />
                          <p className="text-xs font-bold text-[#1E293B]">No activity events found</p>
                          <p className="mt-0.5 text-[11px] text-[#64748B]">
                            Try adjusting your search query or filters.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="border-t border-slate-100 px-5 py-3 text-xs text-[#64748B]">
              Showing {filteredRecords.length} of {formattedLogs.length} activities
            </div>
          </section>

          <footer className="pb-2 text-center text-xs text-[#64748B]">
            © 2026 Loyalty+ SaaS Platform. All rights reserved.
          </footer>
        </div>
      </main>
    </div>
  );
}

export default UserAudit;
