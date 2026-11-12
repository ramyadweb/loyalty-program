import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Search,
  Coins,
  Menu,
  History,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import UserSidebar from "../../components/UserSidebar";
import UserNotificationDropdown from "../../components/UserNotificationDropdown";
import {
  userRewardsService,
  pointsService,
  type UserRewardItem,
  type PointsTransactionItem,
} from "../../services/api";

type Transaction = {
  id: number;
  title: string;
  description: string;
  type: "Earned" | "Redeemed";
  points: number;
  date: string;
  status: "Completed" | "Pending";
};

function Transactions() {
  const { user, refreshProfile, updateUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [pointsHistory, setPointsHistory] = useState<PointsTransactionItem[]>([]);
  const [pointsBalance, setPointsBalance] = useState({
    availablePoints: 0,
    totalEarned: 0,
    totalRedeemed: 0,
  });
  const [claims, setClaims] = useState<UserRewardItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const [balanceRes, historyRes, claimsRes] = await Promise.allSettled([
        pointsService.getMyPointsBalance(),
        pointsService.getMyPointsHistory(1, 100),
        userRewardsService.getMyRewards(),
      ]);

      if (balanceRes.status === "fulfilled" && balanceRes.value.data?.data) {
        const balance = balanceRes.value.data.data;
        setPointsBalance({
          availablePoints: Number(balance.availablePoints ?? 0),
          totalEarned: Number(balance.totalEarned ?? 0),
          totalRedeemed: Number(balance.totalRedeemed ?? 0),
        });
        updateUser({ pointsBalance: Number(balance.availablePoints ?? 0) });
      }

      if (historyRes.status === "fulfilled" && historyRes.value.data?.data) {
        setPointsHistory(historyRes.value.data.data);
      }

      if (claimsRes.status === "fulfilled" && claimsRes.value.data?.data) {
        setClaims(claimsRes.value.data.data);
      }
    } catch (err) {
      console.error("Failed to load user transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    refreshProfile().catch(() => {});
  }, []);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  // Build transactions list from points history
  const transactionsList: Transaction[] = useMemo(() => {
    if (pointsHistory.length > 0) {
      return pointsHistory.map((pt) => {
        const isRedemption = pt.activity === "REDEMPTION";
        let defaultTitle = "Points Activity";
        switch (pt.activity) {
          case "REGISTRATION":
            defaultTitle = "Welcome Registration Bonus";
            break;
          case "FEEDBACK":
            defaultTitle = "Feedback Review Bonus";
            break;
          case "ADMIN_BONUS":
            defaultTitle = "Admin Bonus Points";
            break;
          case "TICKET_CREATED":
            defaultTitle = "Ticket Created Bonus";
            break;
          case "TICKET_OPENED":
            defaultTitle = "Ticket Opened Bonus";
            break;
          case "TICKET_RESOLVED":
            defaultTitle = "Ticket Resolved Bonus";
            break;
          case "REVERSAL":
            defaultTitle = "Points Reversal / Refund";
            break;
          case "REDEMPTION":
            defaultTitle = "Reward Redemption";
            break;
        }

        return {
          id: pt.id,
          title: defaultTitle,
          description: pt.description || defaultTitle,
          type: isRedemption ? "Redeemed" : "Earned",
          points: pt.points,
          date: new Date(pt.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          }),
          status: "Completed",
        };
      });
    }

    // Fallback if points ledger is empty but claims exist
    const list: Transaction[] = [];
    claims.forEach((claim) => {
      list.push({
        id: claim.id,
        title: claim.rewardName || "Reward Redemption",
        description: `Redeemed ${claim.rewardName} for ${claim.pointsSpent} pts (${claim.status})`,
        type: "Redeemed",
        points: claim.pointsSpent,
        date: new Date(claim.redeemedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        status: claim.status === "approved" ? "Completed" : "Pending",
      });
    });

    return list;
  }, [pointsHistory, claims]);

  const filteredTransactions = useMemo(() => {
    return transactionsList.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "All" || t.type === filter;
      return matchesSearch && matchesFilter;
    });
  }, [transactionsList, search, filter]);

  const totalRedeemed = pointsBalance.totalRedeemed;
  const currentBalance = pointsBalance.availablePoints;
  const totalEarned = pointsBalance.totalEarned;

  const exportCSV = () => {
    const headers = ["Title", "Description", "Type", "Points", "Date", "Status"];
    const rows = filteredTransactions.map((item) => [
      item.title,
      item.description,
      item.type,
      item.points,
      item.date,
      item.status,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transactions-statement-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
              <h2 className="text-lg font-bold sm:text-xl text-[#1E293B]">Points Ledger</h2>
              <p className="hidden text-xs text-[#64748B] sm:block">
                View your complete points transaction history and debits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={exportCSV}
              className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-600 hover:to-purple-600 sm:flex"
            >
              <Download size={14} />
              Export Statement
            </button>
            <UserNotificationDropdown onRefreshStats={fetchTransactions} />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-xs font-bold text-white shadow-md shadow-indigo-500/20">
              {initials}
            </div>
          </div>
        </header>

        <div className="space-y-6 p-5 sm:p-8">
          {/* Header */}
          <section>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#6366F1]">
                  Activity Statement
                </p>
                <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl text-[#1E293B]">Transactions</h1>
                <p className="mt-1 text-xs text-[#64748B]">
                  Detailed ledger of all rewarded purchases, bonuses, and redeemed voucher debits.
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

          {/* Quick Stats Summary */}
          <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[
              {
                label: "Current Balance",
                value: `${currentBalance.toLocaleString("en-IN")} pts`,
                icon: Coins,
                color: "bg-indigo-50 text-[#6366F1] border border-indigo-100",
              },
              {
                label: "Lifetime Accrued",
                value: `+${totalEarned.toLocaleString("en-IN")} pts`,
                icon: ArrowUpRight,
                color: "bg-emerald-50 text-emerald-600 border border-emerald-100",
              },
              {
                label: "Total Redeemed",
                value: `-${totalRedeemed.toLocaleString("en-IN")} pts`,
                icon: ArrowDownLeft,
                color: "bg-rose-50 text-rose-600 border border-rose-100",
              },
              {
                label: "Transactions Logged",
                value: transactionsList.length,
                icon: History,
                color: "bg-purple-50 text-purple-600 border border-purple-100",
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#64748B]">{stat.label}</p>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.color}`}>
                      <Icon size={16} />
                    </div>
                  </div>
                  <h3 className="mt-3 text-2xl font-black text-[#1E293B]">{stat.value}</h3>
                </div>
              );
            })}
          </section>

          {/* Transactions Table Section */}
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1E293B]">Point Activity Log</h3>
                <p className="mt-0.5 text-xs text-[#64748B]">
                  Filter and track each transaction's status
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search transaction..."
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2 pl-9 pr-3 text-xs text-[#1E293B] outline-none focus:border-[#6366F1] focus:bg-white sm:w-56"
                  />
                </div>

                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#1E293B] outline-none focus:border-[#6366F1] sm:w-36"
                >
                  <option value="All">All Types</option>
                  <option value="Earned">Points Earned</option>
                  <option value="Redeemed">Points Redeemed</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-[#6366F1]" />
                  <p className="text-xs font-semibold text-slate-500">Loading ledger records...</p>
                </div>
              ) : (
                <table className="w-full min-w-[700px] text-left">
                  <thead className="bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    <tr>
                      <th className="px-5 py-3.5">Transaction</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">Points</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Date</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredTransactions.map((item) => (
                      <tr key={item.id} className="transition hover:bg-slate-50/80">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                                item.type === "Earned"
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                  : "bg-rose-50 text-rose-600 border border-rose-100"
                              }`}
                            >
                              {item.type === "Earned" ? (
                                <ArrowUpRight size={15} />
                              ) : (
                                <ArrowDownLeft size={15} />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-[#1E293B]">{item.title}</p>
                              <p className="text-[11px] text-[#64748B]">{item.description}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              item.type === "Earned"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {item.type}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`font-black ${
                              item.type === "Earned" ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {item.type === "Earned" ? "+" : "-"}
                            {item.points.toLocaleString("en-IN")} pts
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              item.status === "Completed"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : "bg-amber-50 text-amber-600 border border-amber-200"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right text-[#64748B]">{item.date}</td>
                      </tr>
                    ))}

                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center">
                          <History size={32} className="mx-auto mb-2 text-slate-300" />
                          <p className="text-xs font-bold text-[#1E293B]">No transactions found</p>
                          <p className="mt-0.5 text-[11px] text-[#64748B]">
                            Try adjusting your search criteria or category filter.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="border-t border-slate-100 px-5 py-3 text-xs text-[#64748B]">
              Showing {filteredTransactions.length} of {transactionsList.length} transactions
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

export default Transactions;
