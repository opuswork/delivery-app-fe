import type { Metadata } from "next";

import { AppTitle } from "@/components/features/auth/AppTitle";
import { LoginCard } from "@/components/features/auth/LoginCard";
import { MobileShell } from "@/components/layout/MobileShell";

export const metadata: Metadata = { title: "로그인 | 음성배달앱" };

export default function LoginPage() {
  return (
    <MobileShell variant="navy" className="pt-[22vh] pb-16">
      <AppTitle />
      <LoginCard />
    </MobileShell>
  );
}
