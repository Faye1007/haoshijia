"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RecordPrincipleNotice } from "@/components/RecordPrincipleNotice";
import { useAuth } from "@/contexts/AuthContext";
import {
  getLatestDisplayWeight,
  getLatestMeasurementSummary,
  getUserProfile,
  type DisplayWeight,
  type LatestMeasurementSummary,
  type UserProfile,
} from "@/lib/firestore";
import { getProfileDisplayName } from "@/lib/profile";
import { useEffect, useState } from "react";
import { HelpCircle, ArrowRight, Scale, UtensilsCrossed, TrendingUp, Ruler } from "lucide-react";

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

const emptyMeasurementSummary: LatestMeasurementSummary = {
  waist: null,
  hip: null,
  thigh: null,
  upperArm: null,
};

const measurementLabels: Record<keyof LatestMeasurementSummary, string> = {
  waist: "腰围",
  hip: "臀围",
  thigh: "大腿围",
  upperArm: "上臂围",
};

const secondaryMeasurementKeys: (keyof LatestMeasurementSummary)[] = [
  "hip",
  "thigh",
  "upperArm",
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
  const [displayWeight, setDisplayWeight] = useState<DisplayWeight | null>(null);
  const [measurementSummary, setMeasurementSummary] = useState<LatestMeasurementSummary>(emptyMeasurementSummary);
  const [isLoading, setIsLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setIsLoading(true);
      const today = new Date().toISOString().split("T")[0];

      try {
        const [profileData, weight, measurements] = await Promise.all([
          getUserProfile(user.uid),
          getLatestDisplayWeight(user.uid, today),
          getLatestMeasurementSummary(user.uid),
        ]);

        if (profileData) {
          setProfile(profileData);
          if (!profileData.targetWeight || !profileData.currentWeight) {
            setShowGuide(true);
          }
        } else {
          setShowGuide(true);
        }

        setDisplayWeight(weight);
        setMeasurementSummary(measurements);
      } finally {
        setIsLoading(false);
      }
    }
    if (!user) {
      setProfile(null);
      setDisplayWeight(null);
      setMeasurementSummary(emptyMeasurementSummary);
      return;
    }
    fetchData();
  }, [user]);

  const visibleProfile = user ? profile : null;
  const visibleDisplayWeight = user ? displayWeight : null;
  const visibleMeasurementSummary = user ? measurementSummary : emptyMeasurementSummary;
  const displayName = getProfileDisplayName(visibleProfile, user?.email);
  const remainingWeight = visibleProfile?.targetWeight && visibleDisplayWeight
    ? visibleDisplayWeight.weight - visibleProfile.targetWeight
    : null;
  const hasMeasurementRecord = Object.values(visibleMeasurementSummary).some(Boolean);

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
      {(!user || showGuide) && (
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
        <p className="text-zinc-500">
          {user ? `欢迎回来 ${displayName}` : "当前为只读浏览，登录后可开始记录"}
        </p>
      </div>

      <RecordPrincipleNotice />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              今日体重
            </CardTitle>
          </CardHeader>
          <CardContent>
            {visibleDisplayWeight ? (
              <div className="space-y-1">
                <div className="text-2xl font-bold">{visibleDisplayWeight.weight} kg</div>
                <div className="text-xs text-zinc-500">
                  {visibleDisplayWeight.source === "today"
                    ? visibleDisplayWeight.isMorning ? "今日晨起体重" : "今日最新记录"
                    : `最近记录：${visibleDisplayWeight.date}`}
                </div>
              </div>
            ) : (
              <div className="text-lg text-zinc-400">未记录</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              初始体重
            </CardTitle>
          </CardHeader>
          <CardContent>
            {visibleProfile?.currentWeight ? (
              <div className="text-2xl font-bold">{visibleProfile.currentWeight} kg</div>
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
            {visibleProfile?.targetWeight ? (
              <div className="text-2xl font-bold">{visibleProfile.targetWeight} kg</div>
            ) : (
              <div className="text-lg text-zinc-400">未设置</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>围度概览</CardTitle>
          <CardDescription>最近 90 天内的有效围度记录</CardDescription>
        </CardHeader>
        <CardContent>
          {hasMeasurementRecord ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_2fr] gap-4">
              <div className="rounded-lg border border-sky-200 bg-sky-50/70 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-sky-700">
                  <Ruler className="h-4 w-4" />
                  重点观察：腰围
                </div>
                <div className="mt-3 text-3xl font-bold text-zinc-900">
                  {visibleMeasurementSummary.waist
                    ? `${visibleMeasurementSummary.waist.value} cm`
                    : "未记录"}
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {visibleMeasurementSummary.waist
                    ? `最近记录：${visibleMeasurementSummary.waist.date}`
                    : "建议优先记录腰围，方便观察减脂变化"}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {secondaryMeasurementKeys.map((key) => {
                  const summary = visibleMeasurementSummary[key];

                  return (
                    <div key={key} className="rounded-lg border border-zinc-200 bg-white/60 p-4">
                      <div className="text-sm text-zinc-500">{measurementLabels[key]}</div>
                      <div className="mt-2 text-xl font-bold text-zinc-900">
                        {summary ? `${summary.value} cm` : "未记录"}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {summary ? `最近记录：${summary.date}` : "暂无有效记录"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-200 bg-white/50 p-4 text-sm text-zinc-500">
              暂无围度记录。记录腰围、臀围、大腿围和上臂围后，仪表盘会显示最近有效值和记录日期。
            </div>
          )}
        </CardContent>
      </Card>

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
          {visibleProfile?.targetWeight && visibleDisplayWeight && remainingWeight !== null ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">
                  {visibleDisplayWeight.source === "today" ? "今日" : "最近记录"}
                </span>
                <span className="font-medium">{visibleDisplayWeight.weight} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">目标</span>
                <span className="font-medium">{visibleProfile.targetWeight} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">还需</span>
                <span className="font-medium">
                  {remainingWeight.toFixed(1)} kg
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-400">
              请先在体重记录中设置体重目标
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
