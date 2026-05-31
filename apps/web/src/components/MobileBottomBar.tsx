import { LayoutDashboard, Grid, LineChart, Wand2 } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { icon: LayoutDashboard, label: "Dashboard",    path: "/dashboard"  },
  { icon: Grid,            label: "Catalog",      path: "/catalog"    },
  { icon: LineChart,       label: "Progress",     path: "/progress"   },
  { icon: Wand2,           label: "AI Workspace", path: "/workspace"  },
];

export default function MobileBottomBar() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t border-outline-variant/10 flex">
      {items.map(({ icon: Icon, label, path }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-semibold transition-colors
            ${isActive ? "text-secondary" : "text-on-surface-variant"}`
          }
        >
          <Icon className="w-5 h-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
