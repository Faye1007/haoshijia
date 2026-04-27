"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthRequiredDialog } from "@/components/AuthRequiredDialog";
import { RecordPrincipleNotice } from "@/components/RecordPrincipleNotice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  addDailyRecord,
  deleteDailyRecord,
  getDailyRecords,
  getLatestDisplayWeight,
  getUserProfile,
  getWeightHistory,
  updateUserProfile,
  type DisplayWeight,
  type UserProfile,
} from "@/lib/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronDown, ChevronUp, Scale, Target, TrendingDown, TrendingUp, Minus, Trash2 } from "lucide-react";

interface TodayRecord {
  id: string;
  weight: number;
  createdAt: Date;
  isMorning: boolean;
}

interface HistoryPoint {
  date: string;
  weight: number;
}

interface ChartPoint {
  date: string;
  weight: number | null;
}

interface GoalFormData {
  currentWeight: string;
  targetWeight: string;
  targetDate: string;
}

interface GoalFormErrors {
  currentWeight?: string;
  targetWeight?: string;
  targetDate?: string;
}

export default function WeightPage() {
  const { user } = useAuth();
  const [weight, setWeight] = useState("");
  const [recordTime, setRecordTime] = useState("");
  const [isMorning, setIsMorning] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [goalSaveSuccess, setGoalSaveSuccess] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [todayRecords, setTodayRecords] = useState<TodayRecord[]>([]);
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayWeight, setDisplayWeight] = useState<DisplayWeight | null>(null);
  const [viewDays, setViewDays] = useState<number>(7);
  const [recordToDelete, setRecordToDelete] = useState<TodayRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [goalErrors, setGoalErrors] = useState<GoalFormErrors>({});
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [goalFormData, setGoalFormData] = useState<GoalFormData>({
    currentWeight: "",
    targetWeight: "",
    targetDate: "",
  });

  const today = new Date().toISOString().split("T")[0];

  const loadTodayRecords = useCallback(async () => {
    if (!user) {
      setTodayRecords([]);
      setIsLoading(false);
      return;
    }
    const records = await getDailyRecords(user.uid, today, "weight");
    const formatted = records.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      weight: r.weight as number,
      createdAt: (r.createdAt as { toDate: () => Date }).toDate(),
      isMorning: r.isMorning as boolean,
    }));
    setTodayRecords(formatted);
    setIsLoading(false);
  }, [today, user]);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    const history = await getWeightHistory(user.uid, viewDays);
    setHistoryData(history);
  }, [user, viewDays]);

  const loadGoalData = useCallback(async () => {
    if (!user) return;
    const [profileData, weightData] = await Promise.all([
      getUserProfile(user.uid),
      getLatestDisplayWeight(user.uid, today),
    ]);

    setProfile(profileData);
    setDisplayWeight(weightData);

    if (profileData) {
      setGoalFormData((prev) => ({
        ...prev,
        ...(profileData.currentWeight ? { currentWeight: profileData.currentWeight.toString() } : {}),
        ...(profileData.targetWeight ? { targetWeight: profileData.targetWeight.toString() } : {}),
        ...(profileData.targetDate ? { targetDate: profileData.targetDate.toISOString().split("T")[0] } : {}),
      }));
    }
  }, [today, user]);

  const refreshWeightData = useCallback(async () => {
    await Promise.all([loadTodayRecords(), loadHistory(), loadGoalData()]);
  }, [loadGoalData, loadHistory, loadTodayRecords]);

  useEffect(() => {
    refreshWeightData();
  }, [refreshWeightData, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum < 20 || weightNum > 300) {
      setError("请输入有效的体重 (20-300 kg)");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await addDailyRecord(user.uid, today, "weight", {
        weight: weightNum,
        recordTime: recordTime || new Date().toISOString(),
        isMorning,
      });
      setWeight("");
      setRecordTime("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      refreshWeightData();
    } catch (err) {
      console.error("保存失败:", err);
      setError("保存失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    if (!user) {
      setRecordToDelete(null);
      setAuthDialogOpen(true);
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      await deleteDailyRecord(user.uid, today, "weight", recordToDelete.id);
      setRecordToDelete(null);
      await refreshWeightData();
    } catch (err) {
      console.error("删除失败:", err);
      setError("删除失败，请重试");
    } finally {
      setIsDeleting(false);
    }
  };

  const validateGoal = (): boolean => {
    const newErrors: GoalFormErrors = {};
    const current = parseFloat(goalFormData.currentWeight);
    const target = parseFloat(goalFormData.targetWeight);

    if (!goalFormData.currentWeight) {
      newErrors.currentWeight = "请输入初始体重";
    } else if (isNaN(current) || current < 30 || current > 300) {
      newErrors.currentWeight = "体重应在 30-300 kg 之间";
    }

    if (!goalFormData.targetWeight) {
      newErrors.targetWeight = "请输入目标体重";
    } else if (isNaN(target) || target < 30 || target > 300) {
      newErrors.targetWeight = "目标体重应在 30-300 kg 之间";
    } else if (!isNaN(current) && target >= current) {
      newErrors.targetWeight = "目标体重必须小于初始体重";
    }

    if (!goalFormData.targetDate) {
      newErrors.targetDate = "请选择目标日期";
    }

    setGoalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    if (!validateGoal()) return;

    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, {
        currentWeight: parseFloat(goalFormData.currentWeight),
        targetWeight: parseFloat(goalFormData.targetWeight),
        targetDate: new Date(goalFormData.targetDate),
      });
      setGoalSaveSuccess(true);
      setTimeout(() => setGoalSaveSuccess(false), 3000);
      await loadGoalData();
    } catch (err) {
      console.error("保存目标失败:", err);
      setGoalErrors((prev) => ({ ...prev, targetDate: "保存失败，请重试" }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoalChange = (field: keyof GoalFormData, value: string) => {
    setGoalFormData((prev) => ({ ...prev, [field]: value }));
    if (goalErrors[field]) {
      setGoalErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const chartData: ChartPoint[] = (() => {
    if (viewDays !== 7) {
      return historyData.map((point) => ({
        date: formatDate(point.date),
        weight: point.weight,
      }));
    }

    const historyByDate = new Map(historyData.map((point) => [point.date, point.weight]));
    const todayDate = new Date(today);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(todayDate);
      date.setDate(todayDate.getDate() - (6 - index));
      const dateStr = date.toISOString().split("T")[0];

      return {
        date: formatDate(dateStr),
        weight: historyByDate.get(dateStr) ?? null,
      };
    });
  })();
  const hasChartData = chartData.some((point) => point.weight !== null);

  const current = parseFloat(goalFormData.currentWeight);
  const target = parseFloat(goalFormData.targetWeight);
  const targetDiff = profile?.targetWeight && displayWeight
    ? displayWeight.weight - profile.targetWeight
    : null;
  const estimatedWeeks = !isNaN(current) && !isNaN(target) && current > target
    ? Math.ceil((current - target) / 0.5)
    : null;

  const weightChange = historyData.length >= 2
    ? (historyData[historyData.length - 1].weight - historyData[0].weight).toFixed(1)
    : null;

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
        <h2 className="text-2xl font-bold text-zinc-900 pt-8 lg:pt-0">体重记录</h2>
        <p className="text-zinc-500">记录您的体重变化</p>
      </div>

      <RecordPrincipleNotice />

      <div className="flex justify-end">
        <button
          onClick={() => setShowHint(!showHint)}
          className="text-sm text-zinc-400 hover:text-zinc-600"
        >
          {showHint ? "收起提示" : "查看建议"}
        </button>
      </div>

      {showHint && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          <p>• 建议每天晨起空腹称重，数据更准确</p>
          <p>• 固定时间称重，便于对比</p>
          <p>• 晨起体重是最轻的体重</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 sm:text-sm">今日体重</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            {displayWeight ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 shrink-0 text-zinc-400 sm:h-5 sm:w-5" />
                  <span className="text-lg font-bold sm:text-2xl">{displayWeight.weight} kg</span>
                </div>
                <div className="text-xs text-zinc-500">
                  {displayWeight.source === "today"
                    ? displayWeight.isMorning ? "今日晨起体重" : "今日最新记录"
                    : `最近记录：${displayWeight.date}`}
                </div>
              </div>
            ) : (
              <div className="text-lg text-zinc-400">未记录</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 sm:text-sm">初始体重</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 shrink-0 text-zinc-400 sm:h-5 sm:w-5" />
              <span className="text-lg font-bold sm:text-2xl">
                {profile?.currentWeight ? `${profile.currentWeight} kg` : "--"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 sm:text-sm">目标体重</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 shrink-0 text-zinc-400 sm:h-5 sm:w-5" />
              <span className="text-lg font-bold sm:text-2xl">
                {profile?.targetWeight ? `${profile.targetWeight} kg` : "--"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 sm:text-sm">剩余差距</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="flex items-center gap-2">
              {targetDiff !== null && targetDiff < 0 ? (
                <TrendingDown className="h-4 w-4 shrink-0 text-green-500 sm:h-5 sm:w-5" />
              ) : targetDiff !== null && targetDiff > 0 ? (
                <TrendingUp className="h-4 w-4 shrink-0 text-red-500 sm:h-5 sm:w-5" />
              ) : (
                <Minus className="h-4 w-4 shrink-0 text-zinc-400 sm:h-5 sm:w-5" />
              )}
              <span className="text-lg font-bold sm:text-2xl">
                {targetDiff !== null ? `${targetDiff.toFixed(1)} kg` : "--"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <form id="goal-settings" onSubmit={handleGoalSubmit}>
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>体重目标</CardTitle>
              <CardDescription>在这里设置初始体重、目标体重和目标日期</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsGoalFormOpen((open) => !open)}
            >
              {isGoalFormOpen ? "收起目标设置" : "设置目标"}
              {isGoalFormOpen ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          </CardHeader>
          {isGoalFormOpen && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentWeight">初始体重 (kg)</Label>
                  <Input
                    id="currentWeight"
                    type="number"
                    step="0.1"
                    placeholder="例如: 70"
                    value={goalFormData.currentWeight}
                    onChange={(e) => handleGoalChange("currentWeight", e.target.value)}
                  />
                  {goalErrors.currentWeight && (
                    <p className="text-sm text-red-500">{goalErrors.currentWeight}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetWeight">目标体重 (kg)</Label>
                  <Input
                    id="targetWeight"
                    type="number"
                    step="0.1"
                    placeholder="例如: 60"
                    value={goalFormData.targetWeight}
                    onChange={(e) => handleGoalChange("targetWeight", e.target.value)}
                  />
                  {goalErrors.targetWeight && (
                    <p className="text-sm text-red-500">{goalErrors.targetWeight}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetDate">目标日期</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    min={today}
                    value={goalFormData.targetDate}
                    onChange={(e) => handleGoalChange("targetDate", e.target.value)}
                  />
                  {goalErrors.targetDate && (
                    <p className="text-sm text-red-500">{goalErrors.targetDate}</p>
                  )}
                </div>
              </div>

              {estimatedWeeks && goalFormData.targetDate && (
                <div className="p-4 bg-zinc-50 rounded-lg grid grid-cols-3 gap-2 text-sm md:gap-3">
                  <div>
                    <div className="text-zinc-500">预计周期</div>
                    <div className="font-medium">{estimatedWeeks} 周</div>
                  </div>
                  <div>
                    <div className="text-zinc-500">平均每周减重</div>
                    <div className="font-medium">
                      {((current - target) / estimatedWeeks).toFixed(1)} kg
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500">累计需要减</div>
                    <div className="font-medium">{(current - target).toFixed(1)} kg</div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "保存中..." : "保存目标"}
                </Button>

                {goalSaveSuccess && (
                  <p className="text-sm text-green-600">目标保存成功！</p>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>记录体重</CardTitle>
          <CardDescription>添加新的体重记录</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">体重 (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="例如: 70.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recordTime">记录时间</Label>
                <Input
                  id="recordTime"
                  type="time"
                  value={recordTime}
                  onChange={(e) => setRecordTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <div className="flex items-center gap-2 h-10">
                  <input
                    id="isMorning"
                    type="checkbox"
                    checked={isMorning}
                    onChange={(e) => setIsMorning(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="isMorning" className="font-normal cursor-pointer">
                    晨起体重
                  </Label>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" disabled={isSaving}>
              {isSaving ? "保存中..." : "记录体重"}
            </Button>

            {saveSuccess && (
              <p className="text-sm text-green-600">记录成功！</p>
            )}
          </form>
        </CardContent>
      </Card>

      {todayRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>今日记录</CardTitle>
            <CardDescription>{today} 的体重记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todayRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between gap-3 p-3 bg-zinc-50 rounded-lg"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Scale className="h-4 w-4 text-zinc-400" />
                    <span className="font-medium">{record.weight} kg</span>
                    {record.isMorning && (
                      <span className="text-xs bg-zinc-200 px-2 py-0.5 rounded">
                        晨重
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm text-zinc-500">
                      {formatTime(record.createdAt)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setRecordToDelete(record)}
                      aria-label={`删除 ${formatTime(record.createdAt)} 的体重记录`}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>体重趋势</CardTitle>
            <CardDescription>
              {weightChange ? `${viewDays} 天变化 ${weightChange} kg` : "体重变化趋势"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewDays === 7 ? "default" : "outline"}
              size="sm"
              onClick={() => setViewDays(7)}
            >
              7天
            </Button>
            <Button
              variant={viewDays === 30 ? "default" : "outline"}
              size="sm"
              onClick={() => setViewDays(30)}
            >
              30天
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {hasChartData ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    stroke="#71717a"
                  />
                  <YAxis
                    domain={["dataMin - 1", "dataMax + 1"]}
                    tick={{ fontSize: 12 }}
                    stroke="#71717a"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e4e4e7",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#18181b"
                    strokeWidth={2}
                    dot={{ fill: "#18181b", r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-zinc-500">
              暂无数据，请先记录体重
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除 {recordToDelete ? formatTime(recordToDelete.createdAt) : ""} 的体重记录吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          {recordToDelete && (
            <div className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">
              {recordToDelete.weight} kg{recordToDelete.isMorning ? "，晨起体重" : ""}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRecordToDelete(null)}
              disabled={isDeleting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "删除中..." : "删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AuthRequiredDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
}
