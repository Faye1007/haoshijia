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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { addExerciseRecord, deleteDailyRecord, getExerciseHistory, ExerciseRecord } from "@/lib/firestore";
import { Dumbbell, Clock, Flame, Zap, Trash2 } from "lucide-react";

const exerciseTypes = [
  { value: "running", label: "跑步" },
  { value: "walking", label: "走路" },
  { value: "cycling", label: "骑行" },
  { value: "swimming", label: "游泳" },
  { value: "strength", label: "力量训练" },
  { value: "yoga", label: "瑜伽" },
  { value: "hiit", label: "HIIT" },
  { value: "other", label: "其他" },
];

const intensityOptions = [
  { value: "light", label: "轻度", description: "轻松、不喘" },
  { value: "medium", label: "中等", description: "有些喘、出汗" },
  { value: "high", label: "高强度", description: "很喘、大量出汗" },
];

const exerciseUnitOptions = [
  { value: "minutes", label: "分钟", placeholder: "例如: 30" },
  { value: "steps", label: "步", placeholder: "例如: 8000" },
  { value: "kilometers", label: "公里", placeholder: "例如: 5" },
  { value: "reps", label: "次", placeholder: "例如: 20" },
  { value: "sets", label: "组", placeholder: "例如: 4" },
  { value: "laps", label: "圈", placeholder: "例如: 10" },
  { value: "custom", label: "自定义", placeholder: "填写运动量" },
];

