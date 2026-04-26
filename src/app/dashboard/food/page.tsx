"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthRequiredDialog } from "@/components/AuthRequiredDialog";
import { RecordPrincipleNotice } from "@/components/RecordPrincipleNotice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { addDailyRecord, getFoodHistory, getWeeklyData, savePlan, getPlans, updatePlan, deletePlan, type Plan } from "@/lib/firestore";
import { generateDailyReview, generateWeeklyReview, getEmotionLabel, getTriggerLabel, getWeekStartDate, type FoodReviewRecord, type WeeklyReviewData } from "@/lib/review";
import { UtensilsCrossed, Clock, Star, Heart, MessageSquare, TrendingUp, AlertCircle, CheckCircle, Lightbulb, Scale, Ruler, Calendar, Target, Zap, FileText, Trash2, Edit2, Save, X } from "lucide-react";

type MealType = "breakfast" | "lunch" | "dinner" | "morningSnack" | "afternoonSnack" | "eveningSnack";

const mealTypeLabels: Record<MealType, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
  morningSnack: "上午加餐",
  afternoonSnack: "下午加餐",
  eveningSnack: "晚上加餐",
};

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "morningSnack", "afternoonSnack", "eveningSnack"];

const triggerReasons = [
  { value: "physiological", label: "生理饥饿" },
  { value: "craving", label: "口欲" },
  { value: "social", label: "社交" },
  { value: "stress", label: "压力" },
  { value: "boredom", label: "无聊" },
  { value: "habit", label: "习惯" },
  { value: "timeConflict", label: "时间冲突" },
];

const emotions = [
  { value: "calm", label: "平静" },
  { value: "anxious", label: "焦虑" },
  { value: "stressed", label: "压力" },
  { value: "happy", label: "开心" },
  { value: "sad", label: "悲伤" },
  { value: "angry", label: "愤怒" },
  { value: "bored", label: "无聊" },
];

type TodayRecord = FoodReviewRecord;

const getCurrentTimeValue = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

