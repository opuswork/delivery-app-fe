import { AudioLinesIcon } from "lucide-react";

import { SectionFrame } from "@/components/features/recording/SectionFrame";
import { RECORDING_EXAMPLE, RECORDING_SEQUENCE } from "@/lib/constants/recording";

export function RecordingInstructions() {
  return (
    <SectionFrame contentClassName="flex flex-col items-center gap-1 text-center">
      <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
        <span className="flex size-9 items-center justify-center rounded-full bg-brand-audio text-white">
          <AudioLinesIcon className="size-5" aria-hidden />
        </span>
        녹음순서
      </h2>
      <p className="text-lg font-bold text-slate-900">
        {RECORDING_SEQUENCE.join(" -> ")}
      </p>
      <p className="text-base font-bold text-brand-example">
        (예:{RECORDING_EXAMPLE.join("->")})
      </p>
    </SectionFrame>
  );
}
