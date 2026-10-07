import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Info, Loader2, Search, X } from "lucide-react";

// Small UI kit for the Form Builder. Deliberately plain: white surfaces,
// slate text, the Edeco navy as the single accent.

const cx = (...parts) => parts.filter(Boolean).join(" ");

const BUTTON_VARIANTS = {
  primary: "bg-[#1F2853] text-white hover:bg-[#2a3670] disabled:bg-[#1F2853]/50",
  secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:text-slate-400",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:text-slate-300",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
  "danger-ghost": "text-red-600 hover:bg-red-50 disabled:text-red-300",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300",
};
const BUTTON_SIZES = { sm: "h-8 px-2.5 text-[13px] gap-1.5", md: "h-9 px-3.5 text-sm gap-2", lg: "h-10 px-4 text-sm gap-2" };

export const Button = React.forwardRef(({ variant = "secondary", size = "md", loading = false, icon: Icon, className, children, disabled, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    disabled={disabled || loading}
    className={cx(
      "inline-flex shrink-0 items-center justify-center rounded-sm font-medium transition focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F2853] disabled:cursor-not-allowed",
      BUTTON_VARIANTS[variant],
      BUTTON_SIZES[size],
      className,
    )}
    {...props}
  >
    {loading ? <Loader2 size={15} className="animate-spin" /> : Icon ? <Icon size={size === "sm" ? 14 : 16} /> : null}
    {children}
  </button>
));
Button.displayName = "Button";

export const IconButton = ({ icon: Icon, label, className, size = 16, tone = "default", ...props }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={cx(
      "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm transition focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F2853] disabled:opacity-30",
      tone === "danger" ? "text-slate-400 hover:bg-red-50 hover:text-red-600" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
      className,
    )}
    {...props}
  >
    <Icon size={size} />
  </button>
);

export const fieldClass =
  "w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1F2853] focus:outline-none disabled:bg-slate-50";

export const TextInput = React.forwardRef(({ className, ...props }, ref) => <input ref={ref} className={cx(fieldClass, className)} {...props} />);
TextInput.displayName = "TextInput";

export const TextArea = ({ className, ...props }) => <textarea className={cx(fieldClass, className)} {...props} />;

export const Select = ({ className, children, ...props }) => (
  <select className={cx(fieldClass, "pr-8", className)} {...props}>
    {children}
  </select>
);

export const Toggle = ({ checked, onChange, label, description, disabled }) => (
  <label className={cx("flex cursor-pointer items-start justify-between gap-3", disabled && "cursor-not-allowed opacity-60")}>
    <span className="min-w-0">
      <span className="block text-sm font-medium text-slate-800">{label}</span>
      {description && <span className="mt-0.5 block text-xs text-slate-500">{description}</span>}
    </span>
    <button
      type="button"
      role="switch"
      aria-checked={Boolean(checked)}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx("relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-sm transition", checked ? "bg-[#1F2853]" : "bg-slate-300")}
    >
      <span className={cx("absolute top-0.5 h-4 w-4 rounded-sm bg-white  transition", checked ? "left-[18px]" : "left-0.5")} />
    </button>
  </label>
);

export const FormRow = ({ label, hint, error, children, htmlFor, className }) => (
  <div className={className}>
    {label && (
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-slate-700">
        {label}
      </label>
    )}
    {children}
    {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
  </div>
);

export const SearchInput = ({ value, onChange, placeholder = "Search…", className }) => (
  <div className={cx("relative", className)}>
    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
    <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} className={cx(fieldClass, "pl-9")} />
  </div>
);

const BADGE_TONES = {
  neutral: "bg-slate-100 text-slate-700",
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-800",
  red: "bg-red-50 text-red-700",
  violet: "bg-violet-50 text-violet-700",
  navy: "bg-[#1F2853]/10 text-[#1F2853]",
};

export const Badge = ({ tone = "neutral", children, className, dot = false }) => (
  <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-2 py-0.5 text-[11.5px] font-semibold", BADGE_TONES[tone], className)}>
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    {children}
  </span>
);

