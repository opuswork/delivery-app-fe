import { MicIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RecordingStartButtonProps {
  disabled?: boolean;
  onStart: () => void;
  className?: string;
}

/** White card-sized button, the same size as the 핸즈프리 모드 card next to it. */
export function RecordingStartButton({ disabled, onStart, className }: RecordingStartButtonProps) {
  return (
    <Button
      variant="ghost"
      disabled={disabled}
      onClick={onStart}
      className={cn(
        "h-full min-h-20 w-full gap-2.5 rounded-3xl bg-white px-3 py-4 text-xl font-bold text-slate-900 shadow-sm hover:bg-brand-lavender",
        className,
      )}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-record text-white shadow-md">
        <MicIcon className="size-6" aria-hidden />
      </span>
      녹음 시작
    </Button>
  );
}
