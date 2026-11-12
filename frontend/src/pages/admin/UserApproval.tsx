import { useState, useEffect } from "react";
import {
  Search,
  Check,
  X,
  Clock,
  Menu,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/AdminSidebar";
import ConfirmDialog from "../../components/ConfirmDialog";
import AdminNotificationDropdown from "../../components/AdminNotificationDropdown";
import { adminService, type AdminUserItem } from "../../services/api";

function UserApproval() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    userId: number;
    action: "Approved" | "Rejected";
  }>({ isOpen: false, userId: 0, action: "Approved" });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllUsers();
      if (res.data?.data) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
      showToast("Failed to load user accounts from database.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || u.status.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const pendingCount = users.filter((u) => u.status === "pending").length;
  const approvedCount = users.filter((u) => u.status === "approved").length;
  const rejectedCount = users.filter((u) => u.status === "rejected").length;

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const requestAction = (userId: number, action: "Approved" | "Rejected") => {
    setConfirmDialog({ isOpen: true, userId, action });
  };

  const handleConfirmAction = async () => {
    setActionLoading(true);
    const { userId, action } = confirmDialog;

    try {
      if (action === "Approved") {
        await adminService.approveUser(userId);
        showToast("User approved successfully.", "success");
      } else {
        await adminService.rejectUser(userId);
        showToast("User rejected successfully.", "success");
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, status: action.toLowerCase() as "approved" | "rejected" }
            : u
        )
      );
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) =>
          prev
            ? { ...prev, status: action.toLowerCase() as "approved" | "rejected" }
            : null
        );
      }
      setSelectedUser(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      showToast(
        errorObj.response?.data?.message || "Action failed. Please try again.",
        "error"
      );
    } finally {
      setActionLoading(false);
      setConfirmDialog({ isOpen: false, userId: 0, action: "Approved" });
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
        pendingCount={pendingCount}
      />

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed right-5 top-5 z-[200] flex items-center gap-2.5 rounded-2xl px-5 py-3.5 text-xs font-semibold text-white shadow-xl transition-all ${
            toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
          {toast.message}
        </div>
      )}

      {/* Main */}
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
              <h2 className="text-lg font-bold sm:text-xl text-[#1E293B]">Member Approvals</h2>
              <p className="hidden text-xs text-[#64748B] sm:block">
                Review and approve member registrations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <AdminNotificationDropdown onRefreshStats={fetchUsers} />
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
                  Access Control
                </p>
                <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl text-[#1E293B]">
                  User Registrations
                </h1>
                <p className="mt-1 text-xs text-[#64748B]">
                  Verify identity information and grant loyalty program access.
                </p>
              </div>

              <button
                onClick={() => {
                  const csv = [
                    ["ID", "Name", "Email", "Status", "Registered At", "Points Balance"],
                    ...users.map((u) => [
                      u.id,
                      u.name,
                      u.email,
                      u.status,
                      new Date(u.createdAt).toLocaleString(),
                      u.role === "admin" ? "--" : (u.availablePoints ?? u.pointsBalance ?? 0),
                    ]),
                  ]
                    .map((r) => r.join(","))
                    .join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "users-approval.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex w-fit items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-xs font-semibold text-[#1E293B] shadow-sm transition hover:bg-slate-50"
              >
                <Download size={15} className="text-[#6366F1]" /> Export CSV
              </button>
            </div>
          </section>

          {/* Statistics Cards */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                title: "Pending Requests",
                value: pendingCount,
                icon: Clock,
                color: "bg-amber-50 text-amber-600 border border-amber-100",
              },
              {
                title: "Approved Members",
                value: approvedCount,
                icon: Check,
                color: "bg-emerald-50 text-emerald-600 border border-emerald-100",
              },
              {
                title: "Rejected Submissions",
                value: rejectedCount,
                icon: X,
                color: "bg-rose-50 text-rose-600 border border-rose-100",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}>
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                      Live
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-semibold text-[#64748B]">{item.title}</p>
                  <h3 className="mt-1 text-2xl font-black text-[#1E293B]">
                    {loading ? "..." : item.value}
                  </h3>
                </div>
              );
            })}
          </section>

          {/* User list */}
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1E293B]">Registration Queue</h3>
                <p className="mt-0.5 text-xs text-[#64748B]">
                  Approve or reject member access requests
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-[#F8FAFC] px-3.5 py-2">
                  <Search size={16} className="text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, email..."
                    className="w-40 bg-transparent text-xs outline-none placeholder:text-slate-400 sm:w-52"
                  />
                </div>

                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                  {["All", "Pending", "Approved", "Rejected"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilter(s)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        filter === s ? "bg-white text-[#6366F1] shadow-xs" : "text-[#64748B] hover:text-[#1E293B]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  <tr>
                    <th className="px-6 py-3.5">User</th>
                    <th className="px-6 py-3.5">Points Balance</th>
                    <th className="px-6 py-3.5">Registered</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-xs text-slate-400">
                        {loading ? "Loading users from database..." : "No users found matching your criteria."}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const userInitials = u.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();
                      return (
                        <tr key={u.id} className="transition hover:bg-slate-50/80">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-[#6366F1] border border-indigo-100">
                                {userInitials}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-[#1E293B]">{u.name}</p>
                                <p className="text-[11px] text-[#64748B]">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-[#1E293B]">
                            {u.role === "admin"
                              ? "--"
                              : `${(u.availablePoints ?? u.pointsBalance ?? 0).toLocaleString()} pts`}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-xs text-[#64748B]">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                                u.status === "approved"
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                  : u.status === "rejected"
                                  ? "bg-rose-50 text-rose-600 border border-rose-200"
                                  : "bg-amber-50 text-amber-600 border border-amber-200"
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedUser(u)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                title="View details"
                              >
                                <Eye size={16} />
                              </button>

                              {u.status === "pending" && (
                                <>
                                  <button
                                    onClick={() => requestAction(u.id, "Approved")}
                                    className="flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 border border-emerald-200 transition hover:bg-emerald-100"
                                  >
                                    <Check size={14} /> Approve
                                  </button>
                                  <button
                                    onClick={() => requestAction(u.id, "Rejected")}
                                    className="flex items-center gap-1 rounded-xl bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 border border-rose-200 transition hover:bg-rose-100"
                                  >
                                    <X size={14} /> Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 px-6 py-4 text-xs text-[#64748B]">
              Showing {filteredUsers.length} of {users.length} members
            </div>
          </section>
        </div>
      </main>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-[#1E293B]">Member Profile Details</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Full Name</p>
                <p className="text-sm font-bold text-slate-800">{selectedUser.name}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Email Address</p>
                <p className="text-sm font-semibold text-slate-800">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Account Status</p>
                <span className="inline-block mt-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize bg-slate-100 text-slate-700">
                  {selectedUser.status}
                </span>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Points Balance</p>
                <p className="text-sm font-bold text-indigo-600">
                  {selectedUser.role === "admin"
                    ? "--"
                    : `${(selectedUser.availablePoints ?? selectedUser.pointsBalance ?? 0).toLocaleString()} pts`}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Registered Date</p>
                <p className="text-slate-700">
                  {new Date(selectedUser.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
              {selectedUser.status === "pending" && (
                <>
                  <button
                    onClick={() => {
                      requestAction(selectedUser.id, "Approved");
                    }}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Approve Member
                  </button>
                  <button
                    onClick={() => {
                      requestAction(selectedUser.id, "Rejected");
                    }}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
                  >
                    Reject Member
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedUser(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.action === "Approved" ? "Approve Member" : "Reject Member"}
        message={`Are you sure you want to mark this member as ${confirmDialog.action}?`}
        confirmLabel={confirmDialog.action === "Approved" ? "Confirm Approval" : "Confirm Rejection"}
        variant={confirmDialog.action === "Rejected" ? "danger" : "info"}
        loading={actionLoading}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog({ isOpen: false, userId: 0, action: "Approved" })}
      />
    </div>
  );
}

export default UserApproval;
