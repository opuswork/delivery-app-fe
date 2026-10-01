"use client";

import { HandsFreeToggle } from "@/components/features/recording/HandsFreeToggle";
import { RecordingNotice } from "@/components/features/recording/RecordingNotice";
import { RecordingStartButton } from "@/components/features/recording/RecordingStartButton";
import { RecordingToolbar } from "@/components/features/recording/RecordingToolbar";
import { SectionFrame } from "@/components/features/recording/SectionFrame";
import { useHandsFreeAssistant } from "@/hooks/useHandsFreeAssistant";
import { useSpeechRecorder } from "@/hooks/useSpeechRecorder";
import type { DeliveryRecord, KnownCompanies } from "@/types/delivery";
import type { RecordingResult } from "@/types/recording";

interface RecordingControlProps {
  onRecorded: (result: RecordingResult) => void;
  onManualEntry: () => void;
  /** A delivery saved by hands-free mode without the confirmation dialog. */
  onAutoSaved: (record: DeliveryRecord) => void;
  /** 납품처 from earlier deliveries, for parsing multi-word names. */
  knownCompanies: KnownCompanies;
}

const UNSUPPORTED_MESSAGE =
  "이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 또는 Safari를 사용해 주세요.";

/**
 * Button recording (with confirmation) and hands-free mode share one
 * microphone, so only one of them runs at a time.
 */
export function RecordingControl({
  onRecorded,
  onManualEntry,
  onAutoSaved,
  knownCompanies,
}: RecordingControlProps) {
  const recorder = useSpeechRecorder({ onComplete: onRecorded });
  const handsFree = useHandsFreeAssistant({ onSaved: onAutoSaved, knownCompanies });
  const { status } = recorder;
  const recorderBusy = status !== "idle" && status !== "unsupported" && status !== "error";

  const startRecording = () => {
    handsFree.disable();
    recorder.start();
  };

  return (
    <>
      <RecordingCard
        recorder={recorder}
        onStart={startRecording}
        onManualEntry={onManualEntry}
      />
      <HandsFreeToggle
        supported={handsFree.supported}
        status={handsFree.status}
        liveText={handsFree.liveText}
        error={handsFree.error}
        disabled={recorderBusy}
        onToggle={(enabled) => (enabled ? handsFree.enable() : handsFree.disable())}
      />
    </>
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
        <RecordingStartButton onStart={onStart} />
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
