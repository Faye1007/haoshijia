"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-zinc-50 p-4">
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center text-center">
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-zinc-900 sm:text-5xl">好食家</h1>
            <p className="text-lg text-zinc-600">减脂记录 · 行为复盘 · 菜谱计划</p>
            <p className="mx-auto max-w-2xl text-sm leading-6 text-zinc-500">
              你可以先进入应用浏览功能结构。需要保存体重、饮食、运动、食材或个人计划时，再登录或注册账号。
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href="/dashboard">进入仪表盘浏览</a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="/login">登录账号</a>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
