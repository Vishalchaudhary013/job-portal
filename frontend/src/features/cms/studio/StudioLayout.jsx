import React, { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  CreditCard,
  Eye,
  FilePlus2,
  Files,
  FormInput,
  History,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  Menu,
  MonitorSmartphone,
  PanelsTopLeft,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";
import { getAuthRedirectPath } from "../../../store/authStore";
import Icon from "./Icon";
import { useStudio } from "./StudioContext";
import { Button, ErrorState, PageLoader, cx } from "./ui";

// Form Builder shell. Navigation is fixed and generic — content types appear
// dynamically under "Content" as admins create them; nothing here names a
// specific kind of content.

const NavItem = ({ to, icon: IconComponent, children, end, onNavigate }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onNavigate}
    className={({ isActive }) =>
      cx(
        "flex items-center gap-2.5 rounded-sm px-3 py-2 text-[13.5px] font-medium transition",
        isActive ? "bg-white text-slate-900  outline outline-1 outline-slate-200" : "text-slate-600 hover:bg-white/70 hover:text-slate-900",
      )
    }
  >
    {IconComponent && <IconComponent size={16} className="shrink-0" />}
    <span className="truncate">{children}</span>
  </NavLink>
);

const NavGroup = ({ label, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600">
        {label}
        <ChevronDown size={13} className={cx("transition-transform", !open && "-rotate-90")} />
      </button>
      {open && <div className="space-y-0.5">{children}</div>}
    </div>
  );
};

const Sidebar = ({ onNavigate }) => {
  const { me, types, can, isSuperAdmin } = useStudio();
  const visibleTypes = types.filter((type) => type.status !== "archived").slice(0, 12);

  return (
    <nav className="flex h-full flex-col overflow-y-auto px-3 pb-6 pt-4" aria-label="Form Builder">
      <Link to="/form-builder" onClick={onNavigate} className="mb-3 flex items-center gap-2 px-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#1F2853] text-white">
          <FormInput size={17} />
        </span>
        <span>
          <span className="block text-sm font-semibold leading-tight text-slate-900">Form Builder</span>
          <span className="block text-[11px] text-slate-500">Edeco content studio</span>
        </span>
      </Link>

      <NavItem to="/form-builder" end icon={LayoutDashboard} onNavigate={onNavigate}>Dashboard</NavItem>

      {can("content.read") && (
        <NavGroup label="Content">
          <NavItem to="/form-builder/content" end icon={Files} onNavigate={onNavigate}>All content</NavItem>
          {visibleTypes.map((type) => (
            <NavLink
              key={type.id}
              to={`/form-builder/content?type=${type.id}`}
              onClick={onNavigate}
              className="flex items-center gap-2.5 rounded-sm py-1.5 pl-7 pr-3 text-[13px] text-slate-600 hover:bg-white/70 hover:text-slate-900"
            >
              <Icon name={type.icon} size={14} />
              <span className="truncate">{type.name}</span>
            </NavLink>
          ))}
        </NavGroup>
      )}

      {can("schema.read") && (
        <NavGroup label="Forms">
          <NavItem to="/form-builder/forms" end icon={FormInput} onNavigate={onNavigate}>Forms</NavItem>
          {can("schema.write") && <NavItem to="/form-builder/forms/new" icon={FilePlus2} onNavigate={onNavigate}>Create form</NavItem>}
          <NavItem to="/form-builder/templates" icon={LayoutTemplate} onNavigate={onNavigate}>Templates</NavItem>
        </NavGroup>
      )}

      {can("schema.read") && (
        <>
          <NavGroup label="Cards">
            <NavItem to="/form-builder/cards" icon={CreditCard} onNavigate={onNavigate}>Card builder</NavItem>
          </NavGroup>
          <NavGroup label="Pages">
            <NavItem to="/form-builder/pages" icon={PanelsTopLeft} onNavigate={onNavigate}>Detail page builder</NavItem>
          </NavGroup>
        </>
      )}

      {can("submissions.read") && (
        <NavGroup label="Submissions">
          <NavItem to="/form-builder/submissions" icon={Inbox} onNavigate={onNavigate}>All responses</NavItem>
        </NavGroup>
      )}

      <div className="mt-4 space-y-0.5">
        {can("media.manage", "content.write") && <NavItem to="/form-builder/media" icon={ImageIcon} onNavigate={onNavigate}>Media</NavItem>}
        {can("analytics.read") && <NavItem to="/form-builder/analytics" icon={BarChart3} onNavigate={onNavigate}>Analytics</NavItem>}
      </div>

      {can("schema.read") && (
        <NavGroup label="Edeco">
          <NavItem to="/form-builder/presentation" icon={MonitorSmartphone} onNavigate={onNavigate}>Presentation</NavItem>
          <NavItem to="/form-builder/preview" icon={Eye} onNavigate={onNavigate}>Preview</NavItem>
        </NavGroup>
      )}

      {(isSuperAdmin || can("audit.read")) && (
        <NavGroup label="Administration">
          {isSuperAdmin && <NavItem to="/form-builder/admins" icon={Users} onNavigate={onNavigate}>Admins</NavItem>}
          {isSuperAdmin && <NavItem to="/form-builder/permissions" icon={Shield} onNavigate={onNavigate}>Permissions</NavItem>}
          {can("audit.read") && <NavItem to="/form-builder/audit-logs" icon={History} onNavigate={onNavigate}>Audit logs</NavItem>}
          {isSuperAdmin && <NavItem to="/form-builder/settings" icon={Settings} onNavigate={onNavigate}>System settings</NavItem>}
        </NavGroup>
      )}

      <div className="mt-auto px-3 pt-6 text-xs text-slate-500">
        Signed in as <span className="font-medium text-slate-700">{me?.name}</span>
        <span className="block capitalize">{me?.role?.replace("_", " ")}</span>
      </div>
    </nav>
  );
};

// Builder screens use the full width and manage their own scrolling.
const FULL_BLEED = [/^\/form-builder\/types\/[^/]+\/(form|card|page)/, /^\/form-builder\/forms\/(?!new)[^/]+$/];

const StudioLayout = () => {
  const { me, error } = useStudio();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const fullBleed = FULL_BLEED.some((pattern) => pattern.test(location.pathname));

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          <ErrorState message={error.message} />
          <div className="mt-4 text-center">
            <Link to="/" className="text-sm font-medium text-[#1F2853] hover:underline">Back to Edeco</Link>
          </div>
        </div>
      </div>
    );
  }
  if (!me) return <PageLoader label="Opening the Form Builder…" />;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-[#F4F6FB] lg:block">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[150] flex lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="w-64 bg-[#F4F6FB] ">
            <div className="flex justify-end p-2">
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="rounded-sm p-2 text-slate-500 hover:bg-white">
                <X size={18} />
              </button>
            </div>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 sm:px-5">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" className="rounded-sm p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden">
              <Menu size={18} />
            </button>
            <span className="text-sm font-semibold text-slate-800 lg:hidden">Form Builder</span>
          </div>
          <Link to={getAuthRedirectPath(me.role)}>
            <Button size="sm" variant="ghost" icon={ArrowLeft}>
              Admin dashboard
            </Button>
          </Link>
        </header>
        <main className={cx("min-h-0 flex-1", fullBleed ? "overflow-hidden" : "overflow-y-auto")}>
          {fullBleed ? (
            <Outlet />
          ) : (
            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudioLayout;
