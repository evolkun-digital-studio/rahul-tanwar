"use client";

import dynamic from "next/dynamic";

const AdminApp = dynamic(() => import("@/admin/AdminApp").then((m) => m.AdminApp), {
  ssr: false,
});

export function AdminClient() {
  return <AdminApp />;
}