export default function ExercisePage() {
  const { user } = useAuth();
  const [exerciseType, setExerciseType] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("minutes");
  const [customUnit, setCustomUnit] = useState("");
  const [calories, setCalories] = useState("");
  const [intensity, setIntensity] = useState<"light" | "medium" | "high">("medium");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [todayRecords, setTodayRecords] = useState<ExerciseRecord[]>([]);
  const [recordToDelete, setRecordToDelete] = useState<ExerciseRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const loadTodayRecords = useCallback(async () => {
    if (!user) return;
    const records = await getExerciseHistory(user.uid, today);
    setTodayRecords(records);
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

    const amountValue = Number(amount);
    const customUnitValue = customUnit.trim();

    if (!exerciseType || !amount) {
      setError("请填写运动类型和运动量");
      return;
    }

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setError("运动量必须大于 0");
      return;
    }

    if (unit === "custom" && !customUnitValue) {
      setError("请填写自定义单位");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const exerciseRecord: Omit<ExerciseRecord, "id" | "createdAt"> = {
        exerciseType,
        amount: amountValue,
        unit,
        calories: calories ? Number(calories) : 0,
        intensity,
      };

      if (unit === "custom") {
        exerciseRecord.customUnit = customUnitValue;
      }
      if (unit === "minutes") {
        exerciseRecord.duration = amountValue;
      }

      await addExerciseRecord(user.uid, today, exerciseRecord);
      setExerciseType("");
      setAmount("");
      setUnit("minutes");
      setCustomUnit("");
      setCalories("");
      setIntensity("medium");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadTodayRecords();
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
      await deleteDailyRecord(user.uid, today, "exercise", recordToDelete.id);
      setRecordToDelete(null);
      await loadTodayRecords();
    } catch (err) {
      console.error("删除失败:", err);
      setError("删除失败，请重试");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  };

  const getExerciseLabel = (value: string) => {
    const found = exerciseTypes.find((e) => e.value === value);
    return found?.label || value;
  };

  const getIntensityLabel = (value: string) => {
    const found = intensityOptions.find((i) => i.value === value);
    return found?.label || value;
  };

  const getUnitLabel = (recordUnit: string, recordCustomUnit?: string) => {
    if (recordUnit === "custom") {
      return recordCustomUnit || "自定义";
    }
    const found = exerciseUnitOptions.find((option) => option.value === recordUnit);
    return found?.label || recordUnit;
  };

  const formatExerciseAmount = (record: ExerciseRecord) => {
    const value = Number.isInteger(record.amount) ? record.amount : Number(record.amount.toFixed(2));
    return `${value} ${getUnitLabel(record.unit, record.customUnit)}`;
  };

  const selectedUnit = exerciseUnitOptions.find((option) => option.value === unit);
  const groupedAmounts = todayRecords.reduce<Record<string, number>>((totals, record) => {
    const label = getUnitLabel(record.unit, record.customUnit);
    totals[label] = (totals[label] || 0) + record.amount;
    return totals;
  }, {});
  const amountSummary = Object.entries(groupedAmounts)
    .map(([label, value]) => {
      const formattedValue = Number.isInteger(value) ? value : Number(value.toFixed(2));
      return `${formattedValue} ${label}`;
    })
    .join(" / ");
  const totalCalories = todayRecords.reduce((sum, r) => sum + r.calories, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 pt-8 lg:pt-0">运动记录</h2>
        <p className="text-zinc-500">记录您的每日运动</p>
      </div>

      <RecordPrincipleNotice />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 sm:text-sm">今日运动次数</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 shrink-0 text-zinc-400 sm:h-5 sm:w-5" />
              <span className="text-lg font-bold sm:text-2xl">{todayRecords.length} 次</span>
            </div>
          </CardContent>
        </Card>

        <Card className="order-3 col-span-2 md:order-none md:col-span-1">
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 sm:text-sm">运动量记录</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-zinc-400 sm:h-5 sm:w-5" />
              <span className="text-lg font-bold break-words">
                {amountSummary || "未记录"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="order-2 md:order-none">
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 sm:text-sm">消耗卡路里</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 shrink-0 text-zinc-400 sm:h-5 sm:w-5" />
              <span className="text-lg font-bold sm:text-2xl">{totalCalories} kcal</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>记录运动</CardTitle>
          <CardDescription>填写运动详情</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exerciseType">运动类型</Label>
                <Select value={exerciseType} onValueChange={setExerciseType}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择运动类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {exerciseTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">运动量</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="any"
                  placeholder={selectedUnit?.placeholder || "填写运动量"}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">运动量单位</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger id="unit">
                    <SelectValue placeholder="选择单位" />
                  </SelectTrigger>
                  <SelectContent>
                    {exerciseUnitOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {unit === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="customUnit">自定义单位</Label>
                  <Input
                    id="customUnit"
                    placeholder="例如: 分钟高抬腿"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calories">消耗卡路里 (kcal)</Label>
                <Input
                  id="calories"
                  type="number"
                  placeholder="可选，自动计算"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>运动强度</Label>
                <div className="flex gap-2">
                  {intensityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setIntensity(option.value as "light" | "medium" | "high")}
                      className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                        intensity === option.value
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" disabled={isSaving}>
              {isSaving ? "保存中..." : "记录运动"}
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
            <CardTitle>今日运动记录</CardTitle>
            <CardDescription>{today} 的运动记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayRecords.map((record) => (
                <div
                  key={record.id}
                  className="p-4 bg-zinc-50 rounded-lg flex items-center justify-between gap-3"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-zinc-200 flex items-center justify-center">
                      <Dumbbell className="h-5 w-5 text-zinc-600" />
                    </div>
                    <div>
                      <div className="font-medium">{getExerciseLabel(record.exerciseType)}</div>
                      <div className="text-sm text-zinc-500 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatExerciseAmount(record)}
                        </span>
                        {record.calories > 0 && (
                          <span className="flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            {record.calories} kcal
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {getIntensityLabel(record.intensity)}
                        </span>
                      </div>
                    </div>
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
                      aria-label={`删除 ${formatTime(record.createdAt)} 的运动记录`}
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
      <Dialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除 {recordToDelete ? formatTime(recordToDelete.createdAt) : ""} 的运动记录吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          {recordToDelete && (
            <div className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">
              <div className="font-medium text-zinc-900">
                {getExerciseLabel(recordToDelete.exerciseType)}
              </div>
              <div className="mt-1">
                {formatExerciseAmount(recordToDelete)}
                {recordToDelete.calories > 0 ? `，${recordToDelete.calories} kcal` : ""}
              </div>
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
