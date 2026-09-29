"use client";

import { DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { cn } from "@/lib/utils";

interface InstallAppButtonProps {
  /** "dark" for the navy login screen, "light" for the main screen. */
  tone: "dark" | "light";
  className?: string;
}

/** "앱 설치" on Android/Chrome, a Safari hint on iPhone, nothing once installed. */
export function InstallAppButton({ tone, className }: InstallAppButtonProps) {
  const { canPrompt, showIosHint, install } = useInstallPrompt();
  const muted = tone === "dark" ? "text-slate-300" : "text-slate-500";

  if (canPrompt) {
    return (
      <Button
        variant="outline"
        onClick={() => void install()}
        className={cn(
          "h-11 gap-2 rounded-xl px-5 text-base",
          tone === "dark"
            ? "border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            : "border-brand-violet-soft text-brand-violet hover:bg-brand-lavender",
          className,
        )}
      >
        <DownloadIcon /> 앱 설치
      </Button>
    );
  }

  if (showIosHint) {
    return (
      <p className={cn("text-center text-sm", muted, className)}>
        앱으로 쓰려면 Safari 공유 버튼 → 홈 화면에 추가
      </p>
    );
  }

  return null;
}
