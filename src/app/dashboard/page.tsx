"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RecordPrincipleNotice } from "@/components/RecordPrincipleNotice";
import { useAuth } from "@/contexts/AuthContext";
import {
  getLatestDisplayWeight,
  getLatestMeasurementSummary,
  getRecordPresenceHistory,
  getUserProfile,
  type DisplayWeight,
  type LatestMeasurementSummary,
  type RecordPresence,
  type UserProfile,
} from "@/lib/firestore";
import { getProfileDisplayName } from "@/lib/profile";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Flame,
  HelpCircle,
  Ruler,
  Scale,
  Trophy,
  UserRound,
  UtensilsCrossed,
  Activity,
  ClipboardCheck,
  TrendingUp,
} from "lucide-react";

const emptyMeasurementSummary: LatestMeasurementSummary = {
  waist: null,
  hip: null,
  thigh: null,
  upperArm: null,
};

const emptyPresence: RecordPresence = {
  date: "",
  weight: false,
  measurement: false,
  food: false,
  exercise: false,
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

const genderLabels: Record<string, string> = {
  female: "女",
  male: "男",
  other: "其他 / 不便说明",
};

const activityLabels: Record<string, string> = {
  low: "久坐为主",
  light: "轻度活动",
  moderate: "中等活动",
  active: "较高活动",
};

const getBmiStatus = (bmi: number) => {
  if (bmi < 18.5) return "偏低";
  if (bmi < 24) return "正常";
  if (bmi < 28) return "偏高";
  return "较高";
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayWeight, setDisplayWeight] = useState<DisplayWeight | null>(null);
  const [measurementSummary, setMeasurementSummary] = useState<LatestMeasurementSummary>(emptyMeasurementSummary);
  const [recordPresence, setRecordPresence] = useState<RecordPresence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setIsLoading(true);
      const today = new Date().toISOString().split("T")[0];

      try {
        const [profileData, weight, measurements, presence] = await Promise.all([
          getUserProfile(user.uid),
          getLatestDisplayWeight(user.uid, today),
          getLatestMeasurementSummary(user.uid),
          getRecordPresenceHistory(user.uid, 14),
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
        setRecordPresence(presence);
      } finally {
        setIsLoading(false);
      }
    }
    if (!user) {
      setProfile(null);
      setDisplayWeight(null);
      setMeasurementSummary(emptyMeasurementSummary);
      setRecordPresence([]);
      return;
    }
    fetchData();
  }, [user]);

  const visibleProfile = user ? profile : null;
  const visibleDisplayWeight = user ? displayWeight : null;
  const visibleMeasurementSummary = user ? measurementSummary : emptyMeasurementSummary;
  const visibleRecordPresence = user ? recordPresence : [];
  const todayPresence = visibleRecordPresence[0] ?? emptyPresence;
  const taskItems = [
    {
      title: "称重",
      description: "记录今日体重",
      href: "/dashboard/weight",
      done: todayPresence.weight,
      icon: Scale,
      accent: "bg-green-100 text-green-800 border-green-200",
    },
    {
      title: "饮食",
      description: "写下至少一餐",
      href: "/dashboard/food",
      done: todayPresence.food,
      icon: UtensilsCrossed,
      accent: "bg-red-100 text-red-800 border-red-200",
    },
    {
      title: "运动",
      description: "记录一次活动",
      href: "/dashboard/exercise",
      done: todayPresence.exercise,
      icon: Activity,
      accent: "bg-sky-100 text-sky-800 border-sky-200",
    },
    {
      title: "复盘",
      description: "看今日模式",
      href: "/dashboard/review",
      done: todayPresence.weight || todayPresence.food || todayPresence.exercise,
      icon: ClipboardCheck,
      accent: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
  ];
  const completedTaskCount = taskItems.filter((item) => item.done).length;
  const completionPercent = Math.round((completedTaskCount / taskItems.length) * 100);
  const streakDays = visibleRecordPresence.reduce((streak, day) => {
    if (streak !== visibleRecordPresence.indexOf(day)) return streak;
    return day.weight || day.measurement || day.food || day.exercise ? streak + 1 : streak;
  }, 0);
  const displayName = getProfileDisplayName(visibleProfile, user?.email);
  const remainingWeight = visibleProfile?.targetWeight && visibleDisplayWeight
    ? visibleDisplayWeight.weight - visibleProfile.targetWeight
    : null;
  const hasMeasurementRecord = Object.values(visibleMeasurementSummary).some(Boolean);
  const bmiWeight = visibleDisplayWeight?.weight ?? visibleProfile?.currentWeight ?? null;
  const bmi = visibleProfile?.heightCm && bmiWeight
    ? bmiWeight / ((visibleProfile.heightCm / 100) ** 2)
    : null;
  const age = visibleProfile?.birthYear
    ? new Date().getFullYear() - visibleProfile.birthYear
    : null;
  const hasBodyProfile = Boolean(
    visibleProfile?.heightCm ||
    visibleProfile?.gender ||
    visibleProfile?.birthYear ||
    visibleProfile?.activityLevel
  );
  const bodyOverviewItems = [
    {
      label: "身高",
      value: visibleProfile?.heightCm ? `${visibleProfile.heightCm} cm` : "未填写",
    },
    {
      label: "年龄",
      value: age && age > 0 ? `${age} 岁` : "未填写",
    },
    {
      label: "性别",
      value: visibleProfile?.gender ? genderLabels[visibleProfile.gender] || "已填写" : "未填写",
    },
    {
      label: "活动水平",
      value: visibleProfile?.activityLevel
        ? activityLabels[visibleProfile.activityLevel] || "已填写"
        : "未填写",
    },
  ];

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

      <Card className="border-zinc-200 bg-white/85">
        <CardHeader>
          <CardTitle>今日进度</CardTitle>
          <CardDescription>先看当前体重和目标差距，再决定今天要补哪些记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-[1.15fr_2fr]">
            <div className="rounded-lg border border-green-200 bg-green-50/75 p-3 sm:p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-green-800">
                <Scale className="h-4 w-4" />
                {visibleDisplayWeight?.source === "today" ? "今日体重" : "最近体重"}
              </div>
              <div className="mt-3 text-2xl font-bold text-zinc-900 sm:text-3xl">
                {visibleDisplayWeight ? `${visibleDisplayWeight.weight} kg` : "未记录"}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {visibleDisplayWeight
                  ? visibleDisplayWeight.source === "today"
                    ? visibleDisplayWeight.isMorning ? "今日晨起体重" : "今日最新记录"
                    : `最近记录：${visibleDisplayWeight.date}`
                  : "今天可以先完成称重任务"}
              </div>
            </div>

            <div className="contents lg:grid lg:grid-cols-3 lg:gap-3">
              <div className="rounded-lg border border-zinc-200 bg-white/70 p-3 sm:p-4">
                <div className="text-sm text-zinc-500">初始体重</div>
                <div className="mt-2 text-xl font-bold text-zinc-900 sm:text-2xl">
                  {visibleProfile?.currentWeight ? `${visibleProfile.currentWeight} kg` : "未设置"}
                </div>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white/70 p-3 sm:p-4">
                <div className="text-sm text-zinc-500">目标体重</div>
                <div className="mt-2 text-xl font-bold text-zinc-900 sm:text-2xl">
                  {visibleProfile?.targetWeight ? `${visibleProfile.targetWeight} kg` : "未设置"}
                </div>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50/80 p-3 text-green-950 sm:p-4">
                <div className="text-sm text-green-700">还需变化</div>
                <div className="mt-2 text-xl font-bold text-zinc-900 sm:text-2xl">
                  {remainingWeight !== null ? `${remainingWeight.toFixed(1)} kg` : "--"}
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {remainingWeight !== null ? "按最近体重计算" : "设置目标后显示"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-stone-200 bg-[#fff8ec]/92 shadow-[0_20px_54px_rgba(108,93,72,0.14)]">
        <CardContent className="p-5 md:p-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.6fr]">
            <div className="space-y-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-800">
                  <Trophy className="h-3.5 w-3.5" />
                  今日任务
                </div>
                <h3 className="mt-3 text-2xl font-bold text-zinc-900">完成度 {completionPercent}%</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  {user ? "把记录当成每日闯关，完成后再看复盘。" : "登录后会显示你的今日任务进度。"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-green-100 bg-white/70 p-3">
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    已完成
                  </div>
                  <div className="mt-2 text-2xl font-bold text-zinc-900">
                    {completedTaskCount}/{taskItems.length}
                  </div>
                </div>
                <div className="rounded-md border border-amber-100 bg-white/70 p-3">
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <Flame className="h-4 w-4 text-amber-500" />
                    连续记录
                  </div>
                  <div className="mt-2 text-2xl font-bold text-zinc-900">{streakDays} 天</div>
                </div>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-stone-200/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-500 via-amber-300 to-red-400 transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {taskItems.map((task) => {
                const TaskIcon = task.icon;
                return (
                  <a
                    key={task.href}
                    href={task.href}
                    className="group rounded-md border border-stone-200 bg-white p-3 text-zinc-950 transition-transform hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(108,93,72,0.14)] sm:p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className={`rounded-md border p-2 ${task.accent}`}>
                        <TaskIcon className="h-5 w-5" />
                      </div>
                      {task.done ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          已完成
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
                          <Circle className="h-3.5 w-3.5" />
                          待完成
                        </span>
                      )}
                    </div>
                    <div className="mt-3 sm:mt-4">
                      <div className="text-sm font-semibold sm:text-base">{task.title}</div>
                      <div className="mt-1 text-xs text-zinc-500 sm:text-sm">{task.description}</div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>身体概览</CardTitle>
          <CardDescription>基于个人资料和最近体重计算，仅作为记录参考</CardDescription>
        </CardHeader>
        <CardContent>
          {bmi || hasBodyProfile ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">
              <div className="rounded-lg border border-teal-200 bg-teal-50/70 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-teal-700">
                  <UserRound className="h-4 w-4" />
                  BMI
                </div>
                <div className="mt-3 text-3xl font-bold text-zinc-900">
                  {bmi ? bmi.toFixed(1) : "无法计算"}
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {bmi
                    ? `${getBmiStatus(bmi)} · 使用${visibleDisplayWeight ? "最近体重" : "初始体重"} ${bmiWeight} kg`
                    : "需要填写身高，并至少有一条体重数据"}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {bodyOverviewItems.map((item) => (
                  <div key={item.label} className="rounded-lg border border-zinc-200 bg-white/60 p-4">
                    <div className="text-sm text-zinc-500">{item.label}</div>
                    <div className="mt-2 text-lg font-bold text-zinc-900">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-200 bg-white/50 p-4 text-sm text-zinc-500">
              暂无身体基础资料。前往个人资料填写身高、出生年份、性别和活动水平后，仪表盘会显示 BMI 和身体概览。
            </div>
          )}
        </CardContent>
      </Card>

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

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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

    </div>
  );
}
