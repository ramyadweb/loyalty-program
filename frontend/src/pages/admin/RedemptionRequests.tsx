import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Gift,
  Search,
  Check,
  X,
  Clock,
  ShieldCheck,
  CheckCheck,
  Copy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Sparkles,
  Menu,
  Coins,
  Calendar,
  Ticket,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/AdminSidebar";
import ConfirmDialog from "../../components/ConfirmDialog";
import AdminNotificationDropdown from "../../components/AdminNotificationDropdown";
import {
  userRewardsService,
  redemptionService,
  type UserRewardItem,
} from "../../services/api";

type FilterTab = "All" | "Pending" | "Approved" | "Completed" | "Rejected";

export default function RedemptionRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<UserRewardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UserRewardItem | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [validatedIds, setValidatedIds] = useState<Set<number>>(new Set());

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    variant: "info" | "warning" | "danger";
    actionType: "approve" | "reject" | "complete";
    request: UserRewardItem | null;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    variant: "info",
    actionType: "approve",
    request: null,
  });
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchRequests = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await userRewardsService.getAllUserRewards();
      if (res.data?.data) {
        setRequests(res.data.data);
      }
    } catch (err: any) {
      console.error("Failed to load redemption requests:", err);
      showToast(
        err.response?.data?.message || "Failed to load redemption requests from server.",
        "error"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Voucher code ${code} copied to clipboard!`, "info");
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Determine effective status of a request
  const getEffectiveStatus = (
    req: UserRewardItem
  ): "pending" | "approved" | "completed" | "rejected" | "expired" => {
    if (req.status === "pending") return "pending";
    if (req.status === "rejected") return "rejected";
    if (req.status === "approved") {
      if (req.redemptionStatus === "completed") return "completed";
      if (req.redemptionStatus === "expired") return "expired";
      return "approved";
    }
    return "pending";
  };

  // Metrics
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const approved = requests.filter(
      (r) => r.status === "approved" && r.redemptionStatus !== "completed"
    ).length;
    const completed = requests.filter(
      (r) => r.status === "approved" && r.redemptionStatus === "completed"
    ).length;
    const rejected = requests.filter((r) => r.status === "rejected").length;
    const totalPoints = requests.reduce((acc, r) => acc + (r.pointsSpent || 0), 0);

    return { total, pending, approved, completed, rejected, totalPoints };
  }, [requests]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const effStatus = getEffectiveStatus(item);

      // Tab filter
      let matchesTab = true;
      if (activeTab === "Pending") matchesTab = effStatus === "pending";
      else if (activeTab === "Approved") matchesTab = effStatus === "approved";
      else if (activeTab === "Completed") matchesTab = effStatus === "completed";
      else if (activeTab === "Rejected") matchesTab = effStatus === "rejected";

      // Search filter
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (item.userName && item.userName.toLowerCase().includes(q)) ||
        (item.userEmail && item.userEmail.toLowerCase().includes(q)) ||
        (item.rewardName && item.rewardName.toLowerCase().includes(q)) ||
        (item.redemptionCode && item.redemptionCode.toLowerCase().includes(q)) ||
        item.id.toString().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [requests, activeTab, search]);

  // --- Actions ---

  // 1. Prompt Approve
  const handlePromptApprove = (req: UserRewardItem) => {
    setConfirmDialog({
      isOpen: true,
      title: "Approve Redemption Request",
      message: `Are you sure you want to approve request #${req.id} for ${req.userName || "User"} (${req.rewardName})? A unique 30-day voucher code will be automatically generated and sent to the user.`,
      confirmLabel: "Approve Request",
      variant: "info",
      actionType: "approve",
      request: req,
    });
  };

  // 2. Prompt Reject
  const handlePromptReject = (req: UserRewardItem) => {
    setConfirmDialog({
      isOpen: true,
      title: "Reject Redemption Request",
      message: `Are you sure you want to reject request #${req.id}? ${req.pointsSpent} loyalty points will be automatically refunded to ${req.userName || "the user"}'s balance and the reward stock will be restored.`,
      confirmLabel: "Reject & Refund Points",
      variant: "danger",
      actionType: "reject",
      request: req,
    });
  };

  // 3. Prompt Complete
  const handlePromptComplete = (req: UserRewardItem) => {
    setConfirmDialog({
      isOpen: true,
      title: "Complete Redemption Voucher",
      message: `Are you sure you want to mark voucher ${req.redemptionCode || `#${req.id}`} as COMPLETED? This marks the reward as delivered/fulfilled and updates the user's notification records.`,
      confirmLabel: "Complete Voucher",
      variant: "info",
      actionType: "complete",
      request: req,
    });
  };

  // Execute Dialog Action
  const handleExecuteDialogAction = async () => {
    const { actionType, request } = confirmDialog;
    if (!request) return;

    try {
      setActionLoading(true);

      if (actionType === "approve") {
        const res = await userRewardsService.updateUserRewardStatus(request.id, "approved");
        showToast(
          res.data?.message || `Redemption request #${request.id} approved successfully! Voucher code generated.`,
          "success"
        );
      } else if (actionType === "reject") {
        const res = await userRewardsService.updateUserRewardStatus(request.id, "rejected");
        showToast(
          res.data?.message || `Redemption request #${request.id} rejected. ${request.pointsSpent} points refunded to user.`,
          "success"
        );
      } else if (actionType === "complete") {
        if (!request.redemptionId) {
          throw new Error("Missing redemption voucher ID.");
        }
        const res = await redemptionService.completeRedemption(request.redemptionId);
        showToast(
          res.data?.message || `Redemption voucher ${request.redemptionCode} successfully completed!`,
          "success"
        );
      }

      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      if (detailsModalOpen && selectedRequest?.id === request.id) {
        setDetailsModalOpen(false);
      }
      await fetchRequests();
    } catch (err: any) {
      console.error("Action execution error:", err);
      showToast(
        err.response?.data?.message || err.message || "Failed to perform administrative action.",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Validate Voucher Code
  const handleValidateVoucher = async (req: UserRewardItem) => {
    if (!req.redemptionId) {
      showToast("No active voucher record found to validate.", "error");
      return;
    }

    try {
      setActionLoading(true);
      const res = await redemptionService.validateRedemption(req.redemptionId);
      const data = res.data;

      setValidatedIds((prev) => new Set(prev).add(req.redemptionId!));
      showToast(
        data?.message || `Voucher ${req.redemptionCode} is VALID, active, and eligible for completion!`,
        "success"
      );
    } catch (err: any) {
      console.error("Validation error:", err);
      showToast(
        err.response?.data?.message || "Voucher validation failed or code has expired.",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "--";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
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
      {/* Toast Alert Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-[150] flex items-center gap-3 rounded-2xl bg-slate-900/95 px-5 py-3.5 text-white shadow-2xl backdrop-blur-md border border-slate-700/60 animate-in fade-in slide-in-from-top-4 duration-200">
          {toast.type === "success" && (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
          )}
          {toast.type === "error" && (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
              <AlertCircle size={18} />
            </div>
          )}
          {toast.type === "info" && (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
              <Sparkles size={18} />
            </div>
          )}
          <span className="text-xs font-medium sm:text-sm">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Admin Sidebar Navigation */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingCount={stats.pending}
      />

      {/* Main Content Area */}
      <main className="min-h-screen lg:ml-64">
        {/* Top Header Navbar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-md sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold sm:text-xl text-[#1E293B]">
                  Redemption Requests
                </h2>
                <span className="hidden sm:inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-[#6366F1]">
                  Management
                </span>
              </div>
              <p className="hidden text-xs text-[#64748B] sm:block">
                Review user claims, approve vouchers, validate codes, and complete fulfillment.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Quick Refresh Button */}
            <button
              onClick={() => fetchRequests(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-60"
              title="Refresh request list"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin text-indigo-600" : ""}
              />
              <span className="hidden md:inline">Refresh</span>
            </button>

            {/* Admin Notifications Bell */}
            <AdminNotificationDropdown onRefreshStats={() => fetchRequests(true)} />

            {/* Admin Profile */}
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

        {/* Page Body */}
        <div className="space-y-7 p-5 sm:p-8 lg:p-10">
          {/* Welcome Banner */}
          <section className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 p-6 shadow-sm md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6366F1]">
                <Gift size={16} />
                Reward Redemption Processing
              </div>
              <h1 className="mt-1 text-2xl font-black text-[#1E293B]">
                Loyalty Redemptions & Vouchers
              </h1>
              <p className="mt-1 max-w-2xl text-xs sm:text-sm text-[#64748B]">
                Manage pending reward claims, approve vouchers, validate security codes, and finalize completed user redemptions. Points are automatically refunded upon rejection.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 text-center shadow-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total Claimed Points
                </p>
                <p className="text-lg font-black text-[#6366F1]">
                  {stats.totalPoints.toLocaleString()} <span className="text-xs font-semibold">pts</span>
                </p>
              </div>
            </div>
          </section>

          {/* Metric Stats Cards */}
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">All Requests</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Ticket size={16} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900">{stats.total}</p>
              <p className="mt-1 text-[11px] font-medium text-slate-500">Lifetime user claims</p>
            </div>

            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5 shadow-xs transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-amber-800">Pending Review</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Clock size={16} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-amber-900">{stats.pending}</p>
              <p className="mt-1 text-[11px] font-medium text-amber-700">Needs admin decision</p>
            </div>

            <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-5 shadow-xs transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-indigo-800">Approved & Active</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <ShieldCheck size={16} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-indigo-900">{stats.approved}</p>
              <p className="mt-1 text-[11px] font-medium text-indigo-700">Voucher issued</p>
            </div>

            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5 shadow-xs transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-emerald-800">Completed</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCheck size={16} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-emerald-900">{stats.completed}</p>
              <p className="mt-1 text-[11px] font-medium text-emerald-700">Fulfilled & redeemed</p>
            </div>

            <div className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-5 shadow-xs transition hover:shadow-md col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-rose-800">Rejected</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                  <XCircle size={16} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-rose-900">{stats.rejected}</p>
              <p className="mt-1 text-[11px] font-medium text-rose-700">Points refunded</p>
            </div>
          </section>

          {/* Filters, Search, and Tabs */}
          <section className="space-y-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              {/* Tab Filters */}
              <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xs">
                {(
                  [
                    { key: "All", label: "All Requests", count: stats.total },
                    { key: "Pending", label: "Pending", count: stats.pending },
                    { key: "Approved", label: "Approved", count: stats.approved },
                    { key: "Completed", label: "Completed", count: stats.completed },
                    { key: "Rejected", label: "Rejected", count: stats.rejected },
                  ] as const
                ).map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search user, reward, voucher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200/80 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Redemptions Table Card */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-[#6366F1]">
                    <RefreshCw size={24} className="animate-spin" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900">
                    Loading Redemption Requests...
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Fetching claim data and voucher status from database.
                  </p>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                    <Gift size={28} />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-800">
                    No redemption requests found
                  </h3>
                  <p className="mt-1 max-w-sm text-xs text-slate-500">
                    {search
                      ? `No results matching "${search}" in ${activeTab} tab. Try clearing your search.`
                      : `There are currently no requests in the ${activeTab} category.`}
                  </p>
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="px-5 py-4">Request / User</th>
                        <th className="px-5 py-4">Reward Claimed</th>
                        <th className="px-5 py-4 text-right">Points Required</th>
                        <th className="px-5 py-4">Redemption Date</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Voucher Code</th>
                        <th className="px-5 py-4 text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredRequests.map((req) => {
                        const effStatus = getEffectiveStatus(req);
                        const isValidated = req.redemptionId
                          ? validatedIds.has(req.redemptionId)
                          : false;

                        return (
                          <tr
                            key={req.id}
                            className="transition hover:bg-slate-50/70"
                          >
                            {/* User Name and Email */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 text-xs font-bold text-indigo-700">
                                  {(req.userName || "U")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate font-bold text-slate-900">
                                      {req.userName || "Anonymous User"}
                                    </span>
                                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                                      #{req.id}
                                    </span>
                                  </div>
                                  <p className="truncate text-[11px] text-slate-500">
                                    {req.userEmail || "No email available"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Reward Name */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-[#6366F1]">
                                  <Gift size={14} />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">
                                    {req.rewardName}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    Reward ID: {req.rewardId}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Points Required */}
                            <td className="px-5 py-4 text-right">
                              <div className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200/60">
                                <Coins size={13} className="text-amber-500" />
                                {req.pointsSpent.toLocaleString()} pts
                              </div>
                            </td>

                            {/* Redemption Date */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <Calendar size={13} className="text-slate-400" />
                                <span className="text-[11px]">
                                  {formatDate(req.redeemedAt)}
                                </span>
                              </div>
                            </td>

                            {/* Status Badge */}
                            <td className="px-5 py-4">
                              {effStatus === "pending" && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200/60">
                                  <Clock size={12} className="animate-pulse" />
                                  Pending Approval
                                </span>
                              )}
                              {effStatus === "approved" && (
                                <div className="inline-flex flex-col gap-1">
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-[#6366F1] border border-indigo-200/60">
                                    <ShieldCheck size={12} />
                                    Approved
                                  </span>
                                  {isValidated && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                      <CheckCircle2 size={11} /> Validated Active
                                    </span>
                                  )}
                                </div>
                              )}
                              {effStatus === "completed" && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                                  <CheckCheck size={12} />
                                  Completed
                                </span>
                              )}
                              {effStatus === "rejected" && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200/60">
                                  <XCircle size={12} />
                                  Rejected
                                </span>
                              )}
                              {effStatus === "expired" && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200">
                                  <AlertCircle size={12} />
                                  Expired
                                </span>
                              )}
                            </td>

                            {/* Voucher Code */}
                            <td className="px-5 py-4">
                              {req.redemptionCode ? (
                                <div className="flex items-center gap-1.5">
                                  <code className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[11px] font-bold text-slate-800 border border-slate-200/60">
                                    {req.redemptionCode}
                                  </code>
                                  <button
                                    onClick={() => copyToClipboard(req.redemptionCode!)}
                                    className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                                    title="Copy voucher code"
                                  >
                                    {copiedCode === req.redemptionCode ? (
                                      <Check size={13} className="text-emerald-600" />
                                    ) : (
                                      <Copy size={13} />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-medium">
                                  {effStatus === "pending"
                                    ? "Upon Approval"
                                    : effStatus === "rejected"
                                    ? "None (Rejected)"
                                    : "--"}
                                </span>
                              )}
                            </td>

                            {/* Admin Actions */}
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Pending Actions: Approve & Reject */}
                                {effStatus === "pending" && (
                                  <>
                                    <button
                                      onClick={() => handlePromptApprove(req)}
                                      disabled={actionLoading}
                                      className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:opacity-95 hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                                      title="Approve and generate voucher"
                                    >
                                      <Check size={13} />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handlePromptReject(req)}
                                      disabled={actionLoading}
                                      className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 active:scale-95 disabled:opacity-50"
                                      title="Reject request and refund points"
                                    >
                                      <X size={13} />
                                      Reject
                                    </button>
                                  </>
                                )}

                                {/* Approved Actions: Validate & Complete */}
                                {effStatus === "approved" && (
                                  <>
                                    <button
                                      onClick={() => handleValidateVoucher(req)}
                                      disabled={actionLoading || !req.redemptionId}
                                      className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-[#6366F1] transition hover:bg-indigo-100 active:scale-95 disabled:opacity-50"
                                      title="Validate voucher validity"
                                    >
                                      <ShieldCheck size={13} />
                                      Validate
                                    </button>
                                    <button
                                      onClick={() => handlePromptComplete(req)}
                                      disabled={actionLoading || !req.redemptionId}
                                      className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:opacity-95 hover:shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                                      title="Mark voucher as completed/redeemed"
                                    >
                                      <CheckCheck size={13} />
                                      Complete
                                    </button>
                                  </>
                                )}

                                {/* View Details Modal Trigger */}
                                <button
                                  onClick={() => {
                                    setSelectedRequest(req);
                                    setDetailsModalOpen(true);
                                  }}
                                  className="rounded-xl border border-slate-200/80 p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                                  title="View full redemption details"
                                >
                                  <Eye size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Details Side Drawer / Modal */}
      {detailsModalOpen && selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setDetailsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-[#6366F1]">
                  <Gift size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1E293B]">
                    Redemption Request #{selectedRequest.id}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Full verification and voucher audit record
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-5 space-y-5">
              {/* Status Header Badge */}
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 border border-slate-200/60">
                <span className="text-xs font-semibold text-slate-500">
                  Current Processing State:
                </span>
                <span className="capitalize font-bold text-xs">
                  {getEffectiveStatus(selectedRequest) === "pending" && (
                    <span className="text-amber-700 bg-amber-100/60 px-3 py-1 rounded-full">
                      Pending Approval
                    </span>
                  )}
                  {getEffectiveStatus(selectedRequest) === "approved" && (
                    <span className="text-[#6366F1] bg-indigo-100/60 px-3 py-1 rounded-full">
                      Approved & Voucher Active
                    </span>
                  )}
                  {getEffectiveStatus(selectedRequest) === "completed" && (
                    <span className="text-emerald-700 bg-emerald-100/60 px-3 py-1 rounded-full">
                      Completed & Fulfilled
                    </span>
                  )}
                  {getEffectiveStatus(selectedRequest) === "rejected" && (
                    <span className="text-rose-700 bg-rose-100/60 px-3 py-1 rounded-full">
                      Rejected (Refunded)
                    </span>
                  )}
                </span>
              </div>

              {/* User Information */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  User Details
                </p>
                <div className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-3.5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Name:</span>
                    <span className="font-bold text-slate-900">
                      {selectedRequest.userName || "Anonymous"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedRequest.userEmail || "--"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">User ID:</span>
                    <span className="font-mono text-slate-600">
                      {selectedRequest.userId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reward Information */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Reward Details
                </p>
                <div className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-3.5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Reward Item:</span>
                    <span className="font-bold text-indigo-700">
                      {selectedRequest.rewardName}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Points Deducted:</span>
                    <span className="font-black text-amber-600">
                      {selectedRequest.pointsSpent.toLocaleString()} pts
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Redeemed At:</span>
                    <span className="text-slate-700 font-medium">
                      {formatDate(selectedRequest.redeemedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Voucher Code Details */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Voucher & Security Code
                </p>
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4">
                  {selectedRequest.redemptionCode ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-indigo-900 font-semibold">
                          Voucher Code:
                        </span>
                        <div className="flex items-center gap-2">
                          <code className="rounded-lg bg-white px-2.5 py-1 text-xs font-mono font-black text-indigo-700 border border-indigo-200">
                            {selectedRequest.redemptionCode}
                          </code>
                          <button
                            onClick={() =>
                              copyToClipboard(selectedRequest.redemptionCode!)
                            }
                            className="rounded-lg bg-white p-1.5 text-indigo-600 border border-indigo-200 hover:bg-indigo-50"
                            title="Copy code"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-indigo-100/80 pt-2 space-y-1.5 text-xs text-slate-600">
                        {selectedRequest.expiresAt && (
                          <div className="flex justify-between">
                            <span>Valid Until:</span>
                            <span className="font-semibold text-slate-800">
                              {formatDate(selectedRequest.expiresAt)}
                            </span>
                          </div>
                        )}
                        {selectedRequest.completedAt && (
                          <div className="flex justify-between">
                            <span>Completed At:</span>
                            <span className="font-semibold text-emerald-700">
                              {formatDate(selectedRequest.completedAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      No voucher generated yet. Vouchers are securely generated once an admin approves the request.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="mt-6 flex flex-wrap gap-2.5 border-t border-slate-100 pt-4">
              {selectedRequest.status === "pending" && (
                <>
                  <button
                    onClick={() => handlePromptApprove(selectedRequest)}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-95"
                  >
                    Approve & Issue Voucher
                  </button>
                  <button
                    onClick={() => handlePromptReject(selectedRequest)}
                    className="flex-1 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                  >
                    Reject & Refund
                  </button>
                </>
              )}

              {selectedRequest.status === "approved" &&
                selectedRequest.redemptionStatus !== "completed" && (
                  <>
                    <button
                      onClick={() => handleValidateVoucher(selectedRequest)}
                      className="flex-1 rounded-xl border border-indigo-200 bg-indigo-50 py-2.5 text-xs font-bold text-[#6366F1] hover:bg-indigo-100"
                    >
                      Validate Code
                    </button>
                    <button
                      onClick={() => handlePromptComplete(selectedRequest)}
                      className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-95"
                    >
                      Complete Voucher
                    </button>
                  </>
                )}

              <button
                onClick={() => setDetailsModalOpen(false)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Component */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel="Cancel"
        variant={confirmDialog.variant}
        loading={actionLoading}
        onConfirm={handleExecuteDialogAction}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
