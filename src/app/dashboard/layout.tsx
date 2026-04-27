"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  Activity,
  BarChart3,
  Home,
  LogOut,
  Menu,
  Package,
  Ruler,
  Scale,
  UserRound,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";
import { firebaseSignOut } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile, type UserProfile } from "@/lib/firestore";
import { getProfileDisplayName, getProfileInitial } from "@/lib/profile";
import { Button } from "@/components/ui/button";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "首页", icon: Home },
  { href: "/dashboard/inventory", label: "食材与菜谱", icon: Package },
  { href: "/dashboard/food", label: "饮食记录", icon: UtensilsCrossed },
  { href: "/dashboard/exercise", label: "运动记录", icon: Activity },
  { href: "/dashboard/weight", label: "体重记录", icon: Scale },
  { href: "/dashboard/measurements", label: "围度记录", icon: Ruler },
  { href: "/dashboard/review", label: "复盘", icon: BarChart3 },
  { href: "/dashboard/profile", label: "个人资料", icon: UserRound },
];

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
    <div className="dashboard-shell app-aurora-bg min-h-screen flex text-stone-900">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="dashboard-mobile-toggle fixed top-4 left-4 z-50 rounded-md border border-green-200 bg-[#fffdf7] p-2 text-green-900 shadow-[0_10px_28px_rgba(108,93,72,0.14)] lg:hidden"
      >
        {sidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Sidebar - desktop */}
      <aside className="dashboard-sidebar fixed hidden h-full w-56 flex-col border-r border-stone-200 bg-[#fffaf1]/95 shadow-[12px_0_36px_rgba(108,93,72,0.12)] backdrop-blur lg:flex">
        <div className="border-b border-stone-200/80 p-4">
          <h1 className="text-xl font-bold text-stone-950">好食家</h1>
          <p className="mt-1 text-xs text-green-700">记录 · 复盘 · 计划</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "border border-green-200 bg-green-100 text-green-950 shadow-sm"
                    : "text-stone-600 hover:bg-white/70 hover:text-green-900"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </a>
            );
          })}
        </nav>
        {activeUser ? (
          <div className="border-t border-stone-200/80 p-2">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-white/70 hover:text-green-900"
            >
              <LogOut className="h-5 w-5" />
              退出登录
            </button>
          </div>
        ) : (
          <div className="border-t border-stone-200/80 p-3 text-xs text-stone-500">
            登录后可保存记录
          </div>
        )}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <aside className="dashboard-sidebar fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-stone-950/35"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex h-full w-56 flex-col border-r border-stone-200 bg-[#fffaf1] shadow-[12px_0_36px_rgba(108,93,72,0.18)]">
            <div className="border-b border-stone-200/80 p-4">
              <h1 className="text-xl font-bold text-stone-950">好食家</h1>
              <p className="mt-1 text-xs text-green-700">记录 · 复盘 · 计划</p>
            </div>
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "border border-green-200 bg-green-100 text-green-950 shadow-sm"
                        : "text-stone-600 hover:bg-white/70 hover:text-green-900"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </a>
                );
              })}
            </nav>
            {activeUser ? (
              <div className="border-t border-stone-200/80 p-2">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-white/70 hover:text-green-900"
                >
                  <LogOut className="h-5 w-5" />
                  退出登录
                </button>
              </div>
            ) : (
              <div className="border-t border-stone-200/80 p-3 text-xs text-stone-500">
                登录后可保存记录
              </div>
            )}
          </div>
        </aside>
      )}

      <div className="dashboard-content flex-1 flex flex-col lg:ml-56">
        <header className="dashboard-header flex h-14 items-center justify-end border-b border-stone-200/80 bg-[#fffdf7]/86 px-4 shadow-[0_10px_28px_rgba(108,93,72,0.08)] backdrop-blur md:px-6">
          {activeUser ? (
            <a
              href="/dashboard/profile"
              className="flex items-center gap-3 rounded-full px-2 py-1 transition-colors hover:bg-green-50"
              aria-label="编辑个人资料"
            >
              <span className="hidden text-sm text-stone-600 sm:inline">{displayName}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 shadow-[0_8px_20px_rgba(95,127,82,0.22)]">
                <span className="text-sm font-semibold text-green-950">
                  {displayInitial}
                </span>
              </div>
            </a>
          ) : (
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-sm text-stone-700 sm:inline">
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
