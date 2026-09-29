"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function AccountFooter() {
  const { user, logout } = useAuth();

  return (
    <footer className="flex items-center justify-center gap-2 py-4 text-sm text-slate-500">
      {user ? (
        <span>
          {user.fullName} · {user.churchName}
        </span>
      ) : null}
      <Button variant="link" size="sm" onClick={logout} className="text-slate-500">
        로그아웃
      </Button>
    </footer>
  );
}
