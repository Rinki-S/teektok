"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { HomePage } from "@/components/home-page";
import { getCurrentUserId } from "@/services/videoService";

export default function RecommendPage() {
  useEffect(() => {
    // 如果未登录，提示用户
    if (!getCurrentUserId()) {
      toast("请先登录", {
        description: "登录后即可查看个性化推荐内容",
        action: {
          label: "去登录",
          onClick: () => {
             // 跳转到登录页 (假设登录页是 /admin/login 或弹窗，暂时不做跳转或跳到 admin 登录)
             // 由于前台登录入口暂未明确，这里先提示
             // router.push("/login"); 
             console.log("Navigate to login");
          },
        },
      });
    }
  }, []);

  return <HomePage feedType="recommend" />;
}
