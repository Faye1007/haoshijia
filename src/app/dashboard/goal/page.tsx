"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { getUserProfile } from "@/lib/firestore";

interface FormData {
  currentWeight: string;
  targetWeight: string;
  targetDate: string;
}

interface FormErrors {
  currentWeight?: string;
  targetWeight?: string;
  targetDate?: string;
}

export default function GoalPage() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    currentWeight: "",
    targetWeight: "",
    targetDate: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    async function loadGoal() {
      if (!user) return;
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setFormData((prev) => ({
          ...prev,
          ...(profile.currentWeight ? { currentWeight: profile.currentWeight.toString() } : {}),
          ...(profile.targetWeight ? { targetWeight: profile.targetWeight.toString() } : {}),
          ...(profile.targetDate ? { targetDate: profile.targetDate.toISOString().split("T")[0] } : {}),
        }));
      }
      setIsLoading(false);
    }
    loadGoal();
  }, [user]);

  const calculateWeeks = () => {
    const current = parseFloat(formData.currentWeight);
    const target = parseFloat(formData.targetWeight);
    if (isNaN(current) || isNaN(target) || current <= 0 || target <= 0) return null;
    const diff = current - target;
    if (diff <= 0) return null;
    return Math.ceil(diff / 0.5);
  };

  const estimatedWeeks = calculateWeeks();
  const today = new Date().toISOString().split("T")[0];

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const current = parseFloat(formData.currentWeight);
    const target = parseFloat(formData.targetWeight);

    if (!formData.currentWeight) {
      newErrors.currentWeight = "请输入当前体重";
    } else if (isNaN(current) || current < 30 || current > 300) {
      newErrors.currentWeight = "体重应在 30-300 kg 之间";
    }

    if (!formData.targetWeight) {
      newErrors.targetWeight = "请输入目标体重";
    } else if (isNaN(target) || target < 30 || target > 300) {
      newErrors.targetWeight = "目标体重应在 30-300 kg 之间";
    } else if (target >= current) {
      newErrors.targetWeight = "目标体重必须小于当前体重";
    }

    if (!formData.targetDate) {
      newErrors.targetDate = "请选择目标日期";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validate()) return;

    setIsSaving(true);
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      await setDoc(doc(db, "users", user.uid), {
        currentWeight: parseFloat(formData.currentWeight),
        targetWeight: parseFloat(formData.targetWeight),
        targetDate: new Date(formData.targetDate),
      }, { merge: true });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("保存失败:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const current = parseFloat(formData.currentWeight);
  const target = parseFloat(formData.targetWeight);

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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 pt-8 lg:pt-0">目标设定</h2>
        <p className="text-zinc-500">设置您的减重目标</p>
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
          <p>• 建议每周减重 0.5kg 左右，健康且可持续</p>
          <p>• 目标日期建议设置 3-6 个月</p>
          <p>• 当前体重为晨起空腹体重更准确</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>体重目标</CardTitle>
            <CardDescription>填写您的当前体重和目标体重</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentWeight">当前体重 (kg)</Label>
                <Input
                  id="currentWeight"
                  type="number"
                  step="0.1"
                  placeholder="例如: 70"
                  value={formData.currentWeight}
                  onChange={(e) => handleChange("currentWeight", e.target.value)}
                />
                {errors.currentWeight && (
                  <p className="text-sm text-red-500">{errors.currentWeight}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetWeight">目标体重 (kg)</Label>
                <Input
                  id="targetWeight"
                  type="number"
                  step="0.1"
                  placeholder="例如: 60"
                  value={formData.targetWeight}
                  onChange={(e) => handleChange("targetWeight", e.target.value)}
                />
                {errors.targetWeight && (
                  <p className="text-sm text-red-500">{errors.targetWeight}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetDate">目标日期</Label>
              <Input
                id="targetDate"
                type="date"
                min={today}
                value={formData.targetDate}
                onChange={(e) => handleChange("targetDate", e.target.value)}
              />
              {errors.targetDate && (
                <p className="text-sm text-red-500">{errors.targetDate}</p>
              )}
            </div>

            {estimatedWeeks && formData.targetDate && !isNaN(current) && !isNaN(target) && (
              <div className="p-4 bg-zinc-50 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600">预计周期</span>
                  <span className="font-medium">{estimatedWeeks} 周</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600">平均每周减重</span>
                  <span className="font-medium">
                    {((current - target) / estimatedWeeks).toFixed(1)} kg
                  </span>
                </div>
                {estimatedWeeks > 52 && (
                  <p className="text-sm text-amber-600 mt-2">
                    目标时间较长，建议设置更短期的小目标，有助于保持动力
                  </p>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? "保存中..." : "保存目标"}
            </Button>

            {saveSuccess && (
              <p className="text-sm text-green-600 text-center">保存成功！</p>
            )}
          </CardContent>
        </Card>
      </form>

      {formData.currentWeight && formData.targetWeight && formData.targetDate && !isNaN(current) && !isNaN(target) && (
        <Card>
          <CardHeader>
            <CardTitle>目标预览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-500">当前体重</span>
                <span className="font-medium">{current} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">目标体重</span>
                <span className="font-medium">{target} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">目标日期</span>
                <span className="font-medium">{formData.targetDate}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-zinc-500">累计需要减</span>
                <span className="font-bold text-zinc-900">
                  {(current - target).toFixed(1)} kg
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}