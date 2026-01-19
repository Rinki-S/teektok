"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserId } from "@/services/videoService";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // Check if running on client side
    if (typeof window === "undefined") return;

    const userId = getCurrentUserId();
    if (userId) {
      router.replace("/recommend");
    } else {
      router.replace("/trending");
    }
  }, [router]);

  return null;
}
