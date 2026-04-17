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
import { addDailyRecord, getDailyRecords, getFoodHistory } from "@/lib/firestore";
import { UtensilsCrossed, Clock, Star, Heart, MessageSquare } from "lucide-react";

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

interface TodayRecord {
  id: string;
  mealType: string;
  foodDescription: string;
  portion: number;
  hungerLevel: number;
  triggerReason: string;
  emotion: string;
  feeling: string;
  createdAt: Date;
}

export default function FoodPage() {
  const { user } = useAuth();
  const [selectedMealType, setSelectedMealType] = useState<MealType>("breakfast");
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

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user) return;
    loadTodayRecords();
  }, [user]);

  const loadTodayRecords = async () => {
    if (!user) return;
    const records = await getFoodHistory(user.uid, today);
    const formatted: TodayRecord[] = records.map((r) => ({
      id: r.id,
      mealType: r.mealType,
      foodDescription: r.foodDescription,
      portion: r.portion,
      hungerLevel: r.hungerLevel,
      triggerReason: r.triggerReason,
      emotion: r.emotion,
      feeling: r.feeling,
      createdAt: r.createdAt,
    }));
    setTodayRecords(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!foodDescription.trim()) {
      setError("请输入食物描述");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await addDailyRecord(user.uid, today, "food", {
        mealType: selectedMealType,
        foodDescription,
        portion: portion ? parseInt(portion) : 0,
        hungerLevel,
        triggerReason: triggerReason || "unknown",
        emotion: emotion || "unknown",
        feeling,
      });
      setFoodDescription("");
      setPortion("");
      setHungerLevel(3);
      setTriggerReason("");
      setEmotion("");
      setFeeling("");
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

  const getRecordsByMealType = (mealType: string) => {
    return todayRecords.filter((r) => r.mealType === mealType);
  };

  const getSnackCount = () => {
    return todayRecords.filter((r) => 
      ["morningSnack", "afternoonSnack", "eveningSnack"].includes(r.mealType)
    ).length;
  };

  const getTriggerLabel = (value: string) => {
    const found = triggerReasons.find((r) => r.value === value);
    return found?.label || value;
  };

  const getEmotionLabel = (value: string) => {
    const found = emotions.find((e) => e.value === value);
    return found?.label || value;
  };

  const totalRecords = todayRecords.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">饮食记录</h2>
        <p className="text-zinc-500">记录您的每日饮食</p>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>记录饮��</CardTitle>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <span className="text-sm text-zinc-500">
                              {formatTime(record.createdAt)}
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
    </div>
  );
}