import { useState } from "react";
import type { FormEvent } from "react";
import {
  Gift,
  Mail,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { authApi } from "../../services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string }; status?: number };
      };
      setError(
        axiosError.response?.data?.message ??
          (axiosError.response?.status === 404
            ? "No account found with this email address."
            : "Unable to process your request. Please try again later.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl min-h-[540px] grid lg:grid-cols-2 overflow-hidden rounded-3xl bg-white border border-slate-200/80 shadow-[0_20px_70px_rgba(17,24,39,0.08)]">

        {/* Left Section */}
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
                Zero Trust Protection
              </span>
            </div>

            <h2 className="text-3xl font-extrabold leading-snug tracking-tight">
              Password Recovery
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
                Made Simple & Safe.
              </span>
            </h2>

            <p className="mt-4 max-w-sm text-xs leading-6 text-slate-300">
              Enter your corporate email address to receive an instant verification link or password reset token.
            </p>

            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-md">
              <ShieldCheck size={22} className="mb-2 text-[#8B5CF6]" />
              <h3 className="text-xs font-bold text-white">Encrypted Reset Links</h3>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Security tokens expire automatically in 15 minutes.
              </p>
            </div>
          </div>

          <p className="relative z-10 border-t border-slate-800 pt-3 text-[10px] text-slate-400">
            © 2026 Loyalty+ SaaS. All rights reserved.
          </p>
        </section>

        {/* Right Section */}
        <section className="flex items-center justify-center px-7 py-10 sm:px-11">
          <div className="w-full max-w-md">

            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-[#6366F1] border border-indigo-100">
              <KeyRound size={22} />
            </div>

            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6366F1]">
              Account Access
            </p>

            <h2 className="text-2xl font-bold tracking-tight text-[#1E293B]">
              Forgot Password?
            </h2>

            <p className="mt-2 text-xs leading-5 text-[#64748B]">
              Enter your registered email address and we'll send you secure instructions to reset your password.
            </p>

            {submitted ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-900">
                      Check your email
                    </h3>
                    <p className="mt-1 text-xs text-emerald-700">
                      Reset instructions have been dispatched to{" "}
                      <strong className="font-semibold">{email}</strong>.
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-emerald-600">
                  Didn't receive it? Please check your spam folder or retry.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setEmail("");
                  }}
                  className="mt-3 text-xs font-bold text-emerald-800 hover:underline"
                >
                  Try a different email →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3">
                    <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
                    <p className="text-xs text-rose-700">{error}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[#1E293B]">
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="name@company.com"
                      required
                      autoComplete="email"
                      className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2.5 pl-10 pr-4 text-xs text-[#1E293B] outline-none transition focus:border-[#6366F1] focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] py-3 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-600 hover:to-purple-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Reset Instructions
                      <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 border-t border-slate-100 pt-5 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#6366F1] hover:text-[#4F46E5]"
              >
                <ArrowLeft size={14} />
                Back to Sign In
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default ForgotPassword;
