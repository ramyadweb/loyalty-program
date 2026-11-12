import { useState } from "react";
import type { FormEvent } from "react";
import {
  Gift,
  User,
  Mail,
  Phone,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../services/api";

function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    if (error) setError("");
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Full name is required.";
    if (!formData.email.trim()) errors.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = "Please enter a valid email address.";
    if (!formData.phone.trim()) errors.phone = "Phone number is required.";
    if (formData.password.length < 8)
      errors.password = "Password must be at least 8 characters.";
    if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = "Passwords do not match.";
    return errors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the Terms and Conditions to continue.");
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login", { replace: true }), 3000);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string }; status?: number };
      };
      setError(
        axiosError.response?.data?.message ??
        (axiosError.response?.status === 409
          ? "An account with this email already exists."
          : "Registration failed. Please try again later.")
      );
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "w-full rounded-xl border bg-[#F8FAFC] py-2.5 pl-10 pr-4 text-xs text-[#1E293B] outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4";

  const inputClass = (field: string) =>
    fieldErrors[field]
      ? `${inputBase} border-rose-300 focus:border-rose-400 focus:ring-rose-100`
      : `${inputBase} border-slate-200 focus:border-[#6366F1] focus:ring-indigo-500/10`;

  const iconClass = "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400";

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle size={34} />
          </div>
          <h2 className="text-2xl font-bold text-[#1E293B]">
            Registration Submitted!
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#64748B]">
            Your account has been created and submitted for administrator review. You
            will be redirected to the sign-in page shortly.
          </p>
          <div className="mt-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-600 hover:to-purple-600"
            >
              Go to Sign In
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-[#F8FAFC] flex items-center justify-center p-3">
      <div className="w-full max-w-5xl h-full max-h-[740px] grid lg:grid-cols-2 bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-[0_20px_70px_rgba(17,24,39,0.08)]">

        {/* LEFT BRANDING SECTION */}
        <section className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#111827] p-8 xl:p-9 text-white">
          <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[radial-gradient(circle,#6366F1_0%,#8B5CF6_45%,transparent_70%)] opacity-35 blur-[80px]" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,#4F46E5_0%,transparent_70%)] opacity-30 blur-[70px]" />

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-white shadow-lg shadow-indigo-500/25">
              <Gift size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-wide text-white">
                LOYALTY<span className="text-[#8B5CF6]">+</span>
              </h1>
              <p className="text-[9px] font-semibold tracking-widest text-indigo-400 uppercase">
                Enterprise Rewards
              </p>
            </div>
          </div>

          {/* Branding Content */}
          <div className="relative z-10 my-auto py-4 max-w-sm">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1">
              <Sparkles size={13} className="text-indigo-400" />
              <span className="text-[10px] font-bold tracking-wider text-indigo-300 uppercase">
                Exclusive Member Benefits
              </span>
            </div>

            <h2 className="text-2xl xl:text-3xl font-extrabold leading-snug tracking-tight">
              Unlock More Value.
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
                Earn Effortlessly.
              </span>
            </h2>

            <p className="mt-3.5 text-xs leading-6 text-slate-300">
              Create your corporate or member account to access instant reward redemptions, real-time points accrual, and dedicated assistance.
            </p>

            {/* Benefits */}
            <div className="mt-6 space-y-2.5">
              {[
                "Earn rewards on every transaction",
                "Bank-grade SSL data encryption",
                "Instant voucher and merchandise redemption",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="shrink-0 text-[#8B5CF6]" />
                  <span className="text-xs text-slate-300">{item}</span>
                </div>
              ))}
            </div>

            {/* Security Note */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-3.5 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Security First</p>
                  <p className="text-[11px] text-slate-400">
                    Two-factor OTP confirmation on sensitive actions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 border-t border-slate-800 pt-3 text-[10px] text-slate-400">
            <p>© 2026 Loyalty+ SaaS. All rights reserved.</p>
          </div>
        </section>

        {/* RIGHT REGISTRATION SECTION */}
        <section className="flex items-center justify-center px-6 py-4 sm:px-8 lg:px-9 overflow-y-auto">
          <div className="w-full max-w-md py-2">

            {/* Heading */}
            <div className="mb-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6366F1]">
                Quick Registration
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-[#1E293B]">
                Create your account
              </h2>
              <p className="mt-1 text-xs text-[#64748B]">
                Enter your details to initiate registration.
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
                <p className="text-xs text-rose-700">{error}</p>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-3" noValidate>

              {/* Full Name */}
              <div>
                <label htmlFor="name" className="mb-1 block text-xs font-semibold text-[#1E293B]">
                  Full Name
                </label>
                <div className="relative">
                  <User size={15} className={iconClass} />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="e.g. Alex Morgan"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    autoComplete="name"
                    className={inputClass("name")}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-1 block text-xs font-semibold text-[#1E293B]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className={iconClass} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    className={inputClass("email")}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="mb-1 block text-xs font-semibold text-[#1E293B]">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone size={15} className={iconClass} />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="e.g. +1 555 123 4567"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    autoComplete="tel"
                    className={inputClass("phone")}
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.phone}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="mb-1 block text-xs font-semibold text-[#1E293B]">
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole size={15} className={iconClass} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className={`${inputClass("password")} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1E293B]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="mb-1 block text-xs font-semibold text-[#1E293B]">
                  Confirm Password
                </label>
                <div className="relative">
                  <LockKeyhole size={15} className={iconClass} />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className={`${inputClass("confirmPassword")} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1E293B]"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {/* Terms */}
              <label className="flex cursor-pointer items-start gap-2 py-1">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-slate-300 accent-[#6366F1]"
                />
                <span className="text-[11px] leading-4 text-[#64748B]">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => alert("Terms: Users agree to program rules, point validity windows, and standard corporate usage policies.")}
                    className="font-semibold text-[#6366F1] hover:underline"
                  >
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    onClick={() => alert("Privacy: Member contact information and transaction logs are stored with end-to-end encryption.")}
                    className="font-semibold text-[#6366F1] hover:underline"
                  >
                    Privacy Policy
                  </button>
                  .
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-600 hover:to-purple-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight
                      size={15}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-3.5 border-t border-slate-100 pt-3 text-center">
              <p className="text-xs text-[#64748B]">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-bold text-[#6366F1] transition hover:text-[#4F46E5]"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Register;
