"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthRequiredDialog } from "@/components/AuthRequiredDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { addDailyRecord, deleteDailyRecord, getDailyRecords, getMeasurementHistory } from "@/lib/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Ruler, TrendingDown, TrendingUp, Minus, Trash2 } from "lucide-react";

interface TodayRecord {
  id: string;
  waist: number;
  hip: number;
  thigh: number;
  upperArm: number;
  createdAt: Date;
}

interface HistoryPoint {
  date: string;
  waist: number;
  hip: number;
  thigh: number;
  upperArm: number;
}

const measurementLabels: Record<string, string> = {
  waist: "腰围",
  hip: "臀围",
  thigh: "大腿围",
  upperArm: "上臂围",
};

const measurementColors: Record<string, string> = {
  waist: "#f97316",
  hip: "#22c55e",
  thigh: "#3b82f6",
  upperArm: "#a855f7",
};

export default function MeasurementsPage() {
  const { user } = useAuth();
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [thigh, setThigh] = useState("");
  const [upperArm, setUpperArm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [todayRecords, setTodayRecords] = useState<TodayRecord[]>([]);
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);
  const [viewDays, setViewDays] = useState<number>(7);
  const [recordToDelete, setRecordToDelete] = useState<TodayRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadTodayRecords();
    loadHistory();
  }, [user, viewDays]);

  const loadTodayRecords = async () => {
    setIsLoading(true);
    if (!user) {
      setTodayRecords([]);
      setIsLoading(false);
      return;
    }
    const records = await getDailyRecords(user.uid, today, "measurement");
    const formatted = records.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      waist: r.waist as number,
      hip: r.hip as number,
      thigh: r.thigh as number,
      upperArm: r.upperArm as number,
      createdAt: (r.createdAt as { toDate?: () => Date })?.toDate?.() || new Date(),
    }));
    setTodayRecords(formatted);
    setIsLoading(false);
  };

  const loadHistory = async () => {
    if (!user) return;
    const history = await getMeasurementHistory(user.uid, viewDays);
    setHistoryData(history);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }

    const waistNum = parseFloat(waist);
    const hipNum = parseFloat(hip);
    const thighNum = parseFloat(thigh);
    const upperArmNum = parseFloat(upperArm);

    if (
      (waist && (isNaN(waistNum) || waistNum < 40 || waistNum > 200)) ||
      (hip && (isNaN(hipNum) || hipNum < 40 || hipNum > 200)) ||
      (thigh && (isNaN(thighNum) || thighNum < 20 || thighNum > 100)) ||
      (upperArm && (isNaN(upperArmNum) || upperArmNum < 15 || upperArmNum > 60))
    ) {
      setError("请输入有效的围度数值");
      return;
    }

    if (!waist && !hip && !thigh && !upperArm) {
      setError("请至少填写一项围度");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await addDailyRecord(user.uid, today, "measurement", {
        waist: waistNum || 0,
        hip: hipNum || 0,
        thigh: thighNum || 0,
        upperArm: upperArmNum || 0,
      });
      setWaist("");
      setHip("");
      setThigh("");
      setUpperArm("");
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
      await deleteDailyRecord(user.uid, today, "measurement", recordToDelete.id);
      setRecordToDelete(null);
      await Promise.all([loadTodayRecords(), loadHistory()]);
    } catch (err) {
      console.error("删除失败:", err);
      setError("删除失败，请重试");
    } finally {
      setIsDeleting(false);
    }
  };

  const getLatestRecord = () => {
    if (todayRecords.length === 0) return null;
    return todayRecords[0];
  };

  const getMeasurementChange = (key: string) => {
    if (historyData.length < 2) return null;
    const first = historyData[0][key as keyof HistoryPoint] as number;
    const last = historyData[historyData.length - 1][key as keyof HistoryPoint] as number;
    if (first && last) return (last - first).toFixed(1);
    return null;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getRecordSummary = (record: TodayRecord | null) => {
    if (!record) return "";

    return Object.entries(measurementLabels)
      .map(([key, label]) => {
        const value = record[key as keyof TodayRecord];
        return typeof value === "number" && value > 0 ? `${label} ${value} cm` : null;
      })
      .filter(Boolean)
      .join("，");
  };

  const chartData = historyData.map((point) => ({
    date: formatDate(point.date),
    waist: point.waist || undefined,
    hip: point.hip || undefined,
    thigh: point.thigh || undefined,
    upperArm: point.upperArm || undefined,
  }));

  const latestRecord = getLatestRecord();

  const renderChangeIcon = (change: string | null) => {
    if (!change) return <Minus className="h-5 w-5 text-zinc-400" />;
    const num = parseFloat(change);
    if (num < 0) return <TrendingDown className="h-5 w-5 text-green-500" />;
    if (num > 0) return <TrendingUp className="h-5 w-5 text-red-500" />;
    return <Minus className="h-5 w-5 text-zinc-400" />;
  };

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
        <h2 className="text-2xl font-bold text-zinc-900 pt-8 lg:pt-0">围度记录</h2>
        <p className="text-zinc-500">记录您的身体围度变化</p>
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
          <p>• 建议每周同一天测量，保持一致性</p>
          <p>• 腰围在肚脐上方约 2cm 处测量</p>
          <p>• 臀围在臀部最宽处测量</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        {["waist", "hip", "thigh", "upperArm"].map((key) => (
          <Card key={key}>
            <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-zinc-500">
                {measurementLabels[key]}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-400 shrink-0" />
                <span className="text-lg sm:text-2xl font-bold">
                  {latestRecord
                    ? `${latestRecord[key as keyof typeof latestRecord]} cm`
                    : "--"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {["waist", "hip", "thigh", "upperArm"].map((key) => (
          <Card key={`${key}-change`}>
            <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-zinc-500">
                {measurementLabels[key]}变化
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="flex items-center gap-2">
                {renderChangeIcon(getMeasurementChange(key))}
                <span className="text-lg sm:text-2xl font-bold">
                  {getMeasurementChange(key)
                    ? `${getMeasurementChange(key)} cm`
                    : "--"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>记录围度</CardTitle>
          <CardDescription>添加新的围度记录</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="waist">腰围 (cm)</Label>
                <Input
                  id="waist"
                  type="number"
                  step="0.1"
                  placeholder="例如: 80"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hip">臀围 (cm)</Label>
                <Input
                  id="hip"
                  type="number"
                  step="0.1"
                  placeholder="例如: 95"
                  value={hip}
                  onChange={(e) => setHip(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thigh">大腿围 (cm)</Label>
                <Input
                  id="thigh"
                  type="number"
                  step="0.1"
                  placeholder="例如: 55"
                  value={thigh}
                  onChange={(e) => setThigh(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="upperArm">上臂围 (cm)</Label>
                <Input
                  id="upperArm"
                  type="number"
                  step="0.1"
                  placeholder="例如: 30"
                  value={upperArm}
                  onChange={(e) => setUpperArm(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" disabled={isSaving}>
              {isSaving ? "保存中..." : "记录围度"}
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
            <CardDescription>{today} 的围度记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {todayRecords.map((record) => (
                <div key={record.id} className="p-3 bg-zinc-50 rounded-lg">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Ruler className="h-4 w-4 text-zinc-400 shrink-0" />
                      <span className="text-sm text-zinc-500">
                        {formatTime(record.createdAt)}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => setRecordToDelete(record)}
                      aria-label={`删除 ${formatTime(record.createdAt)} 的围度记录`}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {record.waist > 0 && (
                      <div className="text-sm">
                        腰围: {record.waist} cm
                      </div>
                    )}
                    {record.hip > 0 && (
                      <div className="text-sm">
                        臀围: {record.hip} cm
                      </div>
                    )}
                    {record.thigh > 0 && (
                      <div className="text-sm">
                        大腿围: {record.thigh} cm
                      </div>
                    )}
                    {record.upperArm > 0 && (
                      <div className="text-sm">
                        上臂围: {record.upperArm} cm
                      </div>
                    )}
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
            <CardTitle>围度趋势</CardTitle>
            <CardDescription>围度变化趋势</CardDescription>
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
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    stroke="#71717a"
                  />
                  <YAxis
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
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="waist"
                    stroke={measurementColors.waist}
                    strokeWidth={2}
                    dot={{ fill: measurementColors.waist, r: 3 }}
                    name="腰围"
                  />
                  <Line
                    type="monotone"
                    dataKey="hip"
                    stroke={measurementColors.hip}
                    strokeWidth={2}
                    dot={{ fill: measurementColors.hip, r: 3 }}
                    name="臀围"
                  />
                  <Line
                    type="monotone"
                    dataKey="thigh"
                    stroke={measurementColors.thigh}
                    strokeWidth={2}
                    dot={{ fill: measurementColors.thigh, r: 3 }}
                    name="大腿围"
                  />
                  <Line
                    type="monotone"
                    dataKey="upperArm"
                    stroke={measurementColors.upperArm}
                    strokeWidth={2}
                    dot={{ fill: measurementColors.upperArm, r: 3 }}
                    name="上臂围"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-zinc-500">
              暂无数据，请先记录围度
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除 {recordToDelete ? formatTime(recordToDelete.createdAt) : ""} 的围度记录吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          {recordToDelete && (
            <div className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">
              {getRecordSummary(recordToDelete)}
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
