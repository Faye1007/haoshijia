"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AuthRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function AuthRequiredDialog({
  open,
  onOpenChange,
  title = "登录后继续记录",
  description = "你可以先浏览所有功能。需要保存记录、删除数据或生成个人计划时，请先登录或注册账号。",
}: AuthRequiredDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" asChild>
            <a href="/register">注册账号</a>
          </Button>
          <Button type="button" asChild>
            <a href="/login">登录</a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
