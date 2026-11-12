import { useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, ClipboardEvent } from "react";
import {
  Gift,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  LockKeyhole,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle,
  KeyRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../services/api";
import type { AuthUser } from "../../context/AuthContext";

function VerifyOTP() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Password reset step (when resetToken is returned)
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const email = sessionStorage.getItem("otp_email") ?? "";

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const updatedOTP = [...otp];
    updatedOTP[index] = value.slice(-1);
    setOtp(updatedOTP);
    setError("");
    setMessage("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasted) return;

    const updatedOTP = [...otp];
    pasted.split("").forEach((digit, index) => {
      updatedOTP[index] = digit;
    });

    setOtp(updatedOTP);
    setError("");
    setMessage("");
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const enteredOTP = otp.join("");
    if (enteredOTP.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authApi.verifyOtp({ email, otp: enteredOTP });
      const data = response.data as {
        user?: AuthUser;
        token?: string;
        resetToken?: string;
      };

      if (data.resetToken) {
        setResetToken(data.resetToken);
        setMessage("OTP verified! Please create a new password.");
      } else if (data.user && data.token) {
        login({ ...data.user, token: data.token }, false);
        sessionStorage.removeItem("otp_email");

        if (data.user.role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate("/user/dashboard", { replace: true });
        }
      } else {
        setMessage("Verification complete. You may now sign in.");
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      }
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
      };
      setError(
        axiosError.response?.data?.message ??
          "Invalid or expired OTP. Please try again."
      );
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!resetToken) {
      setError("Reset session expired. Please verify OTP again.");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        email,
        otp: otp.join(""),
        newPassword,
        confirmPassword,
        resetToken,
      } as any);

      setResetSuccess(true);
      sessionStorage.removeItem("otp_email");
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
      };
      setError(
        axiosError.response?.data?.message ??
          "Failed to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Session expired. Please log in again.");
      return;
    }

    setResending(true);
    setError("");
    setMessage("");

    try {
      await authApi.sendOtp(email);
      setOtp(["", "", "", "", "", ""]);
      setMessage("A new OTP has been sent to your registered email.");
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
      };
      setError(
        axiosError.response?.data?.message ??
          "Failed to resend OTP. Please try again."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl min-h-[540px] grid lg:grid-cols-2 overflow-hidden rounded-3xl bg-white border border-slate-200/80 shadow-[0_20px_70px_rgba(17,24,39,0.08)]">

        {/* LEFT BRANDING SECTION */}
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
                Two-Factor Security
              </p>
            </div>
          </div>

          <div className="relative z-10 my-auto py-4">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1">
              <Sparkles size={13} className="text-indigo-400" />
              <span className="text-[10px] font-bold tracking-wider text-indigo-300 uppercase">
                Instant Verification
              </span>
            </div>

            <h2 className="text-3xl font-extrabold leading-snug tracking-tight">
              One Last Step.
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
                Confirm Identity.
              </span>
            </h2>

            <p className="mt-4 max-w-sm text-xs leading-6 text-slate-300">
              A temporary security code has been generated to verify your credentials and protect your points balance.
            </p>

            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <LockKeyhole size={20} className="text-[#8B5CF6]" />
                <div>
                  <h3 className="text-xs font-bold text-white">Time-based One Time Password</h3>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Never share this code with anyone.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="relative z-10 border-t border-slate-800 pt-3 text-[10px] text-slate-400">
            © 2026 Loyalty+ SaaS. All rights reserved.
          </p>
        </section>

        {/* RIGHT SECTION */}
        <section className="flex items-center justify-center px-7 py-10 sm:px-11">
          <div className="w-full max-w-md">

            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-[#6366F1] border border-indigo-100">
              {resetToken ? <KeyRound size={22} /> : <ShieldCheck size={22} />}
            </div>

            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6366F1]">
              {resetToken ? "Create Password" : "Verification Code"}
            </p>

            <h2 className="text-2xl font-bold tracking-tight text-[#1E293B]">
              {resetToken ? "Set New Password" : "Enter 6-Digit OTP"}
            </h2>

            <p className="mt-2 text-xs leading-5 text-[#64748B]">
              {resetToken ? (
                "Please choose a strong new password for your account."
              ) : (
                <>
                  We sent a 6-digit verification code to{" "}
                  <strong className="text-slate-800 font-semibold">
                    {email ? email : "your registered email"}
                  </strong>
                  .
                </>
              )}
            </p>

            {/* Error Message */}
            {error && (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
                <p className="text-xs text-rose-700">{error}</p>
              </div>
            )}

            {/* Info Message */}
            {message && !error && (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                <p className="text-xs text-emerald-700">{message}</p>
              </div>
            )}

            {resetSuccess ? (
              <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center">
                <CheckCircle size={32} className="mx-auto text-emerald-600 mb-2" />
                <h3 className="text-sm font-bold text-emerald-900">Password Reset Successful</h3>
                <p className="mt-1 text-xs text-emerald-700">
                  Redirecting to login portal in a moment...
                </p>
              </div>
            ) : resetToken ? (
              /* Set New Password Form */
              <form onSubmit={handlePasswordResetSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters (uppercase, lowercase, number)"
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2.5 text-xs text-[#1E293B] outline-none focus:border-[#6366F1] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2.5 text-xs text-[#1E293B] outline-none focus:border-[#6366F1] focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Saving Password...
                    </>
                  ) : (
                    <>
                      Update Password
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Enter OTP Form */
              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                <div className="flex justify-between gap-2 sm:gap-2.5">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(e.target.value, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      onPaste={handlePaste}
                      className="h-12 w-11 sm:h-13 sm:w-12 rounded-xl border border-slate-200 bg-[#F8FAFC] text-center text-lg font-extrabold text-[#1E293B] outline-none transition focus:border-[#6366F1] focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Confirm & Sign In
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 font-semibold text-slate-500 transition hover:text-[#1E293B]"
                  >
                    <ArrowLeft size={14} /> Back to Sign In
                  </Link>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="flex items-center gap-1.5 font-bold text-[#6366F1] transition hover:underline disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={resending ? "animate-spin" : ""} />
                    Resend Code
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default VerifyOTP;
