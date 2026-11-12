import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Gift,
  Sparkles,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Award,
  CheckCircle2,
  Loader2,
  AlertCircle,
  User,
  Shield,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../services/api";
import type { AuthUser } from "../../context/AuthContext";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<"user" | "admin">("user");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const response =
        selectedRole === "admin"
          ? await authApi.adminLogin({ email: email.trim(), password })
          : await authApi.userLogin({ email: email.trim(), password });
      const data = response.data as {
        user: AuthUser;
        token: string;
        requiresOtp?: boolean;
      };

      if (data.requiresOtp) {
        sessionStorage.setItem("otp_email", email.trim());
        navigate("/verify-otp", { replace: true });
        return;
      }

      // Verify the authenticated account's actual role matches the selected role
      if (data.user.role !== selectedRole) {
        setError(
          selectedRole === "admin"
            ? "Access denied: This account does not have administrator privileges."
            : "Account mismatch: This is an administrator account. Please select 'Admin' to sign in."
        );
        return;
      }

      login({ ...data.user, token: data.token }, rememberMe);

      if (data.user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/user/dashboard", { replace: true });
      }
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      const message =
        axiosError.response?.data?.message ??
        (axiosError.response?.status === 401
          ? "Invalid email or password. Please try again."
          : axiosError.response?.status === 403
            ? "Your account is pending approval. Please wait for admin approval."
            : "Unable to connect to the server. Please try again later.");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
        <main className="min-h-screen w-full bg-[#F8FAFC] flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="relative grid w-full max-w-md sm:max-w-lg md:max-w-4xl lg:max-w-5xl xl:max-w-[1240px] overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-[0_20px_70px_rgba(17,24,39,0.08)] md:grid-cols-2">

            {/* LEFT BRANDING PANEL */}
              <section className="relative flex flex-col justify-between overflow-hidden bg-[#111827] text-white p-5 sm:p-6 md:p-7 lg:p-9 xl:p-11">

                {/* Fintech Indigo-Purple gradient glow */}
                <div className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,#6366F1_0%,#8B5CF6_45%,transparent_70%)] opacity-35 blur-[90px]" />
                <div className="pointer-events-none absolute -left-20 bottom-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,#4F46E5_0%,transparent_70%)] opacity-30 blur-[70px]" />

                {/* Decorative geometric curves */}
                <div className="pointer-events-none absolute -right-24 -top-20 h-[420px] w-[420px] rounded-full border border-white/5 hidden sm:block" />
                <div className="pointer-events-none absolute -right-12 -top-8 h-[320px] w-[320px] rounded-full border border-white/5 hidden sm:block" />

                {/* Logo */}
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="flex h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-white shadow-lg shadow-indigo-500/30">
                        <Gift className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.2} />
                      </div>

                      <div>
                          <h1 className="text-lg sm:text-xl font-black tracking-wide leading-none">
                            LOYALTY<span className="text-[#8B5CF6]">+</span>
                          </h1>
                            <p className="text-[9px] sm:text-[10px] font-semibold tracking-[0.25em] text-indigo-300 mt-1">
                              FINTECH REWARDS
                            </p>
                          </div>
                      </div>

                      {/* Left content */}
                          <div className="relative z-10 my-3 sm:my-4 md:my-5 lg:my-6">
                            <div className="mb-2.5 sm:mb-3 hidden sm:inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[11px] lg:text-xs font-semibold tracking-wide text-indigo-300">
                              <Sparkles size={14} />
                              INTELLIGENT REWARDS PLATFORM
                            </div>

                              <h2 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl font-extrabold leading-[1.2] tracking-tight">
                                Smart Points.{" "}
                                <span className="hidden sm:inline">
                                  <br />
                                  Seamless Benefits.
                                  <br />
                                </span>
                                <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
                                  Pure Loyalty.
                                </span>
                              </h2>

                                <p className="mt-2 md:mt-3 lg:mt-4 text-xs sm:text-sm leading-relaxed text-slate-300 max-w-md hidden sm:block">
                                  The modern enterprise loyalty dashboard built for real-time points tracking, automated tier perks, and instant redemptions.
                                </p>

                                {/* Feature cards */}
                                      <div className="mt-4 lg:mt-6 space-y-2.5 hidden md:block">
                                        <div className="flex items-center gap-3 rounded-xl lg:rounded-2xl border border-white/10 bg-white/[0.05] p-2.5 lg:p-3.5 backdrop-blur-md">
                                          <div className="flex h-9 w-9 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-lg lg:rounded-xl bg-indigo-500/20 text-indigo-400">
                                            <Award size={20} />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <h3 className="text-xs lg:text-sm font-bold text-white truncate">Tier Rewards & Multipliers</h3>
                                            <p className="text-[11px] lg:text-xs text-slate-400 line-clamp-1">Automated points crediting and exclusive member perks.</p>
                                          </div>
                                          <CheckCircle2 className="text-[#8B5CF6] shrink-0" size={16} />
                                        </div>

                                            <div className="flex items-center gap-3 rounded-xl lg:rounded-2xl border border-white/10 bg-white/[0.05] p-2.5 lg:p-3.5 backdrop-blur-md">
                                              <div className="flex h-9 w-9 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-lg lg:rounded-xl bg-purple-500/20 text-purple-400">
                                                <ShieldCheck size={20} />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <h3 className="text-xs lg:text-sm font-bold text-white truncate">Bank-Grade Verification</h3>
                                                <p className="text-[11px] lg:text-xs text-slate-400 line-clamp-1">Protected with 2-factor OTP and token encryption.</p>
                                              </div>
                                              <CheckCircle2 className="text-[#8B5CF6] shrink-0" size={16} />
                                            </div>
                                          </div>
                                        </div>

                                        {/* Footer */}
          <div className="relative z-10 border-t border-slate-800/80 pt-3 text-xs text-slate-400 hidden md:flex items-center justify-between">
            <p>© 2026 Loyalty+ SaaS.</p>
            <div className="flex gap-1 text-indigo-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star}>★</span>
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT LOGIN PANEL */}
        <section className="relative flex items-center justify-center bg-white p-5 sm:p-6 md:p-7 lg:p-9 xl:p-11">
          <div className="w-full max-w-sm sm:max-w-md">

            <p className="mb-1 text-[11px] font-bold tracking-[0.2em] text-[#6366F1] uppercase">
              Secure Authentication
            </p>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-[#1E293B]">
              Sign in to your account
            </h2>

            <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm leading-normal text-[#64748B]">
              Enter your corporate or member credentials to continue.
            </p>

            {/* Role Selection */}
            <div className="mt-3.5 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("user");
                  if (error) setError("");
                }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2 sm:py-2.5 px-3 text-xs font-bold transition-all duration-200 ${
                  selectedRole === "user"
                    ? "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-md shadow-indigo-500/20 border border-transparent"
                    : "bg-[#F8FAFC] text-[#64748B] border border-slate-200 hover:border-slate-300 hover:bg-slate-100 hover:text-[#1E293B]"
                }`}
              >
                <User size={15} className={selectedRole === "user" ? "text-white" : "text-slate-400"} />
                <span>User</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole("admin");
                  if (error) setError("");
                }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2 sm:py-2.5 px-3 text-xs font-bold transition-all duration-200 ${
                  selectedRole === "admin"
                    ? "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-md shadow-indigo-500/20 border border-transparent"
                    : "bg-[#F8FAFC] text-[#64748B] border border-slate-200 hover:border-slate-300 hover:bg-slate-100 hover:text-[#1E293B]"
                }`}
              >
                <Shield size={15} className={selectedRole === "admin" ? "text-white" : "text-slate-400"} />
                <span>Admin</span>
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
                <p className="text-xs sm:text-sm text-rose-700">{error}</p>
              </div>
            )}

            {/* Login form */}
            <form onSubmit={handleSubmit} className="mt-3.5 sm:mt-4 space-y-3 sm:space-y-3.5" noValidate>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#1E293B]"
                >
                  Email Address
                </label>

                <div className="flex items-center rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 transition focus-within:border-[#6366F1] focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10">
                  <Mail size={18} className="shrink-0 text-slate-400" />

                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    required
                    autoComplete="email"
                    className="h-10 sm:h-11 w-full bg-transparent px-2.5 text-xs sm:text-sm text-[#1E293B] outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-[11px] font-bold uppercase tracking-wider text-[#1E293B]"
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-[#6366F1] transition hover:text-[#4F46E5]"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <div className="flex items-center rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 transition focus-within:border-[#6366F1] focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10">
                  <LockKeyhole size={18} className="shrink-0 text-slate-400" />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    required
                    autoComplete="current-password"
                    className="h-10 sm:h-11 w-full bg-transparent px-2.5 text-xs sm:text-sm text-[#1E293B] outline-none placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="shrink-0 text-slate-400 transition hover:text-[#1E293B]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex flex-wrap items-center justify-between gap-1 pt-0.5">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-[#64748B]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 accent-[#6366F1]"
                  />
                  <span>Remember me for 30 days</span>
                </label>

                <span className="text-[11px] font-medium text-slate-400">
                  256-bit SSL
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-11 sm:h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <span>Sign In as {selectedRole === "admin" ? "Admin" : "User"}</span>
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            {/* OTP verification hint */}
            <div className="mt-3.5 flex items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-2.5 sm:p-3">
              <ShieldCheck
                size={16}
                className="mt-0.5 shrink-0 text-[#6366F1]"
              />
              <p className="text-[11px] sm:text-xs leading-relaxed text-[#64748B]">
                Two-step verification is enabled. You may be prompted for a 6-digit one-time code.
              </p>
            </div>

            {/* Register link */}
            <div className="mt-3.5 sm:mt-4 border-t border-slate-100 pt-3 text-center">
              <p className="text-xs text-[#64748B]">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-bold text-[#6366F1] transition hover:text-[#4F46E5]"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Login;
