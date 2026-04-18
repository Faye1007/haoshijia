"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { addDailyRecord, getDailyRecords, getWeightHistory } from "@/lib/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Scale, TrendingDown, TrendingUp, Minus } from "lucide-react";

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

export default function WeightPage() {
  const { user } = useAuth();
  const [weight, setWeight] = useState("");
  const [recordTime, setRecordTime] = useState("");
  const [isMorning, setIsMorning] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [todayRecords, setTodayRecords] = useState<TodayRecord[]>([]);
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);
  const [viewDays, setViewDays] = useState<number>(7);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user) return;
    loadTodayRecords();
    loadHistory();
  }, [user, viewDays]);

  const loadTodayRecords = async () => {
    if (!user) return;
    const records = await getDailyRecords(user.uid, today, "weight");
    const formatted = records.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      weight: r.weight as number,
      createdAt: (r.createdAt as { toDate: () => Date }).toDate(),
      isMorning: r.isMorning as boolean,
    }));
    setTodayRecords(formatted);
    setIsLoading(false);
  };

  const loadHistory = async () => {
    if (!user) return;
    const history = await getWeightHistory(user.uid, viewDays);
    setHistoryData(history);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

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
      loadTodayRecords();
      loadHistory();
    } catch (err) {
      console.error("保存失败:", err);
      setError("保存失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  const getMorningWeight = () => {
    const morning = todayRecords.find((r) => r.isMorning);
    return morning?.weight;
  };

  const getLatestWeight = () => {
    if (todayRecords.length === 0) return null;
    return todayRecords[0].weight;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const chartData = historyData.map((point) => ({
    date: formatDate(point.date),
    weight: point.weight,
  }));

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">今日晨重</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-zinc-400" />
              <span className="text-2xl font-bold">
                {getMorningWeight() ? `${getMorningWeight()} kg` : "--"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">最新体重</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-zinc-400" />
              <span className="text-2xl font-bold">
                {getLatestWeight() ? `${getLatestWeight()} kg` : "--"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              {viewDays}天变化
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {weightChange && parseFloat(weightChange) < 0 ? (
                <TrendingDown className="h-5 w-5 text-green-500" />
              ) : weightChange && parseFloat(weightChange) > 0 ? (
                <TrendingUp className="h-5 w-5 text-red-500" />
              ) : (
                <Minus className="h-5 w-5 text-zinc-400" />
              )}
              <span className="text-2xl font-bold">
                {weightChange ? `${weightChange} kg` : "--"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

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
                  className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Scale className="h-4 w-4 text-zinc-400" />
                    <span className="font-medium">{record.weight} kg</span>
                    {record.isMorning && (
                      <span className="text-xs bg-zinc-200 px-2 py-0.5 rounded">
                        晨重
                      </span>
                    )}
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>体重趋势</CardTitle>
            <CardDescription>体重变化趋势</CardDescription>
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
          {chartData.length > 0 ? (
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
    </div>
  );
}
