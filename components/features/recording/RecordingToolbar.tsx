import { PauseIcon, PlayIcon, SquareIcon } from "lucide-react";

import { RecordingTimer } from "@/components/features/recording/RecordingTimer";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface RecordingToolbarProps {
  status: "requesting" | "recording" | "paused" | "processing";
  elapsedMs: number;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
}

/** Navy control bar: stop · elapsed time · pause/resume. */
export function RecordingToolbar({
  status,
  elapsedMs,
  onStop,
  onPause,
  onResume,
}: RecordingToolbarProps) {
  const busy = status === "requesting" || status === "processing";
  const paused = status === "paused";

  return (
    <div className="flex items-center gap-3 rounded-xl bg-brand-navy p-2.5">
      <div className="flex items-center gap-2 rounded-full bg-brand-navy-ink py-1 pr-4 pl-1">
        <Button
          size="icon-lg"
          aria-label="녹음 종료"
          disabled={busy}
          onClick={onStop}
          className="size-11 rounded-full bg-brand-record text-white hover:bg-brand-record/90"
        >
          {busy ? <Spinner className="size-5" /> : <SquareIcon className="size-4 fill-current" />}
        </Button>
        <RecordingTimer elapsedMs={elapsedMs} />
      </div>
      <Button
        size="icon-lg"
        aria-label={paused ? "녹음 재개" : "녹음 일시정지"}
        disabled={busy}
        onClick={paused ? onResume : onPause}
        className="size-11 rounded-full bg-brand-navy-ink text-white hover:bg-brand-navy-ink/80"
      >
        {paused ? (
          <PlayIcon className="size-5 fill-current" />
        ) : (
          <PauseIcon className="size-5 fill-current" />
        )}
      </Button>
    </div>
  );
}
