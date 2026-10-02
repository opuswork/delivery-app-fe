import { PencilIcon, TrashIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { UnsavedRecording } from "@/lib/unsaved-recordings";

const REASON_TEXT: Record<UnsavedRecording["reason"], string> = {
  incomplete: "납품일이나 납품처를 못 들었어요",
  "save-failed": "인터넷 문제로 저장하지 못했어요",
};

/** "10월 2일 오후 3:05" */
function formatRecordedAt(iso: string): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${time}`;
}

interface UnsavedRecordingListProps {
  recordings: readonly UnsavedRecording[];
  /** Opens the delivery form prefilled with what was heard. */
  onFix: (recording: UnsavedRecording) => void;
  onDiscard: (recording: UnsavedRecording) => void;
}

/** Hands-free recordings that still need to be completed and saved. Hidden when empty. */
export function UnsavedRecordingList({ recordings, onFix, onDiscard }: UnsavedRecordingListProps) {
  if (recordings.length === 0) return null;

  return (
    <Card className="rounded-3xl border-2 border-amber-300 bg-amber-50 shadow-sm ring-0">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-slate-800">
          저장 안 된 녹음 {recordings.length}건
        </CardTitle>
        <p className="text-sm text-slate-600">눌러서 빠진 내용을 채우고 저장해 주세요.</p>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col">
          {[...recordings].reverse().map((recording, index) => (
            <li key={recording.id}>
              {index > 0 ? <Separator className="my-2 bg-amber-200" /> : null}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 pt-1">
                  <p className="text-xs font-bold text-amber-700">
                    {formatRecordedAt(recording.recordedAt)}
                  </p>
                  <p className="text-xs break-keep text-amber-700">{REASON_TEXT[recording.reason]}</p>
                  <p className="line-clamp-3 text-base break-words text-slate-800">
                    {recording.transcript || "(인식된 내용 없음)"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <Button
                    size="sm"
                    onClick={() => onFix(recording)}
                    className="bg-brand-violet text-white hover:bg-brand-violet/90"
                  >
                    <PencilIcon /> 고치기
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`${formatRecordedAt(recording.recordedAt)} 녹음 삭제`}
                    onClick={() => onDiscard(recording)}
                    className="text-slate-500 hover:bg-amber-100"
                  >
                    <TrashIcon /> 삭제
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