const STATUS_TONES = {
  draft: "neutral",
  review: "amber",
  published: "green",
  unpublished: "violet",
  archived: "red",
  new: "blue",
  sample: "neutral",
};
export const StatusBadge = ({ status }) => (
  <Badge tone={STATUS_TONES[status] || "neutral"} dot>
    {String(status || "").replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
  </Badge>
);

export const Spinner = ({ className, size = 20 }) => <Loader2 size={size} className={cx("animate-spin text-[#1F2853]", className)} />;

export const PageLoader = ({ label = "Loading…" }) => (
  <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-slate-500" role="status">
    <Spinner size={26} />
    {label}
  </div>
);

export const Skeleton = ({ className }) => <div className={cx("animate-pulse rounded-sm bg-slate-100", className)} />;

export const EmptyState = ({ icon: Icon, title, description, action, className }) => (
  <div className={cx("flex flex-col items-center justify-center rounded-sm border border-dashed border-slate-300 bg-white px-6 py-14 text-center", className)}>
    {Icon && (
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-slate-100 text-slate-500">
        <Icon size={22} />
      </span>
    )}
    <p className="text-base font-semibold text-slate-900">{title}</p>
    {description && <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center rounded-sm border border-red-200 bg-red-50/50 px-6 py-12 text-center">
    <AlertTriangle className="mb-3 text-red-500" />
    <p className="text-sm text-red-800">{message || "Something went wrong."}</p>
    {onRetry && (
      <Button className="mt-4" size="sm" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);

export const Alert = ({ tone = "info", title, children, className }) => {
  const tones = {
    info: ["border-blue-200 bg-blue-50 text-blue-900", Info],
    warning: ["border-amber-200 bg-amber-50 text-amber-900", AlertTriangle],
    danger: ["border-red-200 bg-red-50 text-red-900", AlertTriangle],
    success: ["border-emerald-200 bg-emerald-50 text-emerald-900", CheckCircle2],
  };
  const [classes, Icon] = tones[tone];
  return (
    <div className={cx("flex gap-3 rounded-sm border px-3.5 py-3 text-sm", classes, className)} role={tone === "danger" ? "alert" : "status"}>
      <Icon size={17} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? "mt-0.5" : ""}>{children}</div>}
      </div>
    </div>
  );
};

export const PageHeader = ({ title, description, actions, breadcrumb }) => (
  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {breadcrumb && <div className="mb-1 text-xs text-slate-500">{breadcrumb}</div>}
      <h1 className="truncate text-[22px] font-semibold text-slate-900">{title}</h1>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const Card = ({ className, children, ...props }) => (
  <div className={cx("rounded-sm border border-slate-200 bg-white", className)} {...props}>
    {children}
  </div>
);

export const Tabs = ({ tabs, value, onChange, className }) => (
  <div role="tablist" className={cx("scrollbar-hide flex gap-1 overflow-x-auto overflow-y-hidden border-b border-slate-200", className)}>
    {tabs.map((tab) => (
      <button
        key={tab.id}
        role="tab"
        type="button"
        aria-selected={value === tab.id}
        onClick={() => onChange(tab.id)}
        className={cx(
          "-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition",
          value === tab.id ? "border-[#1F2853] text-[#1F2853]" : "border-transparent text-slate-500 hover:text-slate-800",
        )}
      >
        {tab.icon && <tab.icon size={15} />}
        {tab.label}
        {tab.badge}
      </button>
    ))}
  </div>
);

export const Pagination = ({ pagination, onPage }) => {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total } = pagination;
  return (
    <div className="flex items-center justify-between gap-3 px-1 py-3 text-sm text-slate-600">
      <span>
        Page {page} of {totalPages} · {total} total
      </span>
      <div className="flex gap-1">
        <IconButton icon={ChevronLeft} label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)} />
        <IconButton icon={ChevronRight} label="Next page" disabled={page >= totalPages} onClick={() => onPage(page + 1)} />
      </div>
    </div>
  );
};

