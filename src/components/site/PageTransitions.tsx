"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initPageTransitions } from "@/lib/pageTransition";

export function PageTransitions() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  useEffect(() => {
    if (!isAdmin) initPageTransitions();
  }, [isAdmin]);
  return null;
}
