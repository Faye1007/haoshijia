"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { HelpCircle, ArrowRight, Scale, UtensilsCrossed, TrendingUp, Ruler } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      const today = new Date().toISOString().split("T")[0];
      
      const profileDoc = await getDoc(doc(db, "users", user.uid));
      if (profileDoc.exists()) {
        const data = profileDoc.data() as UserProfile;
        setProfile(data);
        if (!data.targetWeight || !data.currentWeight) {
          setShowGuide(true);
        }
      } else {
        setShowGuide(true);
      }

      const weightDoc = await getDoc(doc(db, "records", user.uid, "daily", today));
      if (weightDoc.exists()) {
        const data = weightDoc.data();
        if (data.weight) setTodayWeight(data.weight);
      }
      setIsLoading(false);
    }
    fetchData();
  }, [user]);

  const quickGuides = [
    { icon: Scale, title: "记录体重", desc: "晨起空腹称重最准确", href: "/dashboard/weight" },
    { icon: UtensilsCrossed, title: "记录饮食", desc: "记录每餐进食情况", href: "/dashboard/food" },
    { icon: TrendingUp, title: "记录围度", desc: "腰臀围等身体数据", href: "/dashboard/measurements" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mx-auto mb-4"></div>
          <p className="text-zinc-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showGuide && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <HelpCircle className="h-5 w-5" />
              欢迎使用好食家
            </CardTitle>
            <CardDescription className="text-blue-600">
              让我们先设置您的目标体重，开始健康减脂之旅
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {quickGuides.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:border-blue-300 transition-colors"
                >
                  <item.icon className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs text-zinc-500">{item.desc}</div>
                  </div>
                </a>
              ))}
            </div>
            <Button onClick={() => setShowGuide(false)} variant="outline" size="sm">
              暂时跳过 <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

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