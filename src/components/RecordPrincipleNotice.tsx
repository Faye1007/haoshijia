"use client";

import { AlertCircle } from "lucide-react";

export function RecordPrincipleNotice() {
  return (
    <div className="rounded-lg border border-cyan-200/80 bg-cyan-50/70 px-4 py-3 text-sm text-cyan-900 shadow-sm backdrop-blur">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
        <div className="space-y-1">
          <p className="font-medium">真实记录，才方便复盘。</p>
          <p className="leading-6 text-cyan-800">
            请尽量按实际情况填写体重、围度、饮食和运动。历史记录暂不支持修改；今日误录可按页面已有能力删除或重新记录。
          </p>
        </div>
      </div>
    </div>
  );
}
