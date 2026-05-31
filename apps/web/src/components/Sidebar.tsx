import { LayoutDashboard, Grid, LineChart, FileText, Lock, Wand2, BookMarked, UserCircle2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import ProBadge from "./ProBadge";
import { useAuth } from "../lib/useAuth";

export default function Sidebar() {
  const { user } = useAuth();

  const navItems: Array<{
    icon: typeof LayoutDashboard;
    label: string;
    path: string;
    pro: boolean;
    auth: boolean;
    tour?: string;
  }> = [
    { icon: LayoutDashboard, label: "Dashboard",    path: "/dashboard", pro: false, auth: false },
    { icon: Grid,            label: "Catalog",      path: "/catalog",   pro: false, auth: false, tour: "catalog-link" },
    { icon: LineChart,       label: "Progress",     path: "/progress",  pro: false, auth: true  },
    { icon: Wand2,           label: "AI Workspace", path: "/workspace", pro: false, auth: false },
    { icon: BookMarked,      label: "Мои конспекты",path: "/my-notes",  pro: false, auth: true  },
    { icon: UserCircle2,     label: "Профиль",      path: "/profile",   pro: false, auth: true  },
    { icon: FileText,        label: "Отчёты",       path: "/reports",   pro: false, auth: false },
  ];

  return (
    <aside className="h-full w-64 fixed left-0 top-0 hidden lg:flex flex-col bg-surface-container-lowest border-r border-outline-variant/10 z-40">
      <div className="flex flex-col p-6 gap-2 h-full">
        <div className="mb-8 px-4 pt-4">
          <h1 className="text-lg font-black text-primary tracking-tighter">MindFlow</h1>
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Adaptive Learning</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              data-tour={item.tour}
              className={({ isActive }) => `
                px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 font-medium text-sm
                ${isActive
                  ? "bg-secondary/10 text-secondary"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"}
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1">{item.label}</span>
              {item.auth && !user && <Lock className="w-3.5 h-3.5 opacity-40" />}
              {item.pro && <ProBadge />}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
