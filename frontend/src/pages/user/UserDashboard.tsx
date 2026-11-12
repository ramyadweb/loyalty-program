import { useState, useRef, useEffect } from "react";
import {
  Gift,
  TrendingUp,
  Ticket,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  Headphones,
  Star,
  Menu,
  Sparkles,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  authApi,
  userRewardsService,
  ticketsService,
  pointsService,
  type UserRewardItem,
  type TicketItem,
  type PointsTransactionItem,
} from "../../services/api";
import UserSidebar from "../../components/UserSidebar";
import ConfirmDialog from "../../components/ConfirmDialog";
import UserNotificationDropdown from "../../components/UserNotificationDropdown";

function UserDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dropdown states
  const [profileOpen, setProfileOpen] = useState(false);

  // User Points Balance State
  const [pointsBalance, setPointsBalance] = useState({
    availablePoints: 0,
    totalEarned: 0,
    totalRedeemed: 0,
  });
  const [pointsLoading, setPointsLoading] = useState(true);
  const [pointsError, setPointsError] = useState<string | null>(null);

  const [recentTransactions, setRecentTransactions] = useState<PointsTransactionItem[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  const [claims, setClaims] = useState<UserRewardItem[]>([]);
  const [tickets, setTickets] = useState<TicketItem[]>([]);

  // Sign out confirmation dialog
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Click outside ref
  const profileRef = useRef<HTMLDivElement>(null);

  const firstName = user?.name?.split(" ")[0] ?? "Member";
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "M";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fetchPointsBalance = async () => {
    try {
      setPointsLoading(true);
      setPointsError(null);

      const response = await pointsService.getMyPointsBalance();

      // Extract server payload (response.data) and then inner data (response.data.data)
      const balance = response.data?.data;

      if (balance) {
        setPointsBalance({
          availablePoints: Number(balance.availablePoints ?? 0),
          totalEarned: Number(balance.totalEarned ?? 0),
          totalRedeemed: Number(balance.totalRedeemed ?? 0),
        });
        updateUser({ pointsBalance: Number(balance.availablePoints ?? 0) });
      }
    } catch (err) {
      console.error("Failed to load points balance:", err);
      setPointsError("Failed to load points balance.");
    } finally {
      setPointsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    // 1. Fetch live points balance
    fetchPointsBalance();

    // 2. Fetch recent ledger history and vouchers
    try {
      setTransactionsLoading(true);

      const [historyRes, claimsRes, ticketsRes] = await Promise.allSettled([
        pointsService.getMyPointsHistory(1, 5),
        userRewardsService.getMyRewards(),
        ticketsService.getTickets(),
      ]);

      if (historyRes.status === "fulfilled" && historyRes.value.data?.data) {
        setRecentTransactions(historyRes.value.data.data);
      }

      if (claimsRes.status === "fulfilled" && claimsRes.value.data?.data) {
        setClaims(claimsRes.value.data.data);
      }

      if (ticketsRes.status === "fulfilled" && ticketsRes.value.data?.data) {
        setTickets(ticketsRes.value.data.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard activities:", err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle click outside to close profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // Proceed client-side if API fails
    } finally {
      logout();
      navigate("/login", { replace: true });
    }
  };

  // Points values mapped directly from React state
  const availablePoints = pointsBalance.availablePoints;
  const lifetimeEarned = pointsBalance.totalEarned;
  const totalRedeemedPoints = pointsBalance.totalRedeemed;

  const targetMilestone = 5000;
  const progressPercent = Math.min(
    100,
    Math.round((availablePoints / targetMilestone) * 100)
  );

  const formatTransactionTitle = (tx: PointsTransactionItem) => {
    if (tx.description) return tx.description;
    switch (tx.activity) {
      case "REGISTRATION":
        return "Welcome Registration Bonus";
      case "FEEDBACK":
        return "Feedback Review Bonus";
      case "ADMIN_BONUS":
        return "Special Bonus Points";
      case "TICKET_CREATED":
        return "Ticket Created Bonus";
      case "TICKET_OPENED":
        return "Ticket Opened Bonus";
      case "TICKET_RESOLVED":
        return "Ticket Resolved Bonus";
      case "REVERSAL":
        return "Points Refund / Reversal";
      case "REDEMPTION":
        return "Reward Voucher Claim";
      default:
        return "Points Activity";
    }
  };

  const ticketPointsEarned = recentTransactions
    .filter((tx) => tx.activity === "TICKET_CREATED" || tx.activity === "TICKET_OPENED" || tx.activity === "TICKET_RESOLVED")
    .reduce((acc, curr) => acc + (curr.points > 0 ? curr.points : 0), 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] overflow-x-hidden">
      <UserSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="min-h-screen lg:ml-64 flex flex-col justify-between">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#1E293B] active:scale-95 lg:hidden"
              aria-label="Open sidebar navigation"
            >
              <Menu size={22} />
            </button>
            <div>
              <h2 className="text-lg font-bold sm:text-xl text-[#1E293B]">Member Dashboard</h2>
              <p className="hidden text-xs text-[#64748B] sm:block">{today}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* User Notifications Bell & Dropdown */}
            <UserNotificationDropdown onRefreshStats={loadDashboardData} />

            {/* Profile Dropdown Trigger */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setProfileOpen(!profileOpen);
                }}
                aria-label="User profile options"
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition-all duration-200 hover:scale-105 active:scale-95 ${
                  profileOpen ? "ring-2 ring-[#6366F1] ring-offset-2" : ""
                }`}
              >
                {initials}
              </button>

              {/* Profile Dropdown Menu */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-3 p-2 border-b border-slate-100 pb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-xs font-bold text-white shadow-sm">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-[#1E293B]">
                        {user?.name ?? "Member"}
                      </p>
                      <p className="truncate text-[10px] text-[#64748B]">
                        {user?.email ?? "member@loyalty.com"}
                      </p>
                      <span className="mt-1 inline-block rounded-md bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-[#6366F1]">
                        Platinum Tier • {pointsLoading ? "..." : availablePoints.toLocaleString("en-IN")} pts
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    <Link
                      to="/user/my-rewards"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] transition hover:bg-slate-50 hover:text-[#6366F1]"
                    >
                      <span className="flex items-center gap-2.5">
                        <Gift size={15} className="text-[#6366F1]" />
                        My Rewards & Vouchers
                      </span>
                      <ChevronRight size={14} className="text-slate-400" />
                    </Link>

                    <Link
                      to="/user/transaction"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] transition hover:bg-slate-50 hover:text-[#6366F1]"
                    >
                      <span className="flex items-center gap-2.5">
                        <TrendingUp size={15} className="text-emerald-600" />
                        Points Ledger
                      </span>
                      <ChevronRight size={14} className="text-slate-400" />
                    </Link>

                    <Link
                      to="/user/raise-ticket"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] transition hover:bg-slate-50 hover:text-[#6366F1]"
                    >
                      <span className="flex items-center gap-2.5">
                        <Ticket size={15} className="text-[#8B5CF6]" />
                        Help & Support Tickets
                      </span>
                      <ChevronRight size={14} className="text-slate-400" />
                    </Link>
                  </div>

                  <div className="mt-2 border-t border-slate-100 pt-2">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        setShowLogoutDialog(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 active:scale-95"
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="space-y-6 p-5 sm:p-8">
          {/* Welcome Banner */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#111827] via-[#1E1B4B] to-[#312E81] p-7 text-white sm:p-9 shadow-xl shadow-indigo-950/20 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-950/30">
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,#8B5CF6_0%,transparent_70%)] opacity-35 blur-[70px]" />

            <div className="relative z-10 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                <Sparkles size={13} />
                <span>ACTIVE PLATINUM TIER</span>
              </div>
              <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl text-white tracking-tight">
                Welcome back, {firstName}! 👋
              </h2>
              <p className="mt-2 text-xs leading-6 text-slate-300 sm:text-sm">
                {pointsLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-3.5 w-16 bg-white/20 animate-pulse rounded" />
                    <span>Loading reward points...</span>
                  </span>
                ) : pointsError ? (
                  <span>
                    Welcome to your loyalty member portal. Browse available rewards and vouchers below.
                  </span>
                ) : (
                  <>
                    You have <strong className="font-extrabold text-white">{availablePoints.toLocaleString("en-IN")}</strong> reward points available. Redeem for premium vouchers, discounts, or exclusive merchandise.
                  </>
                )}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/user/my-rewards"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:from-indigo-600 hover:to-purple-600 hover:-translate-y-0.5 hover:shadow-indigo-500/40 active:scale-95"
                >
                  Explore Rewards
                  <ArrowUpRight size={15} />
                </Link>
                <Link
                  to="/user/transaction"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-bold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:-translate-y-0.5 hover:border-white/40 active:scale-95"
                >
                  View Activity
                </Link>
              </div>
            </div>

            <div className="pointer-events-none absolute -right-4 -top-8 hidden h-64 w-64 items-center justify-center rounded-full border border-white/5 sm:flex">
              <div className="flex h-44 w-44 items-center justify-center rounded-full border border-white/5">
                <Gift size={90} className="text-[#8B5CF6]/30" />
              </div>
            </div>
          </section>

          {/* Essential Reward Statistics */}
          <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[
              {
                label: "Available Points",
                value: availablePoints.toLocaleString("en-IN"),
                sub: "Ready to redeem",
                icon: Gift,
                iconColor: "text-[#6366F1]",
                bg: "bg-indigo-50 border border-indigo-100",
                subColor: "text-emerald-600",
                loading: pointsLoading,
                error: pointsError,
              },
              {
                label: "Lifetime Earned",
                value: lifetimeEarned.toLocaleString("en-IN"),
                sub: "Accumulated to date",
                icon: TrendingUp,
                iconColor: "text-emerald-600",
                bg: "bg-emerald-50 border border-emerald-100",
                subColor: "text-[#64748B]",
                loading: pointsLoading,
                error: pointsError,
              },
              {
                label: "Points Redeemed",
                value: totalRedeemedPoints.toLocaleString("en-IN"),
                sub: `${claims.length} vouchers claimed`,
                icon: ShoppingBag,
                iconColor: "text-purple-600",
                bg: "bg-purple-50 border border-purple-100",
                subColor: "text-[#64748B]",
                loading: pointsLoading,
                error: pointsError,
              },
              {
                label: "Support Tickets",
                value: tickets.length.toString(),
                sub: ticketPointsEarned > 0 ? `${ticketPointsEarned} pts earned` : `${tickets.filter((t) => t.status === "open").length} open`,
                icon: Ticket,
                iconColor: "text-amber-600",
                bg: "bg-amber-50 border border-amber-100",
                subColor: "text-[#64748B]",
                loading: false,
                error: null,
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200/90 hover:scale-[1.01] cursor-default"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#64748B]">{stat.label}</p>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.bg}`}>
                      <Icon size={18} className={stat.iconColor} />
                    </div>
                  </div>

                  {stat.loading ? (
                    <div className="mt-3 space-y-2">
                      <div className="h-7 w-20 bg-slate-200/70 animate-pulse rounded-lg" />
                      <div className="h-3 w-16 bg-slate-100 animate-pulse rounded" />
                    </div>
                  ) : stat.error ? (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-rose-500">Unavailable</p>
                      <p className="mt-1 text-[11px] text-slate-400">Error loading</p>
                    </div>
                  ) : (
                    <>
                      <h3 className="mt-3 text-2xl font-black text-[#1E293B]">
                        {stat.value}
                      </h3>
                      <p className={`mt-1 text-[11px] font-medium ${stat.subColor}`}>{stat.sub}</p>
                    </>
                  )}
                </div>
              );
            })}
          </section>

          {/* Reward Progress and Quick Shortcuts */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm xl:col-span-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200/80">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#1E293B]">Next Tier Milestone</h3>
                  <p className="mt-0.5 text-xs text-[#64748B]">
                    Accumulate 5,000 points to unlock Diamond Status and 3x multiplier.
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#8B5CF6] border border-purple-100">
                  <Star size={18} />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between text-xs font-bold">
                <span className="text-[#1E293B]">
                  {pointsLoading ? "..." : `${availablePoints.toLocaleString("en-IN")} / 5,000 pts`}
                </span>
                <span className="text-[#6366F1]">{pointsLoading ? "..." : `${progressPercent}% Complete`}</span>
              </div>

              <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="mt-3 text-[11px] text-[#64748B]">
                {pointsLoading ? (
                  "Calculating tier progress..."
                ) : availablePoints >= 5000 ? (
                  "Congratulations! You have reached Diamond tier milestone."
                ) : (
                  `Only ${(5000 - availablePoints).toLocaleString("en-IN")} more points needed to claim your Diamond upgrade voucher!`
                )}
              </p>

              <div className="mt-5 flex gap-3">
                <Link
                  to="/user/my-rewards"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-300 hover:from-indigo-600 hover:to-purple-600 hover:-translate-y-0.5 hover:shadow-indigo-500/30 active:scale-95"
                >
                  <Gift size={14} />
                  Browse Rewards
                </Link>
                <Link
                  to="/user/transaction"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-[#1E293B] transition-all duration-300 hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 active:scale-95"
                >
                  View Activity
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200/80">
              <h3 className="text-sm font-bold text-[#1E293B]">Quick Shortcuts</h3>

              <div className="mt-4 space-y-2.5">
                <Link
                  to="/user/my-rewards"
                  className="flex items-center justify-between rounded-xl border border-slate-200/80 p-3.5 text-xs font-semibold text-[#1E293B] transition-all duration-200 hover:border-[#6366F1] hover:bg-indigo-50/30 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2.5">
                    <Gift size={16} className="text-[#6366F1]" />
                    Redeem Gift Vouchers
                  </span>
                  <ArrowUpRight size={14} className="text-slate-400" />
                </Link>

                <Link
                  to="/user/raise-ticket"
                  className="flex items-center justify-between rounded-xl border border-slate-200/80 p-3.5 text-xs font-semibold text-[#1E293B] transition-all duration-200 hover:border-[#6366F1] hover:bg-indigo-50/30 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2.5">
                    <Headphones size={16} className="text-[#8B5CF6]" />
                    Customer Support
                  </span>
                  <ArrowUpRight size={14} className="text-slate-400" />
                </Link>

                <Link
                  to="/user/transaction"
                  className="flex items-center justify-between rounded-xl border border-slate-200/80 p-3.5 text-xs font-semibold text-[#1E293B] transition-all duration-200 hover:border-[#6366F1] hover:bg-indigo-50/30 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2.5">
                    <TrendingUp size={16} className="text-emerald-600" />
                    Transaction Logs
                  </span>
                  <ArrowUpRight size={14} className="text-slate-400" />
                </Link>
              </div>
            </div>
          </section>

          {/* Ticket Activity Rewards Card */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#1E293B]">Ticket Activity Rewards</h3>
                  <p className="mt-0.5 text-xs text-[#64748B]">
                    Earn up to 120 loyalty points on every support ticket you raise
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                  {ticketPointsEarned} pts earned
                </span>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    <tr>
                      <th className="px-4 py-2.5">Ticket Activity</th>
                      <th className="px-4 py-2.5 text-center">Reward Criteria</th>
                      <th className="px-4 py-2.5 text-right">Points Awarded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3 font-semibold text-[#1E293B]">
                        Ticket Created
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500">
                        Raise a verified inquiry or issue
                      </td>
                      <td className="px-4 py-3 text-right font-black text-emerald-600">
                        +50 pts
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3 font-semibold text-[#1E293B]">
                        Ticket Opened
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500">
                        Admin team reviews & inspects ticket
                      </td>
                      <td className="px-4 py-3 text-right font-black text-emerald-600">
                        +20 pts
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3 font-semibold text-[#1E293B]">
                        Ticket Resolved
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500">
                        Support query successfully resolved
                      </td>
                      <td className="px-4 py-3 text-right font-black text-emerald-600">
                        +50 pts
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="border-t border-slate-200 bg-slate-50/70 font-bold">
                    <tr>
                      <td className="px-4 py-2.5 text-slate-700">Total Potential per Ticket</td>
                      <td className="px-4 py-2.5 text-center text-[11px] text-slate-400">Automatic Award</td>
                      <td className="px-4 py-2.5 text-right font-black text-[#6366F1]">+120 pts max</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 p-6 shadow-sm">
              <div>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 shadow-xs border border-indigo-100">
                  Instant Points
                </span>
                <h4 className="mt-3 text-base font-extrabold text-[#1E293B]">
                  Need Assistance?
                </h4>
                <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
                  Raise a ticket regarding points balance, reward redemption, or partner offers and automatically earn 50 points upon submission.
                </p>
              </div>

              <Link
                to="/user/raise-ticket"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition hover:from-indigo-600 hover:to-purple-600"
              >
                <Ticket size={14} />
                <span>Raise a Ticket (+50 pts)</span>
              </Link>
            </div>
          </section>

          {/* Recent transactions */}
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
              <div>
                <h3 className="text-sm font-bold text-[#1E293B]">Recent Points Activity</h3>
                <p className="mt-0.5 text-xs text-[#64748B]">
                  Your latest credits and redemptions
                </p>
              </div>
              <Link
                to="/user/transaction"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#6366F1] transition-colors hover:text-[#4F46E5] hover:underline"
              >
                <span>View All Activity</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>

            {transactionsLoading ? (
              <div className="divide-y divide-slate-100 p-6 space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex items-center justify-between py-2 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-slate-100" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-36 rounded bg-slate-100" />
                        <div className="h-2.5 w-20 rounded bg-slate-100" />
                      </div>
                    </div>
                    <div className="h-4 w-16 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : recentTransactions.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {recentTransactions.map((t) => {
                  const isRedeemed = t.activity === "REDEMPTION";
                  const title = formatTransactionTitle(t);
                  const formattedDate = new Date(t.createdAt).toLocaleDateString("en-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={t.id}
                      className="group flex items-center justify-between gap-3 px-6 py-3.5 transition-colors duration-200 hover:bg-slate-50/90"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${
                            !isRedeemed
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : "bg-rose-50 text-rose-600 border border-rose-100"
                          }`}
                        >
                          {!isRedeemed ? (
                            <ArrowDownRight size={15} />
                          ) : (
                            <ArrowUpRight size={15} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-bold text-[#1E293B] group-hover:text-[#6366F1] transition-colors">
                            {title}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#64748B]">
                            <Clock size={11} />
                            {formattedDate}
                          </p>
                        </div>
                      </div>

                      <p
                        className={`shrink-0 font-bold ${
                          !isRedeemed ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {!isRedeemed ? "+" : "-"}
                        {t.points.toLocaleString("en-IN")} pts
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <TrendingUp size={18} />
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-600">No points activity yet</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Transactions will appear here when you earn or redeem points.
                </p>
              </div>
            )}
          </section>
        </div>

        <footer className="py-4 text-center text-xs text-[#64748B] border-t border-slate-200/50 mt-6">
          © 2026 Loyalty+ SaaS Platform. All rights reserved.
        </footer>
      </main>

      {/* Sign Out Confirmation Modal */}
      <ConfirmDialog
        isOpen={showLogoutDialog}
        title="Sign Out"
        message="Are you sure you want to sign out of your account session?"
        confirmLabel="Sign Out"
        cancelLabel="Stay Logged In"
        variant="warning"
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutDialog(false)}
      />
    </div>
  );
}

export default UserDashboard;
