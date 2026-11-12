import { AlertTriangle, X, Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const confirmStyles = {
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20",
    warning: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20",
    info: "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-indigo-600 hover:to-purple-600 text-white shadow-indigo-500/25",
  };

  const iconStyles = {
    danger: "bg-rose-50 text-rose-600 border border-rose-200/60",
    warning: "bg-amber-50 text-amber-600 border border-amber-200/60",
    info: "bg-indigo-50 text-indigo-600 border border-indigo-200/60",
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconStyles[variant]}`}>
            <AlertTriangle size={22} />
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-bold text-[#1E293B]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">{message}</p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-[#1E293B] transition hover:bg-slate-50 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold shadow-md transition disabled:opacity-60 ${confirmStyles[variant]}`}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
