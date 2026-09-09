import {
  BriefcaseBusiness,
  FolderKanban,
  LayoutDashboard,
  Moon,
  NotebookPen,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "总览", icon: LayoutDashboard, end: true },
  { to: "/applications", label: "投递记录", icon: BriefcaseBusiness },
  { to: "/questions", label: "题目本", icon: NotebookPen },
  { to: "/projects", label: "项目进度", icon: FolderKanban },
];

function useTheme() {
  const [dark, setDark] = useState(
    () => localStorage.getItem("tracker-theme") === "dark",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("tracker-theme", dark ? "dark" : "light");
  }, [dark]);

  return { dark, toggle: () => setDark((value) => !value) };
}

export default function AppLayout() {
  const { dark, toggle } = useTheme();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r bg-card px-3 py-5 md:flex">
        <div className="px-3 pb-6">
          <p className="text-sm font-semibold">秋招追踪台</p>
          <p className="text-[11px] text-muted-foreground">投递 · 题目 · 项目</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-secondary font-medium text-secondary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <Button variant="ghost" size="sm" onClick={toggle} className="justify-start gap-2.5 px-3">
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {dark ? "浅色" : "深色"}
        </Button>
      </aside>

      {/* 窄屏时侧栏收成顶部一条 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-1 border-b bg-background/80 px-3 py-2 backdrop-blur md:hidden">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs",
                  isActive ? "bg-secondary font-medium" : "text-muted-foreground",
                )
              }
            >
              <Icon className="size-3.5" />
              {label}
            </NavLink>
          ))}
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
