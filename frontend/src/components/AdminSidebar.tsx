import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  UserCheck,
  Ticket,
  ClipboardList,
  LogOut,
  Gift,
  X,
  Settings,
  Shield,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authApi, adminService } from "../services/api";
import ConfirmDialog from "./ConfirmDialog";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "User Approval", icon: UserCheck, path: "/admin/user-approval" },
  { label: "Redemption Requests", icon: Gift, path: "/admin/redemptions" },
  { label: "Manage Tickets", icon: Ticket, path: "/admin/manage-tickets" },
  { label: "User Audit", icon: ClipboardList, path: "/admin/user-audit" },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  pendingCount?: number;
}

export default function AdminSidebar({
  isOpen,
  onClose,
  pendingCount,
}: AdminSidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [livePendingCount, setLivePendingCount] = useState<number>(pendingCount ?? 0);

  useEffect(() => {
    if (pendingCount !== undefined) {
      setLivePendingCount(pendingCount);
    } else {
      adminService
        .getPendingUsers()
        .then((res) => {
          if (res.data?.data) {
            setLivePendingCount(res.data.data.length);
          }
        })
        .catch(() => {});
    }
  }, [pendingCount]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // client logout proceeds regardless
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
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#111827] text-white border-r border-slate-800/80 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center gap-3 border-b border-slate-800/80 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-white shadow-lg shadow-indigo-500/20">
            <Gift size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black tracking-wide text-white">
              LOYALTY<span className="text-[#8B5CF6]">+</span>
            </h1>
            <p className="text-[9px] font-semibold tracking-widest text-indigo-400/90 uppercase">
              Admin Portal
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="px-6 pb-2 pt-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Administration
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
                className={`group flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-white border-l-4 border-[#6366F1] shadow-sm font-semibold"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className={`transition-colors ${
                      isActive
                        ? "text-[#6366F1]"
                        : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.label === "User Approval" && livePendingCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-1.5 text-[10px] font-bold text-white shadow-sm">
                    {livePendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin profile & logout */}
        <div className="border-t border-slate-800/80 p-4">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-xs font-bold text-white shadow-md">
              <Shield size={16} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">
                {user?.name || "System Admin"}
              </p>
              <p className="text-[10px] text-indigo-400">Administrator</p>
            </div>
          </div>

          <div className="mt-2 space-y-1">
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white">
              <Settings size={15} />
              Platform Settings
            </button>
            <button
              onClick={() => setShowLogoutDialog(true)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <ConfirmDialog
        isOpen={showLogoutDialog}
        title="Sign Out"
        message="Are you sure you want to end your administrative session?"
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
