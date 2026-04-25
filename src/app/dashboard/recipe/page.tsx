"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RecipePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/inventory?tab=recipe");
  }, [router]);

  return null;
}
