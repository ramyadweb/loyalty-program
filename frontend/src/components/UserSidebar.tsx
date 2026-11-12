import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Gift,
  History,
  Ticket,
  LogOut,
  X,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";
import ConfirmDialog from "./ConfirmDialog";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/user/dashboard" },
  { label: "My Rewards", icon: Gift, path: "/user/my-rewards" },
  { label: "Transactions", icon: History, path: "/user/transaction" },
  { label: "Raise Ticket", icon: Ticket, path: "/user/raise-ticket" },
];

interface UserSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserSidebar({ isOpen, onClose }: UserSidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // client logout proceeds
    } finally {
      logout();
      navigate("/login", { replace: true });
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar overlay"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#111827] text-white border-r border-slate-800/80 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex h-20 items-center gap-3 border-b border-slate-800/80 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-white shadow-lg shadow-indigo-500/20 transition-transform duration-200 hover:scale-105">
            <Gift size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wide text-white">
              LOYALTY<span className="text-[#8B5CF6]">+</span>
            </h1>
            <p className="text-[9px] font-semibold tracking-widest text-indigo-400 uppercase">
              Member Rewards
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="px-6 pb-2 pt-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            My Account
          </p>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={onClose}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-500/25 to-purple-500/15 text-white border-l-4 border-[#6366F1] font-semibold shadow-sm"
                    : "text-slate-400 hover:bg-slate-800/70 hover:text-white hover:translate-x-1"
                }`}
              >
                <Icon
                  size={18}
                  className={`transition-colors duration-200 ${
                    isActive ? "text-[#6366F1]" : "text-slate-400 group-hover:text-indigo-400"
                  }`}
                />
                <span className="transition-colors">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Member points pill card */}
        <div className="mx-3 my-2 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-purple-950/40 p-4 border border-indigo-500/20 transition-all duration-300 hover:border-indigo-500/40">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
            <Sparkles size={14} />
            <span>Tier Status</span>
          </div>
          <p className="mt-1 text-sm font-bold text-white">Platinum Member</p>
          <p className="mt-0.5 text-[11px] text-slate-400">2x points multiplier active</p>
        </div>

        {/* User profile + logout */}
        <div className="border-t border-slate-800/80 p-4">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-xs font-bold text-white shadow-md">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">
                {user?.name ?? "Member"}
              </p>
              <p className="text-[10px] text-slate-400">Active Account</p>
            </div>
          </div>

          <button
            onClick={() => setShowLogoutDialog(true)}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-rose-400 transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-300 active:scale-95"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      <ConfirmDialog
        isOpen={showLogoutDialog}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        confirmLabel="Sign Out"
        cancelLabel="Stay"
        variant="warning"
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutDialog(false)}
      />
    </>
  );
}
