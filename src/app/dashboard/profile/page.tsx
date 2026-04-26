"use client";

import { useCallback, useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { AuthRequiredDialog } from "@/components/AuthRequiredDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { getUserProfile, updateUserProfile, type UserProfile } from "@/lib/firestore";

interface ProfileFormData {
  nickname: string;
  heightCm: string;
  gender: string;
  birthYear: string;
  activityLevel: string;
}

interface ProfileFormErrors {
  nickname?: string;
  heightCm?: string;
  birthYear?: string;
}

const genderOptions = [
  { value: "not_set", label: "暂不填写" },
  { value: "female", label: "女" },
  { value: "male", label: "男" },
  { value: "other", label: "其他 / 不便说明" },
];

const activityOptions = [
  { value: "not_set", label: "暂不填写" },
  { value: "low", label: "久坐为主" },
  { value: "light", label: "轻度活动" },
  { value: "moderate", label: "中等活动" },
  { value: "active", label: "较高活动" },
];

const emptyForm: ProfileFormData = {
  nickname: "",
  heightCm: "",
  gender: "not_set",
  birthYear: "",
  activityLevel: "not_set",
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>(emptyForm);
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setFormData(emptyForm);
      return;
    }

    setIsLoading(true);
    try {
      const profileData = await getUserProfile(user.uid);
      setProfile(profileData);
      setFormData({
        nickname: profileData?.nickname || "",
        heightCm: profileData?.heightCm ? profileData.heightCm.toString() : "",
        gender: profileData?.gender || "not_set",
        birthYear: profileData?.birthYear ? profileData.birthYear.toString() : "",
        activityLevel: profileData?.activityLevel || "not_set",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field in errors) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    setSaveError("");
    setSaveSuccess(false);
  };

  const validateForm = () => {
    const nextErrors: ProfileFormErrors = {};
    const nickname = formData.nickname.trim();
    const height = Number(formData.heightCm);
    const birthYear = Number(formData.birthYear);
    const currentYear = new Date().getFullYear();

    if (nickname.length > 20) {
      nextErrors.nickname = "昵称最多 20 个字";
    }

    if (formData.heightCm && (!Number.isFinite(height) || height < 100 || height > 230)) {
      nextErrors.heightCm = "身高建议填写 100-230 cm";
    }

    if (
      formData.birthYear &&
      (!Number.isInteger(birthYear) || birthYear < 1920 || birthYear > currentYear)
    ) {
      nextErrors.birthYear = `出生年份应在 1920-${currentYear} 之间`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    if (!validateForm()) return;

    setIsSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      await updateUserProfile(user.uid, {
        email: profile?.email || user.email || "",
        nickname: formData.nickname.trim(),
        heightCm: formData.heightCm ? Number(formData.heightCm) : null,
        gender: formData.gender === "not_set" ? "" : formData.gender,
        birthYear: formData.birthYear ? Number(formData.birthYear) : null,
        activityLevel: formData.activityLevel === "not_set" ? "" : formData.activityLevel,
      });
      setSaveSuccess(true);
      await loadProfile();
      window.dispatchEvent(new Event("haoshijia-profile-updated"));
    } catch (error) {
      console.error("保存个人资料失败:", error);
      setSaveError("保存失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-zinc-900" />
          <p className="text-zinc-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="pt-8 text-2xl font-bold text-zinc-900 lg:pt-0">个人资料</h2>
        <p className="text-zinc-500">设置日常称呼，并为后续 BMI 和营养目标预留基础资料</p>
      </div>

      {!user && (
        <Card className="border-sky-100 bg-sky-50/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sky-900">
              <UserRound className="h-5 w-5" />
              当前为只读浏览
            </CardTitle>
            <CardDescription className="text-sky-700">
              登录后可以保存昵称和身体基础资料。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={() => setAuthDialogOpen(true)}>
              登录后编辑资料
            </Button>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>称呼设置</CardTitle>
            <CardDescription>顶部栏和仪表盘会优先显示昵称，未设置时显示邮箱。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nickname">昵称</Label>
                <Input
                  id="nickname"
                  maxLength={20}
                  placeholder="例如：Faye"
                  value={formData.nickname}
                  onChange={(event) => handleChange("nickname", event.target.value)}
                  disabled={!user || isSaving}
                />
                {errors.nickname && <p className="text-sm text-red-500">{errors.nickname}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">账号邮箱</Label>
                <Input id="email" value={profile?.email || user?.email || ""} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>身体基础资料</CardTitle>
            <CardDescription>这些字段先用于资料沉淀，后续会用于 BMI 和轻量营养目标。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="heightCm">身高 (cm)</Label>
                <Input
                  id="heightCm"
                  type="number"
                  inputMode="decimal"
                  min="100"
                  max="230"
                  placeholder="例如：165"
                  value={formData.heightCm}
                  onChange={(event) => handleChange("heightCm", event.target.value)}
                  disabled={!user || isSaving}
                />
                {errors.heightCm && <p className="text-sm text-red-500">{errors.heightCm}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthYear">出生年份</Label>
                <Input
                  id="birthYear"
                  type="number"
                  inputMode="numeric"
                  placeholder="例如：1998"
                  value={formData.birthYear}
                  onChange={(event) => handleChange("birthYear", event.target.value)}
                  disabled={!user || isSaving}
                />
                {errors.birthYear && <p className="text-sm text-red-500">{errors.birthYear}</p>}
              </div>

              <div className="space-y-2">
                <Label>性别</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleChange("gender", value)}
                  disabled={!user || isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>活动水平</Label>
                <Select
                  value={formData.activityLevel}
                  onValueChange={(value) => handleChange("activityLevel", value)}
                  disabled={!user || isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    {activityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "保存中..." : "保存个人资料"}
              </Button>
              {saveSuccess && <p className="text-sm text-green-600">个人资料已保存</p>}
              {saveError && <p className="text-sm text-red-500">{saveError}</p>}
            </div>
          </CardContent>
        </Card>
      </form>

      <AuthRequiredDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        title="登录后编辑资料"
        description="你可以先浏览个人资料页面。需要保存昵称和身体基础资料时，请先登录或注册账号。"
      />
    </div>
  );
}
