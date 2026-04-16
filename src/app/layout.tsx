import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "好食家",
  description: "减脂助手 - 记录 · 复盘 · 计划",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}