//  Overlays 

const useOverlay = (open, onClose) => {
  const panel = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const onKey = (event) => event.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    requestAnimationFrame(() => panel.current?.querySelector("input, select, textarea, button:not([data-close])")?.focus());
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);
  return panel;
};

const MODAL_WIDTHS = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl", full: "max-w-[96vw]" };

export const Modal = ({ open, onClose, title, description, children, footer, size = "md", bodyClassName }) => {
  const panel = useOverlay(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-3 sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label={title} className={cx("flex max-h-full w-full flex-col overflow-hidden rounded-sm bg-white ", MODAL_WIDTHS[size])}>
        {(title || onClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div className="min-w-0">
              {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
            </div>
            {onClose && <IconButton data-close icon={X} label="Close" onClick={onClose} />}
          </div>
        )}
        <div className={cx("flex-1 overflow-y-auto px-5 py-4", bodyClassName)}>{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
};

export const Drawer = ({ open, onClose, title, description, children, footer, width = "max-w-xl" }) => {
  const panel = useOverlay(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex justify-end bg-slate-900/40" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label={title} className={cx("flex h-full w-full flex-col bg-white ", width)}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          <IconButton data-close icon={X} label="Close" onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
};

//  Confirm dialog + toasts (app-wide providers) 

const FeedbackContext = createContext(null);

export const FeedbackProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  const toast = useCallback((message, tone = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [...list.slice(-3), { id, message, tone }]);
    setTimeout(() => setToasts((list) => list.filter((item) => item.id !== id)), tone === "error" ? 6000 : 3500);
  }, []);

  // confirm({ title, message, confirmLabel, tone: "danger" }) -> Promise<boolean>
  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setConfirmState({ ...options, resolve });
      }),
    [],
  );

  const closeConfirm = (result) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}
      <Modal
        open={Boolean(confirmState)}
        onClose={() => closeConfirm(false)}
        title={confirmState?.title || "Are you sure?"}
        size="sm"
        footer={
          <>
            <Button onClick={() => closeConfirm(false)}>Cancel</Button>
            <Button variant={confirmState?.tone === "danger" ? "danger" : "primary"} onClick={() => closeConfirm(true)}>
              {confirmState?.confirmLabel || "Confirm"}
            </Button>
          </>
        }
      >
        <div className="text-sm text-slate-600">{confirmState?.message}</div>
      </Modal>
      <div className="pointer-events-none fixed bottom-4 right-4 z-[300] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cx(
              "pointer-events-auto flex items-start gap-2.5 rounded-sm px-4 py-3 text-sm  outline outline-1",
              item.tone === "error" ? "bg-red-600 text-white outline-red-700" : item.tone === "info" ? "bg-slate-900 text-white outline-slate-800" : "bg-white text-slate-800 outline-slate-200",
            )}
          >
            {item.tone === "error" ? <AlertTriangle size={16} className="mt-0.5 shrink-0" /> : item.tone === "info" ? <Info size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />}
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => useContext(FeedbackContext);

export const SaveIndicator = ({ state, dirty }) => {
  const label =
    state === "saving" ? "Saving…" : state === "error" ? "Save failed" : state === "conflict" ? "Changed elsewhere" : dirty ? "Unsaved changes" : state === "saved" ? "All changes saved" : "Saved";
  const tone = state === "error" || state === "conflict" ? "text-red-600" : dirty || state === "saving" ? "text-amber-600" : "text-slate-500";
  return (
    <span className={cx("inline-flex items-center gap-1.5 text-xs font-medium", tone)} aria-live="polite">
      {state === "saving" ? <Loader2 size={13} className="animate-spin" /> : <span className={cx("h-1.5 w-1.5 rounded-full", dirty ? "bg-amber-500" : "bg-emerald-500")} />}
      {label}
    </span>
  );
};

export const timeAgo = (value) => {
  if (!value) return "";
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "";

export { cx };
