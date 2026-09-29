import { Button } from "@/components/ui/button";

interface RecordingNoticeProps {
  message: string;
  onRetry?: () => void;
  onManualEntry: () => void;
}

/** Shown when speech recognition is unavailable or failed; manual entry stays possible. */
export function RecordingNotice({ message, onRetry, onManualEntry }: RecordingNoticeProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      <p role="alert" className="text-sm font-medium text-destructive">
        {message}
      </p>
      <div className="flex gap-2">
        {onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            다시 시도
          </Button>
        ) : null}
        <Button
          onClick={onManualEntry}
          className="bg-brand-violet text-white hover:bg-brand-violet/90"
        >
          직접 입력
        </Button>
      </div>
    </div>
  );
}
