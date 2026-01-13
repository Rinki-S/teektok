"use client";

import { HomePage } from "@/components/home-page";

/**
 * 推荐页
 *
 * 目前先复用短视频流 UI（`HomePage`），以便你把左侧导航的每个入口先拆成独立路由。
 * 后续你可以在 `useVideoFeed` 里按 route/参数区分拉取“推荐”数据。
 */
export default function RecommendPage() {
  return <HomePage />;
}
