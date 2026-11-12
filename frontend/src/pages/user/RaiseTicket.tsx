import { useState, useMemo, useEffect } from "react";
import {
  Ticket,
  Send,
  CheckCircle,
  AlertCircle,
  Menu,
  Loader2,
  Search,
  Eye,
  X,
  PlusCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import UserSidebar from "../../components/UserSidebar";
import UserNotificationDropdown from "../../components/UserNotificationDropdown";
import { ticketsService, type TicketItem } from "../../services/api";

type DisplayTicket = {
  id: number;
  subject: string;
  category: string;
  priority: "Low" | "Medium" | "High";
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  createdAt: string;
  description: string;
  adminResponse?: string | null;
};

function RaiseTicket() {
  const { user, refreshProfile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"raise" | "list">("raise");

  // Form states
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Tickets list states
  const [tickets, setTickets] = useState<DisplayTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedTicket, setSelectedTicket] = useState<DisplayTicket | null>(null);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const mapBackendTicket = (t: TicketItem): DisplayTicket => {
    let mappedStatus: "Open" | "In Progress" | "Resolved" | "Closed" = "Open";
    if (t.status === "in_progress") mappedStatus = "In Progress";
    else if (t.status === "resolved") mappedStatus = "Resolved";
    else if (t.status === "closed") mappedStatus = "Closed";

    let mappedPriority: "Low" | "Medium" | "High" = "Medium";
    if (t.priority === "high") mappedPriority = "High";
    else if (t.priority === "low") mappedPriority = "Low";

    return {
      id: t.id,
      subject: t.subject,
      category: t.category,
      priority: mappedPriority,
      status: mappedStatus,
      createdAt: t.createdAt
        ? new Date(t.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })
        : "Recent",
      description: t.description,
      adminResponse: t.adminResponse,
    };
  };

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await ticketsService.getTickets();
      if (res.data?.data) {
        setTickets(res.data.data.map(mapBackendTicket));
      }
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!subject.trim()) errors.subject = "Subject is required.";
    if (!category) errors.category = "Please select a category.";
    if (!description.trim() || description.trim().length < 5)
      errors.description = "Description must be at least 5 characters.";
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await ticketsService.createTicket({
        subject: subject.trim(),
        category,
        priority: priority.toLowerCase() as any,
        description: description.trim(),
      });

      if (res.data?.data) {
        const newTicket = mapBackendTicket(res.data.data);
        setTickets((prev) => [newTicket, ...prev]);
      } else {
        await fetchTickets();
      }

      refreshProfile().catch(() => {});

      setSubmitted(true);
      setSubject("");
      setCategory("");
      setPriority("Medium");
      setDescription("");
      setFieldErrors({});
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to create support ticket.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        String(t.id).includes(search) ||
        t.category.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, search, statusFilter]);

  const inputClass = (field: string) =>
    `w-full rounded-xl border px-3.5 py-2.5 text-xs text-[#1E293B] outline-none transition ${
      fieldErrors[field]
        ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
        : "border-slate-200 bg-[#F8FAFC] focus:border-[#6366F1] focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
    }`;

  const priorityColor = (p: string) => {
    switch (p) {
      case "High":
        return "bg-rose-50 text-rose-600 border border-rose-200";
      case "Medium":
        return "bg-amber-50 text-amber-600 border border-amber-200";
      default:
        return "bg-indigo-50 text-indigo-600 border border-indigo-200";
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "Resolved":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200";
      case "In Progress":
        return "bg-indigo-50 text-indigo-600 border border-indigo-200";
      case "Closed":
        return "bg-slate-100 text-slate-600 border border-slate-300";
      default:
        return "bg-amber-50 text-amber-600 border border-amber-200";
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      <UserSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
              <h2 className="text-lg font-bold sm:text-xl text-[#1E293B]">Customer Support</h2>
              <p className="hidden text-xs text-[#64748B] sm:block">
                Submit queries or track your existing support tickets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <UserNotificationDropdown onRefreshStats={fetchTickets} />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-xs font-bold text-white shadow-md shadow-indigo-500/20">
              {initials}
            </div>
          </div>
        </header>

        <div className="space-y-6 p-5 sm:p-8">
          {/* Header section with tabs */}
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#6366F1]">
                Helpdesk Desk
              </p>
              <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl text-[#1E293B]">Support Inquiries</h1>
              <p className="mt-1 text-xs text-[#64748B]">
                Fast responses for points reconciliation, voucher verification, or account issues.
              </p>
            </div>

            {/* Tab switch buttons */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("raise");
                  setSubmitted(false);
                }}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === "raise"
                    ? "bg-white text-[#6366F1] shadow-sm"
                    : "text-slate-600 hover:text-[#1E293B]"
                }`}
              >
                <PlusCircle size={14} />
                <span>New Ticket</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("list")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === "list"
                    ? "bg-white text-[#6366F1] shadow-sm"
                    : "text-slate-600 hover:text-[#1E293B]"
                }`}
              >
                <Clock size={14} />
                <span>My Inquiries ({tickets.length})</span>
              </button>
            </div>
          </section>

          {activeTab === "raise" ? (
            /* Raise New Ticket Form */
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
                  {submitted ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-md shadow-emerald-500/10">
                        <CheckCircle size={32} />
                      </div>
                      <h3 className="mt-4 text-lg font-extrabold text-[#1E293B]">
                        Support Ticket Submitted
                      </h3>
                      <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                        <Sparkles size={14} className="text-emerald-500" />
                        +50 Loyalty Points Earned!
                      </div>
                      <p className="mt-2 text-xs text-[#64748B] max-w-sm">
                        Congratulations! You earned 50 loyalty points for creating your ticket. Our member support desk will review it shortly.
                      </p>
                      <div className="mt-6 flex gap-3">
                        <button
                          onClick={() => setSubmitted(false)}
                          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Submit Another Query
                        </button>
                        <button
                          onClick={() => setActiveTab("list")}
                          className="rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-600 hover:to-purple-600"
                        >
                          View My Inquiries
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <h3 className="text-base font-bold text-[#1E293B]">Ticket Details</h3>

                      {error && (
                        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
                          <AlertCircle size={15} />
                          <span>{error}</span>
                        </div>
                      )}

                      {/* Subject */}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-[#1E293B]">
                          Subject <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => {
                            setSubject(e.target.value);
                            setFieldErrors((prev) => ({ ...prev, subject: "" }));
                          }}
                          placeholder="e.g. Points not credited after shopping checkout"
                          className={inputClass("subject")}
                        />
                        {fieldErrors.subject && (
                          <p className="mt-1 text-[11px] font-semibold text-rose-500">
                            {fieldErrors.subject}
                          </p>
                        )}
                      </div>

                      {/* Category & Priority */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-xs font-bold text-[#1E293B]">
                            Category <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={category}
                            onChange={(e) => {
                              setCategory(e.target.value);
                              setFieldErrors((prev) => ({ ...prev, category: "" }));
                            }}
                            className={inputClass("category")}
                          >
                            <option value="">Select Category</option>
                            <option value="Reward Points">Reward Points</option>
                            <option value="Redemption">Voucher Redemption</option>
                            <option value="Account">Account & Profile</option>
                            <option value="Technical">Technical Issue</option>
                            <option value="Other">Other</option>
                          </select>
                          {fieldErrors.category && (
                            <p className="mt-1 text-[11px] font-semibold text-rose-500">
                              {fieldErrors.category}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-bold text-[#1E293B]">
                            Priority Level
                          </label>
                          <select
                            value={priority}
                            onChange={(e) =>
                              setPriority(e.target.value as "Low" | "Medium" | "High")
                            }
                            className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2.5 text-xs text-[#1E293B] outline-none transition focus:border-[#6366F1] focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                          >
                            <option value="Low">Low (Informational)</option>
                            <option value="Medium">Medium (Standard)</option>
                            <option value="High">High (Urgent)</option>
                          </select>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-[#1E293B]">
                          Description <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={5}
                          value={description}
                          onChange={(e) => {
                            setDescription(e.target.value);
                            setFieldErrors((prev) => ({ ...prev, description: "" }));
                          }}
                          placeholder="Describe the issue with relevant order IDs, dates, or partner merchant names..."
                          className={inputClass("description")}
                        />
                        {fieldErrors.description && (
                          <p className="mt-1 text-[11px] font-semibold text-rose-500">
                            {fieldErrors.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-6 py-3 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-600 hover:to-purple-600 disabled:opacity-60"
                        >
                          {submitting ? (
                            <>
                              <Loader2 size={15} className="animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send size={15} />
                              Submit Support Ticket
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Sidebar Info Card */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <h4 className="text-sm font-bold text-[#1E293B]">Support Guidelines</h4>
                  <ul className="mt-4 space-y-3 text-xs text-[#64748B]">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-[#6366F1]">•</span>
                      <span>Include transaction IDs for points reconciliation requests.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-[#6366F1]">•</span>
                      <span>Voucher codes typically process within 2 hours of merchant validation.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-[#6366F1]">•</span>
                      <span>High priority tickets receive expedited agent review.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            /* My Tickets List */
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#1E293B]">My Submitted Inquiries</h3>
                    <p className="mt-0.5 text-xs text-[#64748B]">
                      Review responses from our support specialists
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

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#1E293B] outline-none focus:border-[#6366F1] sm:w-36"
                    >
                      <option value="All">All Status</option>
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {loadingTickets ? (
                    <div className="flex h-48 flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-[#6366F1]" />
                      <p className="text-xs font-semibold text-slate-500">Loading your tickets...</p>
                    </div>
                  ) : (
                    <table className="w-full min-w-[700px] text-left">
                      <thead className="bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                        <tr>
                          <th className="px-5 py-3.5">Ticket ID</th>
                          <th className="px-5 py-3.5">Subject</th>
                          <th className="px-5 py-3.5">Category</th>
                          <th className="px-5 py-3.5">Priority</th>
                          <th className="px-5 py-3.5">Status</th>
                          <th className="px-5 py-3.5">Created</th>
                          <th className="px-5 py-3.5 text-right">Details</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredTickets.map((ticket) => (
                          <tr key={ticket.id} className="transition hover:bg-slate-50/80">
                            <td className="px-5 py-3.5 font-bold text-[#6366F1]">
                              #TK-{ticket.id}
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-[#1E293B] max-w-xs truncate">
                              {ticket.subject}
                            </td>
                            <td className="px-5 py-3.5 text-[#64748B]">
                              {ticket.category}
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${priorityColor(
                                  ticket.priority
                                )}`}
                              >
                                {ticket.priority}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusColor(
                                  ticket.status
                                )}`}
                              >
                                {ticket.status}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-[#64748B]">
                              {ticket.createdAt}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={() => setSelectedTicket(ticket)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#1E293B] transition hover:border-[#6366F1] hover:text-[#6366F1]"
                              >
                                <Eye size={14} />
                                View
                              </button>
                            </td>
                          </tr>
                        ))}

                        {filteredTickets.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-5 py-12 text-center">
                              <Ticket size={32} className="mx-auto mb-2 text-slate-300" />
                              <p className="text-xs font-bold text-[#1E293B]">No support tickets found</p>
                              <p className="mt-0.5 text-[11px] text-[#64748B]">
                                Click "New Ticket" to raise your first inquiry.
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          <footer className="pb-2 text-center text-xs text-[#64748B]">
            © 2026 Loyalty+ SaaS Platform. All rights reserved.
          </footer>
        </div>
      </main>

      {/* Ticket Details Modal */}
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
                <h3 className="mt-0.5 text-base font-bold text-[#1E293B]">Ticket Details</h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5 text-xs">
              <div>
                <p className="text-[11px] font-semibold text-[#64748B]">Subject</p>
                <p className="mt-0.5 text-sm font-bold text-[#1E293B]">{selectedTicket.subject}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 rounded-xl bg-[#F8FAFC] border border-slate-200/80 p-3">
                <div>
                  <p className="text-[10px] font-semibold text-[#64748B] uppercase">Category</p>
                  <p className="mt-0.5 font-bold text-[#1E293B]">{selectedTicket.category}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#64748B] uppercase">Priority</p>
                  <p className="mt-0.5 font-bold text-[#1E293B]">{selectedTicket.priority}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#64748B] uppercase">Status</p>
                  <p className="mt-0.5 font-bold text-[#1E293B]">{selectedTicket.status}</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-[#64748B]">Your Message</p>
                <p className="mt-1 rounded-xl bg-slate-50 p-3 leading-5 text-slate-700 border border-slate-200/80">
                  {selectedTicket.description}
                </p>
              </div>

              {selectedTicket.adminResponse && (
                <div>
                  <p className="text-[11px] font-semibold text-emerald-700">Support Agent Response</p>
                  <p className="mt-1 rounded-xl bg-emerald-50/60 p-3 leading-5 text-emerald-900 border border-emerald-200/80">
                    {selectedTicket.adminResponse}
                  </p>
                </div>
              )}

              <button
                onClick={() => setSelectedTicket(null)}
                className="w-full rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/25"
              >
                Close Ticket View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RaiseTicket;
