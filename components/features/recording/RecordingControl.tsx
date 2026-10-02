"use client";

import { HandsFreeToggle } from "@/components/features/recording/HandsFreeToggle";
import { RecordingNotice } from "@/components/features/recording/RecordingNotice";
import { RecordingStartButton } from "@/components/features/recording/RecordingStartButton";
import { RecordingToolbar } from "@/components/features/recording/RecordingToolbar";
import { SectionFrame } from "@/components/features/recording/SectionFrame";
import { cn } from "@/lib/utils";
import { useHandsFreeAssistant } from "@/hooks/useHandsFreeAssistant";
import { useSpeechRecorder } from "@/hooks/useSpeechRecorder";
import type { UnsavedRecording } from "@/lib/unsaved-recordings";
import type { DeliveryRecord, KnownCompanies } from "@/types/delivery";
import type { RecordingResult } from "@/types/recording";

interface RecordingControlProps {
  onRecorded: (result: RecordingResult) => void;
  onManualEntry: () => void;
  /** A delivery saved by hands-free mode without the confirmation dialog. */
  onAutoSaved: (record: DeliveryRecord) => void;
  /** A hands-free recording that could not be saved, kept to be fixed later. */
  onKeptForLater: (recording: UnsavedRecording) => void;
  /** 납품처 from earlier deliveries, for parsing multi-word names. */
  knownCompanies: KnownCompanies;
}

const UNSUPPORTED_MESSAGE =
  "이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 또는 Safari를 사용해 주세요.";

/**
 * Button recording (with confirmation) and hands-free mode share one
 * microphone, so only one of them runs at a time. Side by side while idle;
 * an active recording (or a notice) takes the full width.
 */
export function RecordingControl({
  onRecorded,
  onManualEntry,
  onAutoSaved,
  onKeptForLater,
  knownCompanies,
}: RecordingControlProps) {
  const recorder = useSpeechRecorder({ onComplete: onRecorded });
  const handsFree = useHandsFreeAssistant({
    onSaved: onAutoSaved,
    onKeptForLater,
    knownCompanies,
  });
  const { status } = recorder;
  const recorderBusy = status !== "idle" && status !== "unsupported" && status !== "error";

  const startRecording = () => {
    handsFree.disable();
    recorder.start();
  };

  const wide = status !== "idle";

  return (
    <div className="grid grid-cols-2 gap-3">
      <RecordingCard
        recorder={recorder}
        onStart={startRecording}
        onManualEntry={onManualEntry}
      />
      <HandsFreeToggle
        className={cn(wide && "col-span-2")}
        supported={handsFree.supported}
        status={handsFree.status}
        liveText={handsFree.liveText}
        error={handsFree.error}
        disabled={recorderBusy}
        onToggle={(enabled) => (enabled ? handsFree.enable() : handsFree.disable())}
      />
    </div>
  );
}

interface RecordingCardProps {
  recorder: ReturnType<typeof useSpeechRecorder>;
  onStart: () => void;
  onManualEntry: () => void;
}

/** The pink recording card; its UI is driven entirely by the recorder state. */
function RecordingCard({ recorder, onStart, onManualEntry }: RecordingCardProps) {
  const { status } = recorder;

  if (status === "unsupported" || status === "error") {
    return (
      <SectionFrame className="col-span-2">
        <RecordingNotice
          message={status === "error" ? (recorder.error ?? "") : UNSUPPORTED_MESSAGE}
          onRetry={status === "error" ? recorder.dismissError : undefined}
          onManualEntry={onManualEntry}
        />
      </SectionFrame>
    );
  }

  if (status === "idle") {
    return <RecordingStartButton onStart={onStart} />;
  }

  return (
    <SectionFrame className="col-span-2" contentClassName="flex flex-col items-center gap-2 py-1">
      <h2 className="text-xl font-bold tracking-[0.12em] text-slate-900">녹음 시작</h2>
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
