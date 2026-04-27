"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldAlert, Trash2, UserRound, UserX } from "lucide-react";
import { AuthRequiredDialog } from "@/components/AuthRequiredDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  clearUserHistoryData,
  deleteUserData,
  getUserProfile,
  updateUserProfile,
  type UserProfile,
} from "@/lib/firestore";
import { firebaseDeleteCurrentUser, firebaseReauthenticateWithPassword } from "@/lib/auth";

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

const clearHistoryConfirmText = "清除历史数据";
const deleteAccountConfirmText = "注销账号";

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
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearConfirm, setClearConfirm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [dangerError, setDangerError] = useState("");
  const [dangerSuccess, setDangerSuccess] = useState("");
  const [isClearing, setIsClearing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const resetDangerState = () => {
    setDangerError("");
    setDangerSuccess("");
  };

  const openClearDialog = () => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    resetDangerState();
    setClearConfirm("");
    setClearDialogOpen(true);
  };

  const openDeleteDialog = () => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    resetDangerState();
    setDeleteConfirm("");
    setDeletePassword("");
    setDeleteDialogOpen(true);
  };

  const handleClearHistory = async () => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }

    if (clearConfirm.trim() !== clearHistoryConfirmText) {
      setDangerError(`请输入“${clearHistoryConfirmText}”后再继续`);
      return;
    }

    setIsClearing(true);
    setDangerError("");
    setDangerSuccess("");

    try {
      await clearUserHistoryData(user.uid, profile?.createdAt);
      setClearDialogOpen(false);
      setClearConfirm("");
      setDangerSuccess("历史数据已清除，账号和基础资料仍然保留。");
      await loadProfile();
      window.dispatchEvent(new Event("haoshijia-profile-updated"));
    } catch (error) {
      console.error("清除历史数据失败:", error);
      setDangerError("清除失败，请稍后重试。");
    } finally {
      setIsClearing(false);
    }
  };

  const getDeleteAccountErrorMessage = (error: unknown) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
    ) {
      const code = (error as { code: string }).code;
      if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        return "密码不正确，账号未注销。";
      }
      if (code === "auth/too-many-requests") {
        return "尝试次数过多，请稍后再试。";
      }
    }

    return "注销失败，请稍后重试。";
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }

    if (!deletePassword) {
      setDangerError("请输入当前账号密码。");
      return;
    }

    if (deleteConfirm.trim() !== deleteAccountConfirmText) {
      setDangerError(`请输入“${deleteAccountConfirmText}”后再继续`);
      return;
    }

    setIsDeleting(true);
    setDangerError("");
    setDangerSuccess("");

    try {
      await firebaseReauthenticateWithPassword(user, deletePassword);
      await deleteUserData(user.uid, profile?.createdAt);
      await firebaseDeleteCurrentUser(user);
      window.location.href = "/";
    } catch (error) {
      console.error("注销账号失败:", error);
      setDangerError(getDeleteAccountErrorMessage(error));
    } finally {
      setIsDeleting(false);
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
        <p className="text-zinc-500">设置日常称呼，并补充 BMI 和营养目标需要的基础资料</p>
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
            <CardDescription>这些字段会用于仪表盘 BMI 计算，后续也会用于轻量营养目标。</CardDescription>
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

      {user && (
        <Card className="border-red-200 bg-red-50/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <ShieldAlert className="h-5 w-5" />
              危险区
            </CardTitle>
            <CardDescription className="text-red-600">
              这里的操作不可恢复。清除历史数据会保留账号，注销账号会删除账号和全部数据。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dangerSuccess && (
              <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {dangerSuccess}
              </div>
            )}
            {dangerError && (
              <div className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-600">
                {dangerError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-md border border-red-200 bg-white/80 p-4">
                <div className="flex items-center gap-2 font-medium text-zinc-900">
                  <Trash2 className="h-4 w-4 text-red-500" />
                  清除历史数据
                </div>
                <p className="mt-2 text-sm text-zinc-600">
                  删除记录、复盘计划、食材库存、体重目标和菜谱偏好，保留账号与基础资料。
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                  onClick={openClearDialog}
                  disabled={isClearing || isDeleting}
                >
                  清除历史数据
                </Button>
              </div>

              <div className="rounded-md border border-red-200 bg-white/80 p-4">
                <div className="flex items-center gap-2 font-medium text-zinc-900">
                  <UserX className="h-4 w-4 text-red-500" />
                  注销账号
                </div>
                <p className="mt-2 text-sm text-zinc-600">
                  删除全部用户数据和 Firebase 登录账号。注销后无法使用当前邮箱继续登录。
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  className="mt-4"
                  onClick={openDeleteDialog}
                  disabled={isClearing || isDeleting}
                >
                  注销账号
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <AuthRequiredDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        title="登录后编辑资料"
        description="你可以先浏览个人资料页面。需要保存昵称和身体基础资料时，请先登录或注册账号。"
      />

      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认清除历史数据</DialogTitle>
            <DialogDescription>
              此操作会删除所有记录、复盘计划、食材库存、体重目标和菜谱偏好，但保留账号和基础资料。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="clear-confirm">输入“{clearHistoryConfirmText}”确认</Label>
            <Input
              id="clear-confirm"
              value={clearConfirm}
              onChange={(event) => {
                setClearConfirm(event.target.value);
                setDangerError("");
              }}
              disabled={isClearing}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)} disabled={isClearing}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleClearHistory} disabled={isClearing}>
              {isClearing ? "清除中..." : "确认清除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认注销账号</DialogTitle>
            <DialogDescription>
              注销会删除账号和全部用户数据。需要输入当前密码重新验证身份。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delete-password">当前账号密码</Label>
              <Input
                id="delete-password"
                type="password"
                value={deletePassword}
                onChange={(event) => {
                  setDeletePassword(event.target.value);
                  setDangerError("");
                }}
                disabled={isDeleting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">输入“{deleteAccountConfirmText}”确认</Label>
              <Input
                id="delete-confirm"
                value={deleteConfirm}
                onChange={(event) => {
                  setDeleteConfirm(event.target.value);
                  setDangerError("");
                }}
                disabled={isDeleting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
              {isDeleting ? "注销中..." : "确认注销"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
