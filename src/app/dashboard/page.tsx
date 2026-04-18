"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";

interface UserProfile {
  currentWeight?: number;
  targetWeight?: number;
}

const quickActions = [
  {
    title: "记录体重",
    description: "记录今日体重和体型变化",
    href: "/dashboard/weight",
    icon: "M12 3v18M3 9h18M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
    color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
  },
  {
    title: "记录饮食",
    description: "记录每日饮食摄入情况",
    href: "/dashboard/food",
    icon: "M12 3v18M3 15c1.5-1.5 3-3 6-3s4.5 1.5 6 3M3 9c1.5-1.5 3-3 6-3s4.5 1.5 6 3",
    color: "bg-green-50 text-green-600 hover:bg-green-100",
  },
  {
    title: "记录运动",
    description: "记录每日运动消耗",
    href: "/dashboard/exercise",
    icon: "M22 12h-4l-3 9L9 3l-3 9H2",
    color: "bg-orange-50 text-orange-600 hover:bg-orange-100",
  },
  {
    title: "今日复盘",
    description: "回顾今日饮食和体重",
    href: "/dashboard/review",
    icon: "M18 20V10M12 20V4M6 20v-6",
    color: "bg-purple-50 text-purple-600 hover:bg-purple-100",
  },
];

function ActionCard({ action }: { action: typeof quickActions[0] }) {
  return (
    <a
      href={action.href}
      className={`block p-4 rounded-lg transition-colors ${action.color}`}
    >
      <div className="flex items-center gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={action.icon} />
        </svg>
        <div>
          <div className="font-medium text-sm">{action.title}</div>
          <div className="text-xs opacity-80">{action.description}</div>
        </div>
      </div>
    </a>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayWeight, setTodayWeight] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      const today = new Date().toISOString().split("T")[0];
      
      const profileDoc = await getDoc(doc(db, "users", user.uid));
      if (profileDoc.exists()) {
        setProfile(profileDoc.data() as UserProfile);
      }

      const weightDoc = await getDoc(doc(db, "records", user.uid, "daily", today));
      if (weightDoc.exists()) {
        const data = weightDoc.data();
        if (data.weight) setTodayWeight(data.weight);
      }
    }
    fetchData();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 pt-8 lg:pt-0">仪表盘</h2>
        <p className="text-zinc-500">欢迎回来 {user?.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              今日体重
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayWeight ? (
              <div className="text-2xl font-bold">{todayWeight} kg</div>
            ) : (
              <div className="text-lg text-zinc-400">未记录</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              当前体重
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.currentWeight ? (
              <div className="text-2xl font-bold">{profile.currentWeight} kg</div>
            ) : (
              <div className="text-lg text-zinc-400">未设置</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              目标体重
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.targetWeight ? (
              <div className="text-2xl font-bold">{profile.targetWeight} kg</div>
            ) : (
              <div className="text-lg text-zinc-400">未设置</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>快速打卡</CardTitle>
          <CardDescription>快速记录今日数据</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <ActionCard key={action.href} action={action} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>进展概览</CardTitle>
        </CardHeader>
        <CardContent>
          {profile?.currentWeight && profile?.targetWeight && todayWeight ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">当前</span>
                <span className="font-medium">{profile.currentWeight} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">目标</span>
                <span className="font-medium">{profile.targetWeight} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">还需</span>
                <span className="font-medium">
                  {(profile.currentWeight - profile.targetWeight).toFixed(1)} kg
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-400">
              请先在目标设定中设置体重目标
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}