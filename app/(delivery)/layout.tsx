import { AuthGuard } from "@/components/layout/AuthGuard";

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
