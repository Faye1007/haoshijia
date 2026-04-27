"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Menu, X } from "lucide-react";
import { firebaseSignOut } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile, type UserProfile } from "@/lib/firestore";
import { getProfileDisplayName, getProfileInitial } from "@/lib/profile";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "首页", icon: "Home" },
  { href: "/dashboard/weight", label: "体重记录", icon: "Scale" },
  { href: "/dashboard/measurements", label: "围度记录", icon: "Ruler" },
  { href: "/dashboard/food", label: "饮食记录", icon: "Utensils" },
  { href: "/dashboard/exercise", label: "运动记录", icon: "Activity" },
  { href: "/dashboard/review", label: "复盘", icon: "BarChart" },
  { href: "/dashboard/inventory", label: "食材与菜谱", icon: "Package" },
  { href: "/dashboard/profile", label: "个人资料", icon: "User" },
];

const icons: Record<string, string> = {
  Home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  Scale: "M12 3v18M3 9h18M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2",
  Ruler: "M21.5 2.5v19M2.5 2.5h19M12 12l8-8M12 12L4 4",
  Utensils: "M12 3v18M3 15c1.5-1.5 3-3 6-3s4.5 1.5 6 3M3 9c1.5-1.5 3-3 6-3s4.5 1.5 6 3",
  Activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  BarChart: "M18 20V10M12 20V4M6 20v-6",
  Target: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M12 12m-1 0a1 1 0 1 0 2 0 1 1 0 1 0-2 0M12 12m-7 0a7 7 0 1 0 14 0 7 7 0 0 0-14 0",
  Package: "M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12",
  User: "M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
};

function NavIcon({ name }: { name: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-custom"
    >
      <path d={icons[name] || icons.Home} />
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const activeUser = user ?? (hasMounted ? auth.currentUser : null);
  const displayName = getProfileDisplayName(profile, activeUser?.email);
  const displayInitial = getProfileInitial(displayName);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!activeUser) {
        setProfile(null);
        return;
      }

      const profileData = await getUserProfile(activeUser.uid);
      if (isMounted) {
        setProfile(profileData);
      }
    }

    loadProfile();
    window.addEventListener("haoshijia-profile-updated", loadProfile);

    return () => {
      isMounted = false;
      window.removeEventListener("haoshijia-profile-updated", loadProfile);
    };
  }, [activeUser]);

  const handleSignOut = async () => {
    await firebaseSignOut();
    router.push("/");
  };

  return (
    <div className="dashboard-shell app-aurora-bg min-h-screen flex text-zinc-900">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="dashboard-mobile-toggle fixed top-4 left-4 z-50 rounded-md border border-zinc-800 bg-zinc-950 p-2 text-white shadow-[0_10px_30px_rgba(24,24,27,0.2)] lg:hidden"
      >
        {sidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Sidebar - desktop */}
      <aside className="dashboard-sidebar fixed hidden h-full w-56 flex-col border-r border-zinc-800 bg-zinc-950 shadow-[12px_0_40px_rgba(24,24,27,0.18)] lg:flex">
        <div className="border-b border-white/10 p-4">
          <h1 className="text-xl font-bold text-white">好食家</h1>
          <p className="mt-1 text-xs text-lime-300">记录 · 复盘 · 计划</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "border border-lime-300 bg-lime-300 text-zinc-950 shadow-sm"
                    : "text-zinc-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </a>
            );
          })}
        </nav>
        {activeUser ? (
          <div className="border-t border-white/10 p-2">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              退出登录
            </button>
          </div>
        ) : (
          <div className="border-t border-white/10 p-3 text-xs text-zinc-400">
            登录后可保存记录
          </div>
        )}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <aside className="dashboard-sidebar fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex h-full w-56 flex-col border-r border-zinc-800 bg-zinc-950 shadow-[12px_0_40px_rgba(24,24,27,0.24)]">
            <div className="border-b border-white/10 p-4">
              <h1 className="text-xl font-bold text-white">好食家</h1>
              <p className="mt-1 text-xs text-lime-300">记录 · 复盘 · 计划</p>
            </div>
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "border border-lime-300 bg-lime-300 text-zinc-950 shadow-sm"
                        : "text-zinc-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <NavIcon name={item.icon} />
                    {item.label}
                  </a>
                );
              })}
            </nav>
            {activeUser ? (
              <div className="border-t border-white/10 p-2">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  退出登录
                </button>
              </div>
            ) : (
              <div className="border-t border-white/10 p-3 text-xs text-zinc-400">
                登录后可保存记录
              </div>
            )}
          </div>
        </aside>
      )}

      <div className="dashboard-content flex-1 flex flex-col lg:ml-56">
        <header className="dashboard-header flex h-14 items-center justify-end border-b border-zinc-200 bg-white px-4 shadow-[0_10px_30px_rgba(24,24,27,0.06)] md:px-6">
          {activeUser ? (
            <a
              href="/dashboard/profile"
              className="flex items-center gap-3 rounded-full px-2 py-1 transition-colors hover:bg-zinc-100"
              aria-label="编辑个人资料"
            >
              <span className="hidden text-sm text-zinc-600 sm:inline">{displayName}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-300 shadow-[0_8px_22px_rgba(132,204,22,0.28)]">
                <span className="text-sm font-semibold text-zinc-950">
                  {displayInitial}
                </span>
              </div>
            </a>
          ) : (
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-sm text-zinc-700 sm:inline">
                当前为只读浏览
              </span>
              <Button variant="ghost" size="sm" asChild>
                <a href="/login">登录</a>
              </Button>
              <Button size="sm" asChild>
                <a href="/register">注册</a>
              </Button>
            </div>
          )}
        </header>
        <main className="dashboard-main flex-1 bg-transparent p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
