import { useState, useEffect } from "react";
import {
  X,
  Send,
  Users,
  User,
  CheckSquare,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import {
  notificationsService,
  adminService,
  type AdminUserItem,
  type CreateNotificationPayload,
} from "../services/api";

interface CreateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export type RecipientMode = "all" | "individual" | "multiple";
export type NotificationTypeOption = "general" | "reward" | "points" | "announcement" | "important";

export default function CreateNotificationModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateNotificationModalProps) {
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notificationType, setNotificationType] = useState<NotificationTypeOption>("general");

  // User selection states
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Form submission states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch users when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingUsers(true);
    adminService
      .getAllUsers({ limit: 100 })
      .then((res) => {
        if (isMounted && res.data?.data) {
          setUsersList(res.data.data);
          if (res.data.data.length > 0 && selectedUserId === "") {
            setSelectedUserId(res.data.data[0].id);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load users for notification:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingUsers(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Reset form when modal closes
  const handleClose = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setTitle("");
    setMessage("");
    setNotificationType("general");
    setSelectedUserIds([]);
    setRecipientMode("all");
    onClose();
  };

  const handleToggleSelectUser = (id: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = (filteredIds: number[]) => {
    const allSelected = filteredIds.every((id) => selectedUserIds.includes(id));
    if (allSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validation
    if (!title.trim()) {
      setErrorMsg("Please enter a notification title.");
      return;
    }
    if (!message.trim()) {
      setErrorMsg("Please enter a notification message.");
      return;
    }

    if (recipientMode === "individual" && !selectedUserId) {
      setErrorMsg("Please select a recipient user.");
      return;
    }

    if (recipientMode === "multiple" && selectedUserIds.length === 0) {
      setErrorMsg("Please select at least one recipient user.");
      return;
    }

    const payload: CreateNotificationPayload = {
      recipientType: recipientMode,
      title: title.trim(),
      message: message.trim(),
      type: notificationType,
    };

    if (recipientMode === "individual") {
      payload.userId = Number(selectedUserId);
    } else if (recipientMode === "multiple") {
      payload.userIds = selectedUserIds;
    }

    setSubmitting(true);
    try {
      const res = await notificationsService.createNotification(payload);
      const feedback = res.data?.message || "Notification sent successfully!";
      setSuccessMsg(feedback);

      setTimeout(() => {
        if (onSuccess) onSuccess();
        handleClose();
      }, 1200);
    } catch (err: any) {
      const apiError =
        err.response?.data?.message ||
        err.response?.data?.errors?.recipientType?.[0] ||
        "Failed to send notification. Please try again.";
      setErrorMsg(apiError);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-white shadow-md shadow-indigo-500/20">
              <Send size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">Create Notification</h2>
              <p className="text-xs text-[#64748B]">
                Broadcast announcements or notify specific members
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto px-6 py-5 space-y-5">
          {/* Status Banners */}
          {errorMsg && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 animate-in fade-in">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Recipient Selection Segmented Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
              Select Recipient <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setRecipientMode("all")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
                  recipientMode === "all"
                    ? "bg-white text-[#6366F1] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users size={14} />
                <span>All Users</span>
              </button>

              <button
                type="button"
                onClick={() => setRecipientMode("individual")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
                  recipientMode === "individual"
                    ? "bg-white text-[#6366F1] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <User size={14} />
                <span>Individual User</span>
              </button>

              <button
                type="button"
                onClick={() => setRecipientMode("multiple")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
                  recipientMode === "multiple"
                    ? "bg-white text-[#6366F1] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CheckSquare size={14} />
                <span>Multiple Users</span>
              </button>
            </div>
          </div>

          {/* Conditional Recipient Pickers */}
          {recipientMode === "all" && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5 text-xs text-indigo-900 flex items-start gap-2.5">
              <Sparkles size={16} className="text-[#6366F1] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Broadcast to All Registered Members</p>
                <p className="text-indigo-700/80 text-[11px] mt-0.5">
                  This will generate and deliver a system notification to all approved users registered on the platform.
                </p>
              </div>
            </div>
          )}

          {recipientMode === "individual" && (
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">
                Choose User <span className="text-rose-500">*</span>
              </label>
              {loadingUsers ? (
                <div className="flex items-center gap-2 py-3 text-xs text-slate-500">
                  <Loader2 size={14} className="animate-spin text-[#6366F1]" />
                  Loading registered users...
                </div>
              ) : (
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-[#1E293B] focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 outline-none transition"
                >
                  <option value="" disabled>
                    -- Select a user --
                  </option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) - {u.status}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {recipientMode === "multiple" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#1E293B]">
                  Select Recipients ({selectedUserIds.length} selected)
                </label>
                {filteredUsers.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectAllFiltered(filteredUsers.map((u) => u.id))
                    }
                    className="text-[11px] font-bold text-[#6366F1] hover:underline"
                  >
                    {filteredUsers.every((u) => selectedUserIds.includes(u.id))
                      ? "Deselect All"
                      : "Select All Filtered"}
                  </button>
                )}
              </div>

              {/* Search filter for user list */}
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5">
                <Search size={14} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-[#1E293B] outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Scrollable Checkbox List */}
              <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white p-1">
                {filteredUsers.length === 0 ? (
                  <p className="p-3 text-center text-xs text-slate-400">
                    No users match your search.
                  </p>
                ) : (
                  filteredUsers.map((u) => {
                    const isChecked = selectedUserIds.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg text-xs transition ${
                          isChecked ? "bg-indigo-50/70" : "hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectUser(u.id)}
                          className="h-4 w-4 rounded border-slate-300 text-[#6366F1] focus:ring-[#6366F1]"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#1E293B] truncate">{u.name}</p>
                          <p className="text-[11px] text-[#64748B] truncate">{u.email}</p>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 capitalize">
                          {u.status}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Notification Title */}
          <div>
            <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">
              Notification Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Welcome Bonus or System Maintenance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-[#1E293B] placeholder:text-slate-400 focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 outline-none transition"
            />
          </div>

          {/* Notification Type */}
          <div>
            <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">
              Notification Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={notificationType}
              onChange={(e) => setNotificationType(e.target.value as NotificationTypeOption)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-[#1E293B] focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 outline-none transition"
            >
              <option value="general">General Notification</option>
              <option value="reward">Reward Alert</option>
              <option value="points">Points Credit / Adjustment</option>
              <option value="announcement">Platform Announcement</option>
              <option value="important">Important / Critical Alert</option>
            </select>
          </div>

          {/* Notification Message */}
          <div>
            <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">
              Notification Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Congratulations! You have received 100 bonus loyalty points."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-[#1E293B] placeholder:text-slate-400 focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 outline-none transition resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-600 hover:to-purple-600 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Send Notification
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

