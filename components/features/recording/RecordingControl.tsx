"use client";

import { RecordingNotice } from "@/components/features/recording/RecordingNotice";
import { RecordingStartButton } from "@/components/features/recording/RecordingStartButton";
import { RecordingToolbar } from "@/components/features/recording/RecordingToolbar";
import { SectionFrame } from "@/components/features/recording/SectionFrame";
import { useSpeechRecorder } from "@/hooks/useSpeechRecorder";
import type { RecordingResult } from "@/types/recording";

interface RecordingControlProps {
  onRecorded: (result: RecordingResult) => void;
  onManualEntry: () => void;
}

const UNSUPPORTED_MESSAGE =
  "이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 또는 Safari를 사용해 주세요.";

/** One recording feature whose UI is driven entirely by the recorder state. */
export function RecordingControl({ onRecorded, onManualEntry }: RecordingControlProps) {
  const recorder = useSpeechRecorder({ onComplete: onRecorded });
  const { status } = recorder;

  if (status === "unsupported" || status === "error") {
    return (
      <SectionFrame>
        <RecordingNotice
          message={status === "error" ? (recorder.error ?? "") : UNSUPPORTED_MESSAGE}
          onRetry={status === "error" ? recorder.dismissError : undefined}
          onManualEntry={onManualEntry}
        />
      </SectionFrame>
    );
  }

  if (status === "idle") {
    return (
      <SectionFrame contentClassName="px-2">
        <RecordingStartButton onStart={recorder.start} />
      </SectionFrame>
    );
  }

  return (
    <SectionFrame contentClassName="flex flex-col items-center gap-2 py-1">
      <h2 className="text-xl font-bold tracking-[0.12em] text-slate-900">배달 녹음 시작</h2>
      <RecordingToolbar
        status={status}
        elapsedMs={recorder.elapsedMs}
        onStop={recorder.stop}
        onPause={recorder.pause}
        onResume={recorder.resume}
      />
      <p aria-live="polite" className="line-clamp-2 min-h-5 max-w-full text-center text-sm break-keep text-slate-500">
        {status === "paused" ? "일시정지됨" : recorder.interim}
      </p>
    </SectionFrame>
  );
}
