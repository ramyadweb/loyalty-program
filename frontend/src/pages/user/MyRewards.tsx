import { useEffect, useState } from "react";
import {
  Gift,
  Star,
  CheckCircle,
  Sparkles,
  Menu,
  AlertCircle,
  Loader2,
  Ticket,
  Copy,
  Clock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import UserSidebar from "../../components/UserSidebar";
import UserNotificationDropdown from "../../components/UserNotificationDropdown";
import {
  rewardsService,
  userRewardsService,
  redemptionService,
  type RewardItem,
  type UserRewardItem,
  type RewardRedemptionItem,
} from "../../services/api";

type MessageState = { type: "success" | "error"; text: string } | null;

const defaultCatalogRewards: Array<{
  id: number;
  name: string;
  description: string;
  pointsRequired: number;
  category: string;
  image: string;
  stock: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}> = [
  {
    id: 1,
    name: "Amazon Gift Card",
    description: "Get a digital gift voucher for electronics and lifestyle purchases.",
    pointsRequired: 1000,
    category: "Gift Cards",
    image: "🎁",
    stock: 50,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Shopping Voucher",
    description: "Enjoy instantaneous merchant discounts on partner ecommerce sites.",
    pointsRequired: 1500,
    category: "Shopping",
    image: "🛍️",
    stock: 40,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Movie Ticket",
    description: "Redeem complimentary cinema and multiplex passes with your points.",
    pointsRequired: 800,
    category: "Entertainment",
    image: "🎬",
    stock: 100,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: "Premium Gift Box",
    description: "Curated luxury artisan package shipped directly to your address.",
    pointsRequired: 3000,
    category: "Premium",
    image: "🎀",
    stock: 20,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 5,
    name: "Dining Voucher",
    description: "Enjoy fine dining and casual gourmet discounts across partner venues.",
    pointsRequired: 1200,
    category: "Food",
    image: "🍔",
    stock: 60,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 6,
    name: "Flight & Hotel Voucher",
    description: "Save big on your next domestic or international travel reservation.",
    pointsRequired: 4000,
    category: "Travel",
    image: "✈️",
    stock: 15,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const categories = [
  "All",
  "Gift Cards",
  "Shopping",
  "Entertainment",
  "Premium",
  "Food",
  "Travel",
];

function MyRewards() {
  const { user, refreshProfile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"catalog" | "my_claims">("catalog");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [message, setMessage] = useState<MessageState>(null);

  // Data states
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [myClaims, setMyClaims] = useState<UserRewardItem[]>([]);
  const [myRedemptions, setMyRedemptions] = useState<RewardRedemptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<number | null>(null);
  const [generatingCodeId, setGeneratingCodeId] = useState<number | null>(null);

  const balance = user?.pointsBalance ?? 0;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [rewardsRes, claimsRes, redemptionsRes] = await Promise.allSettled([
        rewardsService.getRewards("active"),
        userRewardsService.getMyRewards(),
        redemptionService.getMyRedemptions(),
      ]);

      if (rewardsRes.status === "fulfilled" && rewardsRes.value.data?.data?.length > 0) {
        setRewards(rewardsRes.value.data.data);
      } else {
        // Fallback to default catalog if backend has no active catalog items yet
        setRewards(defaultCatalogRewards);
      }

      if (claimsRes.status === "fulfilled" && claimsRes.value.data?.data) {
        setMyClaims(claimsRes.value.data.data);
      }

      if (redemptionsRes.status === "fulfilled" && redemptionsRes.value.data?.data) {
        setMyRedemptions(redemptionsRes.value.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch rewards data:", err);
      setRewards(defaultCatalogRewards);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    refreshProfile().catch(() => {});
  }, []);

  const handleClaim = async (reward: RewardItem) => {
    if (balance < reward.pointsRequired) {
      showMessage("error", "You do not possess sufficient points for this redemption.");
      return;
    }

    setRedeemingId(reward.id);
    try {
      const res = await userRewardsService.claimReward(reward.id);
      showMessage(
        "success",
        res.data?.message || `${reward.name} claimed! Waiting for admin approval.`
      );
      await refreshProfile();
      const updatedClaims = await userRewardsService.getMyRewards();
      if (updatedClaims.data?.data) {
        setMyClaims(updatedClaims.data.data);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to claim reward.";
      showMessage("error", msg);
    } finally {
      setRedeemingId(null);
    }
  };

  const handleGenerateVoucher = async (userRewardId: number) => {
    setGeneratingCodeId(userRewardId);
    try {
      const res = await redemptionService.createRedemption(userRewardId);
      showMessage(
        "success",
        `Voucher code generated: ${res.data?.data?.redemptionCode || "Success"}`
      );
      const updatedRedemptions = await redemptionService.getMyRedemptions();
      if (updatedRedemptions.data?.data) {
        setMyRedemptions(updatedRedemptions.data.data);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to generate voucher code.";
      showMessage("error", msg);
    } finally {
      setGeneratingCodeId(null);
    }
  };

  const getRewardCategory = (reward: RewardItem) => {
    const text = (reward.name + " " + (reward.description || "")).toLowerCase();
    if (text.includes("amazon") || text.includes("gift")) return "Gift Cards";
    if (text.includes("shopping") || text.includes("discount")) return "Shopping";
    if (text.includes("movie") || text.includes("cinema") || text.includes("pass"))
      return "Entertainment";
    if (text.includes("luxury") || text.includes("box") || text.includes("premium"))
      return "Premium";
    if (text.includes("dining") || text.includes("food") || text.includes("restaurant"))
      return "Food";
    if (text.includes("travel") || text.includes("flight") || text.includes("hotel"))
      return "Travel";
    return "Gift Cards";
  };

  const filteredRewards =
    selectedCategory === "All"
      ? rewards
      : rewards.filter((r) => getRewardCategory(r) === selectedCategory);

  const getRewardIcon = (reward: RewardItem) => {
    if (reward.image && reward.image.length <= 4) return reward.image;
    const cat = getRewardCategory(reward);
    switch (cat) {
      case "Gift Cards": return "🎁";
      case "Shopping": return "🛍️";
      case "Entertainment": return "🎬";
      case "Premium": return "🎀";
      case "Food": return "🍔";
      case "Travel": return "✈️";
      default: return "🎁";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showMessage("success", "Voucher code copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      <UserSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="lg:pl-64">
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
              <h2 className="text-lg font-bold sm:text-xl text-[#1E293B]">Redeem Rewards</h2>
              <p className="hidden text-xs text-[#64748B] sm:block">
                Exchange points for instant perks, vouchers, and merchandise
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <UserNotificationDropdown onRefreshStats={loadData} />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-xs font-bold text-white shadow-md shadow-indigo-500/20">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="space-y-6 p-5 sm:p-8">
          {/* Balance Hero Card */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#111827] via-[#1E1B4B] to-[#312E81] p-7 sm:p-9 text-white shadow-xl shadow-indigo-950/20">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,#8B5CF6_0%,transparent_70%)] opacity-35 blur-[60px]" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                <Sparkles size={13} />
                <span>AVAILABLE SPENDABLE BALANCE</span>
              </div>
              <div className="mt-4 flex items-end gap-3">
                <Star className="mb-1 text-[#8B5CF6]" size={32} />
                <h3 className="text-4xl sm:text-5xl font-black">{balance.toLocaleString("en-IN")}</h3>
                <span className="mb-1.5 text-sm font-semibold text-slate-300">Reward Points</span>
              </div>
              <p className="mt-2 text-xs text-slate-300 sm:text-sm max-w-md">
                Points are eligible for full redemption across all partner catalogs with 100% value preservation.
              </p>
            </div>

            <Gift
              size={140}
              className="pointer-events-none absolute -right-6 -top-4 text-white/5 hidden sm:block"
            />
          </section>

          {/* Feedback message */}
          {message && (
            <div
              className={`flex items-start justify-between gap-3 rounded-2xl border p-4 text-xs font-semibold ${
                message.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              <span className="flex items-center gap-2">
                {message.type === "error" && <AlertCircle size={17} />}
                {message.type === "success" && <CheckCircle size={17} />}
                {message.text}
              </span>
              <button
                onClick={() => setMessage(null)}
                className="shrink-0 underline underline-offset-2 hover:opacity-80"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Tab Selection */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab("catalog")}
              className={`border-b-2 px-5 py-3 text-xs font-bold transition-all ${
                activeTab === "catalog"
                  ? "border-[#6366F1] text-[#6366F1]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Browse Catalog ({rewards.length})
            </button>
            <button
              onClick={() => setActiveTab("my_claims")}
              className={`border-b-2 px-5 py-3 text-xs font-bold transition-all ${
                activeTab === "my_claims"
                  ? "border-[#6366F1] text-[#6366F1]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              My Redemptions & Vouchers ({myClaims.length})
            </button>
          </div>

          {activeTab === "catalog" ? (
            <>
              {/* Category filter */}
              <section>
                <div className="mb-3.5 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#1E293B]">Catalog Categories</h3>
                    <p className="text-xs text-[#64748B]">
                      Filter offerings by your preferred reward type
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                        selectedCategory === category
                          ? "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-md shadow-indigo-500/25"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-[#6366F1] hover:text-[#1E293B]"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </section>

              {/* Reward cards */}
              {loading ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-[#6366F1]" />
                  <p className="text-xs font-semibold text-slate-500">Loading catalog...</p>
                </div>
              ) : (
                <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredRewards.map((reward) => {
                    const category = getRewardCategory(reward);
                    const icon = getRewardIcon(reward);
                    const insufficientPoints = balance < reward.pointsRequired;
                    const isRedeeming = redeemingId === reward.id;

                    return (
                      <div
                        key={reward.id}
                        className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                      >
                        {/* Card header */}
                        <div className="flex h-36 items-center justify-center bg-gradient-to-br from-[#111827] via-[#1E1B4B] to-[#312E81] text-white">
                          <span className="text-5xl">{icon}</span>
                        </div>

                        {/* Card body */}
                        <div className="p-5">
                          <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-0.5 text-[10px] font-bold text-[#6366F1]">
                            {category}
                          </span>

                          <h4 className="mt-3 text-base font-bold text-[#1E293B]">{reward.name}</h4>
                          <p className="mt-1 min-h-10 text-xs leading-5 text-[#64748B]">
                            {reward.description || "Exciting loyalty perks and member privileges."}
                          </p>

                          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                            <div>
                              <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                                Required
                              </p>
                              <p className="mt-0.5 text-sm font-extrabold text-[#6366F1]">
                                {reward.pointsRequired.toLocaleString("en-IN")} pts
                              </p>
                            </div>

                            <button
                              onClick={() => handleClaim(reward)}
                              disabled={isRedeeming || insufficientPoints}
                              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm ${
                                isRedeeming
                                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                  : insufficientPoints
                                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                    : "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white hover:from-indigo-600 hover:to-purple-600 shadow-indigo-500/20"
                              }`}
                            >
                              {isRedeeming ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />
                                  Claiming...
                                </>
                              ) : insufficientPoints ? (
                                "Need More Points"
                              ) : (
                                <>
                                  <Sparkles size={14} />
                                  Redeem Now
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </section>
              )}

              {filteredRewards.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Gift size={36} className="mb-2 text-slate-300" />
                  <p className="text-xs font-bold text-[#1E293B]">No rewards in this category</p>
                  <p className="mt-0.5 text-[11px] text-[#64748B]">Try selecting a different filter.</p>
                </div>
              )}
            </>
          ) : (
            /* My Claims & Vouchers Tab */
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#1E293B]">Redeemed Rewards & Voucher Status</h3>
                <p className="mt-0.5 text-xs text-[#64748B]">
                  Check admin approval and generate secure voucher codes for approved redemptions
                </p>

                <div className="mt-5 space-y-3">
                  {myClaims.length === 0 ? (
                    <div className="py-12 text-center">
                      <Ticket size={32} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-bold text-[#1E293B]">No redemptions yet</p>
                      <p className="mt-0.5 text-[11px] text-[#64748B]">
                        Claim your favorite items in the Browse Catalog tab.
                      </p>
                    </div>
                  ) : (
                    myClaims.map((claim) => {
                      const redemption = myRedemptions.find((r) => r.userRewardId === claim.id);
                      const isGenerating = generatingCodeId === claim.id;

                      return (
                        <div
                          key={claim.id}
                          className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200/80 bg-[#F8FAFC] p-4 sm:flex-row sm:items-center"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-[#1E293B]">{claim.rewardName}</h4>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  claim.status === "approved"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : claim.status === "rejected"
                                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {claim.status === "approved"
                                  ? "Approved"
                                  : claim.status === "rejected"
                                    ? "Rejected"
                                    : "Pending Approval"}
                              </span>
                            </div>
                            <p className="text-xs text-[#64748B]">
                              Points: <span className="font-semibold text-[#1E293B]">{claim.pointsSpent} pts</span> •{" "}
                              Claimed:{" "}
                              {new Date(claim.redeemedAt).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>

                          <div>
                            {redemption ? (
                              <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 shadow-sm">
                                <div>
                                  <p className="text-[10px] font-semibold text-slate-400">VOUCHER CODE</p>
                                  <p className="font-mono text-xs font-bold text-[#6366F1]">
                                    {redemption.redemptionCode}
                                  </p>
                                </div>
                                <button
                                  onClick={() => copyToClipboard(redemption.redemptionCode)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                  title="Copy Code"
                                >
                                  <Copy size={14} />
                                </button>
                              </div>
                            ) : claim.status === "approved" ? (
                              <button
                                onClick={() => handleGenerateVoucher(claim.id)}
                                disabled={isGenerating}
                                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50"
                              >
                                {isGenerating ? (
                                  <>
                                    <Loader2 size={13} className="animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Ticket size={13} />
                                    Generate Voucher
                                  </>
                                )}
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold">
                                <Clock size={14} />
                                <span>Awaiting admin review</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          <footer className="pb-2 text-center text-xs text-[#64748B]">
            © 2026 Loyalty+ SaaS Platform. All rights reserved.
          </footer>
        </main>
      </div>
    </div>
  );
}

export default MyRewards;
