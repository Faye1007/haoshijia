"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Calendar, CheckCircle, Heart, Lightbulb, Ruler, Scale, Target, TrendingUp, UtensilsCrossed, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getFoodHistory, getWeeklyData } from "@/lib/firestore";
import {
  generateDailyReview,
  generateWeeklyReview,
  getEmotionLabel,
  getTriggerLabel,
  getWeekStartDate,
  type FoodReviewRecord,
  type WeeklyReviewData,
} from "@/lib/review";

function EmptyState({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <Card>
      <CardContent className="py-10">
        <div className="mx-auto max-w-md text-center space-y-4">
          <div>
            <h3 className="font-medium text-zinc-900">{title}</h3>
            <p className="text-sm text-zinc-500 mt-1">{description}</p>
          </div>
          <Link href={href} className={buttonVariants({ variant: "outline" })}>
            {action}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReviewPage() {
  const { user } = useAuth();
  const [todayRecords, setTodayRecords] = useState<FoodReviewRecord[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];
  const weekStart = getWeekStartDate(new Date());

  useEffect(() => {
    async function loadReviewData() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [foodRecords, weekData] = await Promise.all([
          getFoodHistory(user.uid, today),
          getWeeklyData(user.uid, weekStart),
        ]);
        setTodayRecords(foodRecords);
        setWeeklyData(weekData);
      } finally {
        setIsLoading(false);
      }
    }

    loadReviewData();
  }, [user, today, weekStart]);

  const dailyReview = todayRecords.length > 0 ? generateDailyReview(todayRecords) : null;
  const weeklyReview = weeklyData && weeklyData.food.length > 0 ? generateWeeklyReview(weeklyData) : null;

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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 pt-8 lg:pt-0">复盘</h2>
        <p className="text-zinc-500">查看今日执行情况和本周趋势</p>
      </div>

      <Tabs defaultValue="daily">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="daily">今日复盘</TabsTrigger>
          <TabsTrigger value="weekly">本周复盘</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6">
          {dailyReview ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Card>
                  <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
                    <CardTitle className="text-xs font-medium text-zinc-500 sm:text-sm">今日执行度</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 shrink-0 text-blue-500 sm:h-5 sm:w-5" />
                      <span className="text-2xl font-bold text-blue-600 sm:text-3xl">{dailyReview.executionRate}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
                    <CardTitle className="text-xs font-medium text-zinc-500 sm:text-sm">触发性进食</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-orange-500 sm:h-5 sm:w-5" />
                      <span className="text-2xl font-bold text-orange-600 sm:text-3xl">{dailyReview.triggerCount} 次</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    日复盘 - {today}
                  </CardTitle>
                  <CardDescription>基于今日饮食记录自动生成</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-4 bg-zinc-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium">做得好的事</span>
                      </div>
                      <ul className="space-y-1">
                        {dailyReview.goodThings.map((item) => (
                          <li key={item} className="text-zinc-700 flex items-center gap-2">
                            <span className="text-green-500">✓</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-zinc-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">明日优先改进</span>
                      </div>
                      <ul className="space-y-1">
                        {dailyReview.improvements.map((item) => (
                          <li key={item} className="text-zinc-700 flex items-center gap-2">
                            <span className="text-amber-500">→</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <EmptyState
              title="今日还没有饮食记录"
              description="记录至少一餐后，系统会自动生成今日执行度和改进建议。"
              href="/dashboard/food"
              action="去记录饮食"
            />
          )}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-6">
          {weeklyReview ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-500">体重周变化</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Scale className="h-5 w-5 text-zinc-400" />
                      <span className={`text-2xl font-bold ${weeklyReview.weightChange < 0 ? "text-green-600" : "text-red-600"}`}>
                        {weeklyReview.weightChange > 0 ? "+" : ""}{weeklyReview.weightChange.toFixed(1)} kg
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-500">腰围变化</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Ruler className="h-5 w-5 text-zinc-400" />
                      <span className={`text-2xl font-bold ${weeklyReview.waistChange < 0 ? "text-green-600" : "text-red-600"}`}>
                        {weeklyReview.waistChange > 0 ? "+" : ""}{weeklyReview.waistChange.toFixed(1)} cm
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-500">执行度</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-zinc-400" />
                      <span className="text-2xl font-bold">{weeklyReview.executionPercent}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-500">触发性进食</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-zinc-400" />
                      <span className="text-2xl font-bold">{weeklyReview.triggerCount} 次</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    周复盘 - {weekStart} ~ {today}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-4 bg-zinc-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Scale className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">体重周均</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">{weeklyReview.avgWeight.toFixed(1)} kg</span>
                    </div>

                    <div className="p-4 bg-zinc-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Ruler className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">臀围变化</span>
                      </div>
                      <span className={`text-2xl font-bold ${weeklyReview.hipChange < 0 ? "text-green-600" : "text-red-600"}`}>
                        {weeklyReview.hipChange > 0 ? "+" : ""}{weeklyReview.hipChange.toFixed(1)} cm
                      </span>
                    </div>

                    <div className="p-4 bg-zinc-50 rounded-lg col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium">做得好的事</span>
                      </div>
                      <ul className="space-y-1">
                        {weeklyReview.goodThings.map((item) => (
                          <li key={item} className="text-zinc-700 flex items-center gap-2">
                            <span className="text-green-500">✓</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      情绪-进食关联
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {weeklyReview.emotionCorrelation.length > 0 ? (
                      <div className="space-y-2">
                        {weeklyReview.emotionCorrelation.map((item) => (
                          <div key={item.emotion} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                            <span className="font-medium">{getEmotionLabel(item.emotion)}</span>
                            <span className="text-sm text-zinc-500">平均饥饿度 {item.avgHunger.toFixed(1)} / {item.count} 次</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-500">暂无情绪数据</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                      高风险场景 TOP3
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {weeklyReview.triggerRanking.length > 0 ? (
                      <div className="space-y-2">
                        {weeklyReview.triggerRanking.map((item) => (
                          <div key={item.reason} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                            <span className="font-medium">{getTriggerLabel(item.reason)}</span>
                            <span className="text-orange-600 font-bold">{item.count} 次</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-500">暂无触发数据</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UtensilsCrossed className="h-5 w-5 text-emerald-500" />
                    本周饮食偏好
                  </CardTitle>
                  <CardDescription>根据本周饮食记录即时总结，供你和后续菜谱安排参考</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-lg bg-zinc-50 p-3">
                      <div className="mb-2 text-sm font-medium text-zinc-600">常出现的食物</div>
                      {weeklyReview.foodPreference.foods.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {weeklyReview.foodPreference.foods.map((item) => (
                            <span key={item.name} className="rounded-full bg-white px-3 py-1 text-sm text-zinc-700">
                              {item.name} · {item.count} 次
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-500">本周还看不出稳定食物偏好</p>
                      )}
                    </div>

                    <div className="rounded-lg bg-zinc-50 p-3">
                      <div className="mb-2 text-sm font-medium text-zinc-600">偏向的做法</div>
                      {weeklyReview.foodPreference.methods.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {weeklyReview.foodPreference.methods.map((item) => (
                            <span key={item.name} className="rounded-full bg-white px-3 py-1 text-sm text-zinc-700">
                              {item.name} · {item.count} 次
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-500">本周还看不出稳定做法偏好</p>
                      )}
                    </div>
                  </div>

                  <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                    {weeklyReview.foodPreference.note}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-amber-500" />
                    下周可执行策略
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {weeklyReview.strategies.map((strategy) => (
                      <li key={strategy} className="flex items-center gap-2 p-3 bg-zinc-50 rounded-lg">
                        <Zap className="h-4 w-4 text-amber-500" />
                        <span>{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          ) : (
            <EmptyState
              title="本周还没有足够的复盘数据"
              description="记录饮食后，系统会结合体重、围度和进食触发原因生成本周复盘。"
              href="/dashboard/food"
              action="去记录饮食"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
