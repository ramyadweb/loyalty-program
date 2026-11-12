import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  X,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Menu,
  CheckCircle2,
  Loader2,
  Send,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/AdminSidebar";
import AdminNotificationDropdown from "../../components/AdminNotificationDropdown";
import { ticketsService, type TicketItem, type TicketStatus } from "../../services/api";

type Priority = "low" | "medium" | "high";

function ManageTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [adminResponseText, setAdminResponseText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>("open");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await ticketsService.getTickets();
      if (res.data?.data) {
        setTickets(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
      showToast("Failed to fetch tickets from server.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const openTicketModal = async (ticket: TicketItem) => {
    setSelectedTicket(ticket);
    setSelectedStatus(ticket.status);
    setAdminResponseText(ticket.adminResponse || "");

    // Track explicit first-open action on the backend to award 20 points
    try {
      const res = await ticketsService.openTicket(ticket.id);
      if (res.data?.data?.pointsAwarded && res.data.data.pointsAwarded > 0) {
        showToast(
          `Ticket #TK-${ticket.id} first-open: 20 points awarded to ${ticket.user?.name || "customer"}!`,
          "success"
        );
      }
      if (res.data?.data?.ticket) {
        const updatedTicket = { ...ticket, ...res.data.data.ticket };
        setSelectedTicket(updatedTicket);
        setTickets((prev) =>
          prev.map((t) => (t.id === ticket.id ? updatedTicket : t))
        );
      }
    } catch (err) {
      console.error("Failed to register ticket open action:", err);
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const subject = ticket.subject?.toLowerCase() || "";
      const userName = ticket.user?.name?.toLowerCase() || "";
      const userEmail = ticket.user?.email?.toLowerCase() || "";
      const ticketId = String(ticket.id);
      const query = search.toLowerCase();

      const matchesSearch =
        subject.includes(query) ||
        userName.includes(query) ||
        userEmail.includes(query) ||
        ticketId.includes(query);

      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, search, statusFilter]);

  const handleUpdateStatus = async () => {
    if (!selectedTicket) return;
    setSaving(true);
    try {
      const res = await ticketsService.updateTicketStatus(selectedTicket.id, {
        status: selectedStatus,
        adminResponse: adminResponseText.trim() || undefined,
      });

      const updated = res.data?.data;
      setTickets((current) =>
        current.map((t) => (t.id === selectedTicket.id ? { ...t, ...updated, status: selectedStatus, adminResponse: adminResponseText } : t))
      );
      if (selectedTicket) {
        setSelectedTicket((prev) => prev ? { ...prev, ...updated, status: selectedStatus, adminResponse: adminResponseText } : null);
      }

      if (updated?.pointsAwarded && updated.pointsAwarded > 0) {
        showToast(
          `Ticket #TK-${selectedTicket.id} marked as resolved! ${updated.pointsAwarded} loyalty points awarded to customer.`,
          "success"
        );
      } else {
        showToast("Ticket status updated successfully.", "success");
      }
      setSelectedTicket(null);
    } catch (err) {
      console.error("Failed to update status:", err);
      showToast("Failed to update ticket status.", "error");
    } finally {
      setSaving(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-rose-50 text-rose-600 border border-rose-200";
      case "in_progress":
        return "bg-indigo-50 text-indigo-600 border border-indigo-200";
      case "resolved":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200";
      case "closed":
        return "bg-slate-100 text-slate-600 border border-slate-300";
      default:
        return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

  const getPriorityStyle = (priority: Priority | string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-rose-50 text-rose-600 border border-rose-200";
      case "medium":
        return "bg-amber-50 text-amber-600 border border-amber-200";
      case "low":
        return "bg-indigo-50 text-indigo-600 border border-indigo-200";
      default:
        return "bg-slate-50 text-slate-600 border border-slate-200";
    }
  };

  const formatStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "Open";
      case "in_progress":
        return "In Progress";
      case "resolved":
        return "Resolved";
      case "closed":
        return "Closed";
      default:
        return status;
    }
  };

  const openCount = tickets.filter((t) => t.status === "open").length;
  const progressCount = tickets.filter((t) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;

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

      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-5 top-5 z-[200] flex items-center gap-2.5 rounded-2xl px-5 py-3 text-xs font-semibold text-white shadow-xl ${
            toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

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
              <h2 className="text-lg font-bold sm:text-xl text-[#1E293B]">Ticket Operations</h2>
              <p className="hidden text-xs text-[#64748B] sm:block">
                Triage, assign, and resolve member queries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <AdminNotificationDropdown onRefreshStats={fetchTickets} />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-xs font-bold text-white shadow-md shadow-indigo-500/20">
              {initials}
            </div>
          </div>
        </header>

        <div className="space-y-6 p-5 sm:p-8 lg:p-10">
          {/* Heading */}
          <section>
            <p className="text-xs font-bold uppercase tracking-wider text-[#6366F1]">
              Helpdesk Desk
            </p>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl text-[#1E293B]">Support Tickets</h1>
            <p className="mt-1 text-xs text-[#64748B]">
              Track and resolve point balance claims, voucher queries, and technical inquiries.
            </p>
          </section>

          {/* Statistics */}
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                title: "Total Inquiries",
                value: tickets.length,
                icon: MessageSquare,
                color: "bg-indigo-50 text-indigo-600 border border-indigo-100",
              },
              {
                title: "Open / Unassigned",
                value: openCount,
                icon: AlertCircle,
                color: "bg-rose-50 text-rose-600 border border-rose-100",
              },
              {
                title: "In Investigation",
                value: progressCount,
                icon: Clock,
                color: "bg-amber-50 text-amber-600 border border-amber-100",
              },
              {
                title: "Resolved Issues",
                value: resolvedCount,
                icon: CheckCircle,
                color: "bg-emerald-50 text-emerald-600 border border-emerald-100",
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

          {/* Tickets table */}
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1E293B]">All Support Tickets</h3>
                <p className="mt-0.5 text-xs text-[#64748B]">
                  Update ticket status and inspect member descriptions
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tickets..."
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2 pl-9 pr-3 text-xs text-[#1E293B] outline-none focus:border-[#6366F1] focus:bg-white sm:w-56"
                  />
                </div>

                <div className="relative">
                  <Filter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs font-semibold text-[#1E293B] outline-none focus:border-[#6366F1] sm:w-40"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-[#6366F1]" />
                  <p className="text-xs font-semibold text-slate-500">Loading tickets...</p>
                </div>
              ) : (
                <table className="w-full min-w-[800px] text-left">
                  <thead className="bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    <tr>
                      <th className="px-5 py-3.5">Ticket ID</th>
                      <th className="px-5 py-3.5">Subject & User</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Priority</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Created</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredTickets.map((ticket) => {
                      const displayUser = ticket.user?.name || "Member";
                      const displayEmail = ticket.user?.email || "";
                      const displayDate = ticket.createdAt
                        ? new Date(ticket.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Recent";

                      return (
                        <tr key={ticket.id} className="transition hover:bg-slate-50/80">
                          <td className="px-5 py-3.5 font-bold text-[#6366F1]">
                            #TK-{ticket.id}
                          </td>

                          <td className="px-5 py-3.5">
                            <p className="font-bold text-[#1E293B]">{ticket.subject}</p>
                            <p className="text-[11px] text-[#64748B]">
                              {displayUser} {displayEmail && `• ${displayEmail}`}
                            </p>
                          </td>

                          <td className="px-5 py-3.5 text-[#64748B]">
                            {ticket.category}
                          </td>

                          <td className="px-5 py-3.5">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${getPriorityStyle(
                                ticket.priority
                              )}`}
                            >
                              {ticket.priority}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getStatusStyle(
                                ticket.status
                              )}`}
                            >
                              {formatStatusLabel(ticket.status)}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-3.5 text-[#64748B]">
                            {displayDate}
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => openTicketModal(ticket)}
                              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                                !ticket.openedAt
                                  ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  : "border-slate-200 text-[#1E293B] hover:border-[#6366F1] hover:text-[#6366F1]"
                              }`}
                              title={!ticket.openedAt ? "First open awards 20 loyalty points to customer" : "Review ticket"}
                            >
                              <Eye size={14} />
                              {!ticket.openedAt ? "Open Ticket (+20 pts)" : "Review"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredTickets.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center">
                          <MessageSquare size={32} className="mx-auto mb-2 text-slate-300" />
                          <p className="text-xs font-bold text-[#1E293B]">No tickets found</p>
                          <p className="mt-0.5 text-[11px] text-[#64748B]">
                            Try adjusting your search query or filter.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="border-t border-slate-100 px-5 py-3 text-xs text-[#64748B]">
              Showing {filteredTickets.length} of {tickets.length} tickets
            </div>
          </section>

          <footer className="pb-2 text-center text-xs text-[#64748B]">
            © 2026 Loyalty+ SaaS Platform. All rights reserved.
          </footer>
        </div>
      </main>

      {/* Ticket details modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white border border-slate-200/80 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#6366F1]">
                  Ticket #TK-{selectedTicket.id}
                </p>
                <h3 className="mt-0.5 text-base font-bold text-[#1E293B]">
                  Ticket Inspection & Response
                </h3>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                aria-label="Close ticket details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5 text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <p className="text-[11px] font-semibold text-[#64748B]">Subject</p>
                <p className="mt-0.5 text-sm font-bold text-[#1E293B]">
                  {selectedTicket.subject}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#F8FAFC] border border-slate-200/80 p-3.5">
                {[
                  { label: "Customer", value: selectedTicket.user?.name || "Customer" },
                  { label: "Email", value: selectedTicket.user?.email || "N/A" },
                  { label: "Category", value: selectedTicket.category },
                  {
                    label: "Created",
                    value: selectedTicket.createdAt
                      ? new Date(selectedTicket.createdAt).toLocaleString("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "N/A",
                  },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                      {label}
                    </p>
                    <p className="mt-0.5 font-bold text-[#1E293B] truncate">{value}</p>
                  </div>
                ))}
              </div>

              {/* Ticket Loyalty Points Award Tracking */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-indigo-100/60">
                  <span className="text-[11px] font-bold text-indigo-900">
                    Customer Ticket Loyalty Points
                  </span>
                  <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-black text-white">
                    {(50 + (selectedTicket.openedAt ? 20 : 0) + (selectedTicket.status === "resolved" ? 50 : 0))} / 120 pts
                  </span>
                </div>
                <div className="mt-2.5 grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="rounded-lg bg-white p-2 border border-slate-100">
                    <p className="font-semibold text-slate-500">Raised</p>
                    <p className="mt-0.5 font-black text-emerald-600">+50 pts</p>
                    <span className="text-[9px] text-slate-400">Awarded</span>
                  </div>
                  <div className={`rounded-lg p-2 border ${selectedTicket.openedAt ? "bg-white border-slate-100" : "bg-amber-50/60 border-amber-200"}`}>
                    <p className="font-semibold text-slate-500">Admin Open</p>
                    <p className={`mt-0.5 font-black ${selectedTicket.openedAt ? "text-emerald-600" : "text-amber-600"}`}>
                      +20 pts
                    </p>
                    <span className="text-[9px] text-slate-400">
                      {selectedTicket.openedAt ? "Awarded" : "Pending"}
                    </span>
                  </div>
                  <div className={`rounded-lg p-2 border ${selectedTicket.status === "resolved" ? "bg-white border-slate-100" : "bg-slate-50 border-slate-200/60"}`}>
                    <p className="font-semibold text-slate-500">Resolved</p>
                    <p className={`mt-0.5 font-black ${selectedTicket.status === "resolved" ? "text-emerald-600" : "text-slate-400"}`}>
                      +50 pts
                    </p>
                    <span className="text-[9px] text-slate-400">
                      {selectedTicket.status === "resolved" ? "Awarded" : "On Resolve"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-[#64748B]">Description</p>
                <p className="mt-1 rounded-xl bg-slate-50 p-3.5 leading-5 text-slate-700 border border-slate-200/80">
                  {selectedTicket.description}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#1E293B]">
                  Update Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as TicketStatus)}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-[#1E293B] outline-none focus:border-[#6366F1] disabled:opacity-70"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#1E293B]">
                  Admin Response / Resolution Note
                </label>
                <textarea
                  value={adminResponseText}
                  onChange={(e) => setAdminResponseText(e.target.value)}
                  placeholder="Provide resolution details or message for the user..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-[#1E293B] outline-none focus:border-[#6366F1]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateStatus}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageTickets;
