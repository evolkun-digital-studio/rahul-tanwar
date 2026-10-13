import type { Metadata } from "next";
import { AdminClient } from "../AdminClient";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-static";

export default function Page() {
  return <AdminClient />;
}
