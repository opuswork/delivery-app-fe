import { MicIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface RecordingStartButtonProps {
  disabled?: boolean;
  onStart: () => void;
}

export function RecordingStartButton({ disabled, onStart }: RecordingStartButtonProps) {
  return (
    <Button
      variant="ghost"
      disabled={disabled}
      onClick={onStart}
      className="h-24 w-full gap-6 rounded-2xl text-3xl font-bold tracking-[0.12em] text-slate-900 hover:bg-brand-lavender"
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-brand-record text-white shadow-md">
        <MicIcon className="size-8" aria-hidden />
      </span>
      배달 녹음 시작
    </Button>
  );
}