export default function FoodPage() {
  const { user } = useAuth();
  const [selectedMealType, setSelectedMealType] = useState<MealType>("breakfast");
  const [mealTime, setMealTime] = useState(getCurrentTimeValue);
  const [foodDescription, setFoodDescription] = useState("");
  const [portion, setPortion] = useState("");
  const [hungerLevel, setHungerLevel] = useState<number>(3);
  const [triggerReason, setTriggerReason] = useState("");
  const [emotion, setEmotion] = useState("");
  const [feeling, setFeeling] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [todayRecords, setTodayRecords] = useState<TodayRecord[]>([]);
  const [error, setError] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [activeTab, setActiveTab] = useState("daily");
  const [weeklyData, setWeeklyData] = useState<WeeklyReviewData | null>(null);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const loadTodayRecords = useCallback(async () => {
    if (!user) return;
    const records = await getFoodHistory(user.uid, today);
    const formatted: TodayRecord[] = records.map((r) => ({
      id: r.id,
      mealType: r.mealType,
      mealTime: r.mealTime,
      foodDescription: r.foodDescription,
      portion: r.portion,
      hungerLevel: r.hungerLevel,
      triggerReason: r.triggerReason,
      emotion: r.emotion,
      feeling: r.feeling,
      createdAt: r.createdAt,
    }));
    setTodayRecords(formatted);
  }, [today, user]);

  useEffect(() => {
    if (!user) return;
    loadTodayRecords();
  }, [loadTodayRecords, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }

    if (!foodDescription.trim()) {
      setError("请输入食物描述");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await addDailyRecord(user.uid, today, "food", {
        mealType: selectedMealType,
        mealTime,
        foodDescription,
        portion: portion ? parseInt(portion) : 0,
        hungerLevel,
        triggerReason: triggerReason || "unknown",
        emotion: emotion || "unknown",
        feeling,
      });
      setMealTime(getCurrentTimeValue());
      setFoodDescription("");
      setPortion("");
      setHungerLevel(3);
      setTriggerReason("");
      setEmotion("");
      setFeeling("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadTodayRecords();
    } catch (err) {
      console.error("保存失败:", err);
      setError("保存失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  };

  const getRecordDisplayTime = (record: TodayRecord) => {
    return record.mealTime || formatTime(record.createdAt);
  };

  const getRecordsByMealType = (mealType: string) => {
    return todayRecords.filter((r) => r.mealType === mealType);
  };

  const getSnackCount = () => {
    return todayRecords.filter((r) => 
      ["morningSnack", "afternoonSnack", "eveningSnack"].includes(r.mealType)
    ).length;
  };

  const loadWeeklyData = useCallback(async () => {
    if (!user) return;
    setIsLoadingWeekly(true);
    try {
      const weekStart = getWeekStartDate(new Date());
      const data = await getWeeklyData(user.uid, weekStart);
      setWeeklyData(data);
    } catch (err) {
      console.error("加载周数据失败:", err);
    } finally {
      setIsLoadingWeekly(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "weekly" && !weeklyData) {
      loadWeeklyData();
    }
  }, [activeTab, loadWeeklyData, weeklyData]);

  const loadPlans = useCallback(async () => {
    if (!user) return;
    setIsLoadingPlans(true);
    try {
      const data = await getPlans(user.uid);
      setPlans(data);
    } catch (err) {
      console.error("加载计划失败:", err);
    } finally {
      setIsLoadingPlans(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "plans" && plans.length === 0) {
      loadPlans();
    }
  }, [activeTab, loadPlans, plans.length]);

  const getNextWeekId = (startDate: Date): string => {
    const year = startDate.getFullYear();
    const week = Math.ceil((startDate.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    return `${year}-W${week}`;
  };

  const generateWeeklyPlan = async () => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    if (!weeklyReview) return;

    const weekStart = getWeekStartDate(new Date());
    const weekEndDate = new Date(weekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekEnd = weekEndDate.toISOString().split("T")[0];

    const triggerWarnings = weeklyReview.triggerRanking.map((item) => ({
      reason: item.reason,
      count: item.count,
      recommendations: [] as string[],
    }));

    for (const warning of triggerWarnings) {
      if (warning.reason === "craving") {
        warning.recommendations = ["使用无糖口香糖", "喝温水或茶", "刷牙转移注意力"];
      } else if (warning.reason === "stress") {
        warning.recommendations = ["5分钟深呼吸", "短暂散步", "给朋友打电话"];
      } else if (warning.reason === "boredom") {
        warning.recommendations = ["找件事做", "整理房间", "阅读书籍"];
      } else if (warning.reason === "habit") {
        warning.recommendations = ["换环境", "建立新习惯替代"];
      } else if (warning.reason === "social") {
        warning.recommendations = ["提前吃饱再去聚会", "选择健康食物"];
      } else if (warning.reason === "timeConflict") {
        warning.recommendations = ["提前准备健康零食", "设置提醒"];
      }
    }

    const emotionPlans = weeklyReview.emotionCorrelation.map((item) => ({
      emotion: item.emotion,
      plan: `注意${getEmotionLabel(item.emotion)}情绪时的冲动，可使用${item.avgHunger > 3 ? "深呼吸" : "短暂运动"}来转移注意力`,
    }));

    const mealSchedule: Plan["mealSchedule"] = [];
    const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
    const snackTimes = [
      { time: "10:00", type: "morningSnack", suggestion: "坚果/水果", alternative: "无糖酸奶" },
      { time: "15:30", type: "afternoonSnack", suggestion: "全麦饼干/坚果", alternative: "黑巧克力(50g)" },
      { time: "20:00", type: "eveningSnack", suggestion: "不吃或喝水", alternative: "黄瓜/番茄" },
    ];

    for (let i = 0; i < 7; i++) {
      const daySchedule: { day: string; meals: { time: string; type: string; suggestion: string; alternative: string }[] } = {
        day: days[i],
        meals: [],
      };

      daySchedule.meals.push(
        { time: "07:00", type: "breakfast", suggestion: "全麦面包+鸡蛋+牛奶", alternative: "燕麦+水果" },
        { time: "12:00", type: "lunch", suggestion: "主食+蛋白质+蔬菜", alternative: "沙拉+鸡胸肉" },
        { time: "18:30", type: "dinner", suggestion: "蛋白质+蔬菜(少吃主食)", alternative: "清蒸鱼+绿叶菜" }
      );

      if (weeklyReview.triggerCount > 3) {
        daySchedule.meals.push(...snackTimes);
      }

      mealSchedule.push(daySchedule);
    }

    const avoidFoods: string[] = [];
    if (triggerWarnings.some(w => w.reason === "craving")) {
      avoidFoods.push("高糖零食", "甜饮料", "冰淇淋");
    }
    if (triggerWarnings.some(w => w.reason === "stress")) {
      avoidFoods.push("薯片", "方便面", "油炸食品");
    }
    if (avoidFoods.length === 0) {
      avoidFoods.push("暂无特殊忌口");
    }

    await savePlan(user.uid, {
      userId: user.uid,
      weekId: getNextWeekId(new Date(weekStart)),
      weekStart,
      weekEnd,
      triggerWarnings,
      emotionPlans,
      mealSchedule,
      avoidFoods,
    });

    loadPlans();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDeletePlan = async (planId: string) => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    try {
      await deletePlan(user.uid, planId);
      loadPlans();
    } catch (err) {
      console.error("删除失败:", err);
    }
  };

  const handleUpdatePlan = async (planId: string) => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    if (!editingPlan) return;
    setIsSavingPlan(true);
    try {
      await updatePlan(user.uid, planId, {
        triggerWarnings: editingPlan.triggerWarnings,
        emotionPlans: editingPlan.emotionPlans,
        mealSchedule: editingPlan.mealSchedule,
        avoidFoods: editingPlan.avoidFoods,
      });
      setEditingPlan(null);
      loadPlans();
    } catch (err) {
      console.error("更新失败:", err);
    } finally {
      setIsSavingPlan(false);
    }
  };

  const weeklyReview = weeklyData && weeklyData.food.length > 0 ? generateWeeklyReview(weeklyData) : null;
  const review = todayRecords.length > 0 ? generateDailyReview(todayRecords) : null;

  const totalRecords = todayRecords.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 pt-8 lg:pt-0">饮食记录</h2>
        <p className="text-zinc-500">记录您的每日饮食</p>
      </div>

      <RecordPrincipleNotice />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">日复盘</TabsTrigger>
          <TabsTrigger value="weekly">周复盘</TabsTrigger>
          <TabsTrigger value="plans">周计划</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">今日记录</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5 text-zinc-400" />
                  <span className="text-2xl font-bold">{totalRecords} 餐</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">加餐次数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-zinc-400" />
                  <span className="text-2xl font-bold">{getSnackCount()} 次</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">平均饥饿度</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-zinc-400" />
                  <span className="text-2xl font-bold">
                    {totalRecords > 0 
                      ? (todayRecords.reduce((sum, r) => sum + r.hungerLevel, 0) / totalRecords).toFixed(1)
                      : "--"
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {todayRecords.length > 0 && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowReview(!showReview)}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {showReview ? "收起复盘" : "查看今日复盘"}
            </Button>
          )}

          {showReview && review && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  日复盘 - {today}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">今日执行度</span>
                    </div>
                    <span className="text-3xl font-bold text-blue-600">{review.executionRate}%</span>
                  </div>

                  <div className="p-4 bg-zinc-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">触发性进食</span>
                    </div>
                    <span className="text-3xl font-bold text-orange-600">{review.triggerCount} 次</span>
                  </div>

                  <div className="p-4 bg-zinc-50 rounded-lg md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">做得好的事</span>
                    </div>
                    <ul className="space-y-1">
                      {review.goodThings.map((item, idx) => (
                        <li key={idx} className="text-zinc-700 flex items-center gap-2">
                          <span className="text-green-500">✓</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-zinc-50 rounded-lg md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      <span className="font-medium">明日优先改进</span>
                    </div>
                    <ul className="space-y-1">
                      {review.improvements.map((item, idx) => (
                        <li key={idx} className="text-zinc-700 flex items-center gap-2">
                          <span className="text-amber-500">→</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>记录饮食</CardTitle>
              <CardDescription>选择时段并填写饮食详情</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {mealTypes.map((type) => (
                <Button
                  key={type}
                  variant={selectedMealType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMealType(type)}
                >
                  {mealTypeLabels[type]}
                </Button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mealTime">进食时间</Label>
                  <Input
                    id="mealTime"
                    type="time"
                    value={mealTime}
                    onChange={(e) => setMealTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="foodDescription">食物描述</Label>
                  <Input
                    id="foodDescription"
                    placeholder="例如: 全麦面包+鸡蛋+牛奶"
                    value={foodDescription}
                    onChange={(e) => setFoodDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portion">份量 (克)</Label>
                  <Input
                    id="portion"
                    type="number"
                    placeholder="例如: 200"
                    value={portion}
                    onChange={(e) => setPortion(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>饥饿评分 (1-5)</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setHungerLevel(level)}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                          hungerLevel === level
                            ? "bg-zinc-900 text-white"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="triggerReason">触发原因</Label>
                  <Select value={triggerReason} onValueChange={setTriggerReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择原因" />
                    </SelectTrigger>
                    <SelectContent>
                      {triggerReasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emotion">情绪状态</Label>
                  <Select value={emotion} onValueChange={setEmotion}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择情绪" />
                    </SelectTrigger>
                    <SelectContent>
                      {emotions.map((emotionItem) => (
                        <SelectItem key={emotionItem.value} value={emotionItem.value}>
                          {emotionItem.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feeling">吃后感受</Label>
                <Input
                  id="feeling"
                  placeholder="例如: 7分饱，满足"
                  value={feeling}
                  onChange={(e) => setFeeling(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" disabled={isSaving}>
                {isSaving ? "保存中..." : "记录饮食"}
              </Button>

              {saveSuccess && (
                <p className="text-sm text-green-600">记录成功！</p>
              )}
            </form>
          </div>
        </CardContent>
      </Card>

      {todayRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>今日饮食记录</CardTitle>
            <CardDescription>{today} 的饮食记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mealTypes.map((type) => {
                const records = getRecordsByMealType(type);
                if (records.length === 0) return null;
                
                return (
                  <div key={type}>
                    <h3 className="text-sm font-medium text-zinc-500 mb-2">
                      {mealTypeLabels[type]}
                    </h3>
                    <div className="space-y-2">
                      {records.map((record) => (
                        <div
                          key={record.id}
                          className="p-3 bg-zinc-50 rounded-lg space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{record.foodDescription}</span>
                            <span className="flex items-center gap-1 text-sm text-zinc-500">
                              <Clock className="h-3 w-3" />
                              {getRecordDisplayTime(record)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-zinc-500">
                            {record.portion > 0 && (
                              <span>{record.portion}克</span>
                            )}
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              饥饿{record.hungerLevel}
                            </span>
                            {record.triggerReason !== "unknown" && (
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {getTriggerLabel(record.triggerReason)}
                              </span>
                            )}
                            {record.emotion !== "unknown" && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {getEmotionLabel(record.emotion)}
                              </span>
                            )}
                            {record.feeling && (
                              <span className="text-zinc-600">{record.feeling}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      </TabsContent>

      <TabsContent value="weekly" className="space-y-6">
          {isLoadingWeekly ? (
            <Card>
              <CardContent className="py-10">
                <p className="text-center text-zinc-500">加载中...</p>
              </CardContent>
            </Card>
          ) : weeklyReview ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    周复盘 - {getWeekStartDate(new Date())} ~ {today}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div className="p-4 bg-zinc-50 rounded-lg md:col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium">做得好的事</span>
                      </div>
                      <ul className="space-y-1">
                        {weeklyReview.goodThings.map((item, idx) => (
                          <li key={idx} className="text-zinc-700 flex items-center gap-2">
                            <span className="text-green-500">✓</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    情绪-进食关联分析
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {weeklyReview.emotionCorrelation.length > 0 ? (
                    <div className="space-y-2">
                      {weeklyReview.emotionCorrelation.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                          <span className="font-medium">{getEmotionLabel(item.emotion)}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-zinc-500">平均饥饿度: {item.avgHunger.toFixed(1)}</span>
                            <span className="text-sm text-zinc-500">{item.count} 次</span>
                          </div>
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
                      {weeklyReview.triggerRanking.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-amber-500" />
                    下周可执行策略
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {weeklyReview.strategies.map((strategy, idx) => (
                      <li key={idx} className="flex items-center gap-2 p-3 bg-zinc-50 rounded-lg">
                        <Zap className="h-4 w-4 text-amber-500" />
                        <span>{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-10">
                <p className="text-center text-zinc-500">暂无周数据，请先记录每日饮食</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          {weeklyReview && weeklyReview.triggerRanking.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  生成下周计划
                </CardTitle>
                <CardDescription>根据本周复盘数据生成下周饮食计划</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={generateWeeklyPlan} disabled={isSaving}>
                  <Zap className="h-4 w-4 mr-2" />
                  一键生成下周计划
                </Button>
                {saveSuccess && <p className="text-sm text-green-600 mt-2">计划生成成功！</p>}
              </CardContent>
            </Card>
          )}

          {isLoadingPlans ? (
            <Card>
              <CardContent className="py-10">
                <p className="text-center text-zinc-500">加载中...</p>
              </CardContent>
            </Card>
          ) : plans.length > 0 ? (
            <div className="space-y-6">
              {plans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {plan.weekStart} ~ {plan.weekEnd}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPlan(plan)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePlan(plan.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingPlan?.id === plan.id ? (
                      <div className="space-y-4">
                        <div>
                          <Label className="mb-2 block">忌口食物（用逗号分隔）</Label>
                          <Input
                            value={editingPlan.avoidFoods.join(", ")}
                            onChange={(e) =>
                              setEditingPlan({
                                ...editingPlan,
                                avoidFoods: e.target.value.split(",").map((s) => s.trim()),
                              })
                            }
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleUpdatePlan(plan.id)} disabled={isSavingPlan}>
                            <Save className="h-4 w-4 mr-2" />
                            保存
                          </Button>
                          <Button variant="outline" onClick={() => setEditingPlan(null)}>
                            <X className="h-4 w-4 mr-2" />
                            取消
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {plan.triggerWarnings && plan.triggerWarnings.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-orange-500" />
                              高风险触发预警
                            </h4>
                            <div className="space-y-2">
                              {plan.triggerWarnings.map((warning, idx) => (
                                <div key={idx} className="p-3 bg-zinc-50 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{getTriggerLabel(warning.reason)}</span>
                                    <span className="text-orange-600 font-bold">{warning.count} 次</span>
                                  </div>
                                  {warning.recommendations.length > 0 && (
                                    <ul className="mt-2 text-sm text-zinc-600 space-y-1">
                                      {warning.recommendations.map((rec, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                          <span className="text-green-500">→</span> {rec}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {plan.emotionPlans && plan.emotionPlans.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <Heart className="h-4 w-4 text-red-500" />
                              情绪应对计划
                            </h4>
                            <div className="space-y-2">
                              {plan.emotionPlans.map((item, idx) => (
                                <div key={idx} className="p-3 bg-zinc-50 rounded-lg">
                                  <span className="font-medium">{getEmotionLabel(item.emotion)}</span>
                                  <p className="text-sm text-zinc-600">{item.plan}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {plan.mealSchedule && plan.mealSchedule.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-500" />
                              下周饮食安排
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {plan.mealSchedule.slice(0, 7).map((daySchedule, idx) => (
                                <div key={idx} className="p-3 bg-zinc-50 rounded-lg">
                                  <h5 className="font-medium mb-2">{daySchedule.day}</h5>
                                  <div className="space-y-1 text-sm">
                                    {daySchedule.meals.map((meal, i) => (
                                      <div key={i} className="flex items-start gap-2">
                                        <span className="text-zinc-400 w-12">{meal.time}</span>
                                        <div>
                                          <span>{getTriggerLabel(meal.type) || meal.type}</span>
                                          <span className="text-zinc-500 ml-2">{meal.suggestion}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {plan.avoidFoods && plan.avoidFoods.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <X className="h-4 w-4 text-red-500" />
                              避免食物
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {plan.avoidFoods.map((food, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm"
                                >
                                  {food}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10">
                <p className="text-center text-zinc-500">暂无周计划，请在周复盘 Tab 生成计划</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      <AuthRequiredDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
}
