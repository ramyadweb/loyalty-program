import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Gift,
  KeyRound,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { authApi } from "../../services/api";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Reset token is missing from the link. Please request a new password reset email.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError("Password must contain at least one uppercase letter (A-Z).");
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setError("Password must contain at least one lowercase letter (a-z).");
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError("Password must contain at least one number (0-9).");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        token,
        newPassword,
        confirmPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2500);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
      };
      setError(
        axiosError.response?.data?.message ||
          "Failed to reset password. The link may have expired or is invalid."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl min-h-[540px] grid lg:grid-cols-2 overflow-hidden rounded-3xl bg-white border border-slate-200/80 shadow-[0_20px_70px_rgba(17,24,39,0.08)]">
        {/* Left Section - Branding */}
        <section className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#111827] p-9 text-white">
          <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[radial-gradient(circle,#6366F1_0%,#8B5CF6_45%,transparent_70%)] opacity-35 blur-[80px]" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,#4F46E5_0%,transparent_70%)] opacity-30 blur-[70px]" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-white shadow-lg shadow-indigo-500/25">
              <Gift size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-wide text-white">
                LOYALTY<span className="text-[#8B5CF6]">+</span>
              </h1>
              <p className="text-[9px] font-semibold tracking-widest text-indigo-400 uppercase">
                Account Security
              </p>
            </div>
          </div>

          <div className="relative z-10 my-auto py-4">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1">
              <Sparkles size={13} className="text-indigo-400" />
              <span className="text-[10px] font-bold tracking-wider text-indigo-300 uppercase">
                Credential Update
              </span>
            </div>

            <h2 className="text-3xl font-extrabold leading-snug tracking-tight">
              Create a Strong
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
                New Password.
              </span>
            </h2>

            <p className="mt-4 max-w-sm text-xs leading-6 text-slate-300">
              Choose a strong, unique password to safeguard your points balance, transactions, and reward redemption vouchers.
            </p>

            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-md">
              <ShieldCheck size={22} className="mb-2 text-[#8B5CF6]" />
              <h3 className="text-xs font-bold text-white">Cryptographically Protected</h3>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Passwords are salted and securely hashed using bcrypt prior to database storage.
              </p>
            </div>
          </div>

          <p className="relative z-10 border-t border-slate-800 pt-3 text-[10px] text-slate-400">
            © 2026 Loyalty+ SaaS. All rights reserved.
          </p>
        </section>

        {/* Right Section - Reset Form */}
        <section className="flex items-center justify-center px-7 py-10 sm:px-11">
          <div className="w-full max-w-md">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-[#6366F1] border border-indigo-100">
              <KeyRound size={22} />
            </div>

            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6366F1]">
              Set New Credentials
            </p>

            <h2 className="text-2xl font-bold tracking-tight text-[#1E293B]">
              Reset Your Password
            </h2>

            <p className="mt-2 text-xs leading-5 text-[#64748B]">
              Enter and confirm your new password below.
            </p>

            {!token ? (
              /* Missing Token Alert */
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <h3 className="text-xs font-bold text-amber-900">
                      Missing or Invalid Reset Link
                    </h3>
                    <p className="mt-1 text-xs text-amber-700">
                      No security token was detected in the URL. Please click the reset link directly from your email or request a new one.
                    </p>
                  </div>
                </div>

                <Link
                  to="/forgot-password"
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] py-3 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-600 hover:to-purple-600"
                >
                  <ArrowLeft size={14} /> Request New Reset Link
                </Link>
              </div>
            ) : success ? (
              /* Success Banner */
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-3">
                  <CheckCircle size={26} />
                </div>
                <h3 className="text-sm font-bold text-emerald-900">
                  Password Reset Successfully!
                </h3>
                <p className="mt-1 text-xs text-emerald-700">
                  Your credentials have been updated in PostgreSQL. Redirecting you to sign in...
                </p>
                <div className="mt-4 flex justify-center">
                  <Loader2 size={18} className="animate-spin text-emerald-600" />
                </div>
              </div>
            ) : (
              /* Reset Password Form */
              <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3">
                    <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
                    <p className="text-xs text-rose-700">{error}</p>
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label
                    htmlFor="newPassword"
                    className="mb-1.5 block text-xs font-semibold text-[#1E293B]"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <LockKeyhole
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="Minimum 8 characters"
                      className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2.5 pl-10 pr-10 text-xs text-[#1E293B] outline-none transition focus:border-[#6366F1] focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label="Toggle password visibility"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-1.5 block text-xs font-semibold text-[#1E293B]"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <LockKeyhole
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="Re-enter your new password"
                      className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2.5 pl-10 pr-10 text-xs text-[#1E293B] outline-none transition focus:border-[#6366F1] focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements Checklist */}
                <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3 text-[11px] text-[#64748B] space-y-1">
                  <p className="font-semibold text-slate-700 mb-1">Password requirements:</p>
                  <p className={newPassword.length >= 8 ? "text-emerald-600 font-medium" : ""}>
                    • At least 8 characters
                  </p>
                  <p className={/[A-Z]/.test(newPassword) ? "text-emerald-600 font-medium" : ""}>
                    • At least one uppercase letter (A-Z)
                  </p>
                  <p className={/[a-z]/.test(newPassword) ? "text-emerald-600 font-medium" : ""}>
                    • At least one lowercase letter (a-z)
                  </p>
                  <p className={/[0-9]/.test(newPassword) ? "text-emerald-600 font-medium" : ""}>
                    • At least one number (0-9)
                  </p>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] transition hover:text-[#1E293B]"
                  >
                    <ArrowLeft size={13} /> Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default ResetPassword;

