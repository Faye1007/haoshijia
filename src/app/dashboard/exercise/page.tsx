"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { addExerciseRecord, getExerciseHistory, ExerciseRecord } from "@/lib/firestore";
import { Dumbbell, Clock, Flame, Zap } from "lucide-react";

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

export default function ExercisePage() {
  const { user } = useAuth();
  const [exerciseType, setExerciseType] = useState("");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [intensity, setIntensity] = useState<"light" | "medium" | "high">("medium");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [todayRecords, setTodayRecords] = useState<ExerciseRecord[]>([]);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user) return;
    loadTodayRecords();
  }, [user]);

  const loadTodayRecords = async () => {
    if (!user) return;
    const records = await getExerciseHistory(user.uid, today);
    setTodayRecords(records);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!exerciseType || !duration) {
      setError("请填写运动类型和时长");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await addExerciseRecord(user.uid, today, {
        exerciseType,
        duration: parseInt(duration),
        calories: calories ? parseInt(calories) : 0,
        intensity,
      });
      setExerciseType("");
      setDuration("");
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

  const totalDuration = todayRecords.reduce((sum, r) => sum + r.duration, 0);
  const totalCalories = todayRecords.reduce((sum, r) => sum + r.calories, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 pt-8 lg:pt-0">运动记录</h2>
        <p className="text-zinc-500">记录您的每日运动</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">今日运动次数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-zinc-400" />
              <span className="text-2xl font-bold">{todayRecords.length} 次</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">运动时长</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-zinc-400" />
              <span className="text-2xl font-bold">{totalDuration} 分钟</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">消耗卡路里</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-zinc-400" />
              <span className="text-2xl font-bold">{totalCalories} kcal</span>
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
                <Label htmlFor="duration">时长 (分钟)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="例如: 30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
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
                  className="p-4 bg-zinc-50 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-zinc-200 flex items-center justify-center">
                      <Dumbbell className="h-5 w-5 text-zinc-600" />
                    </div>
                    <div>
                      <div className="font-medium">{getExerciseLabel(record.exerciseType)}</div>
                      <div className="text-sm text-zinc-500 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {record.duration} 分钟
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
                  <span className="text-sm text-zinc-500">
                    {formatTime(record.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}