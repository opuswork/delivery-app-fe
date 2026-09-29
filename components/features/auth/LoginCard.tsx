import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "@/components/features/auth/LoginForm";

export function LoginCard() {
  return (
    <Card className="rounded-2xl bg-white py-10 shadow-xl ring-1 ring-slate-200">
      <CardContent className="px-7">
        <LoginForm />
      </CardContent>
    </Card>
  );
}
