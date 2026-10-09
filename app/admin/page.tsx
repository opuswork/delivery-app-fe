import type { Metadata } from "next";

import { AdminGate } from "@/components/features/admin/AdminGate";

export const metadata: Metadata = {
  title: "사용 현황 | 말로일정",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminGate />;
}
