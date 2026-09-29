import { formatElapsed } from "@/lib/time";

export function RecordingTimer({ elapsedMs }: { elapsedMs: number }) {
  return (
    <time
      aria-live="off"
      aria-label="녹음 시간"
      className="min-w-14 text-center text-lg text-red-300 tabular-nums"
    >
      {formatElapsed(elapsedMs)}
    </time>
  );
}
