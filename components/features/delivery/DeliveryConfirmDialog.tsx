"use client";

import { DeliveryForm } from "@/components/features/delivery/DeliveryForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DeliveryFormValues } from "@/lib/validation/delivery";
import type { DeliveryRecord } from "@/types/delivery";

export interface DeliveryDraft {
  /** Changes per draft so the form remounts with fresh default values. */
  id: number;
  values: DeliveryFormValues;
  transcript: string | null;
}

interface DeliveryConfirmDialogProps {
  draft: DeliveryDraft | null;
  onClose: () => void;
  onSaved: (records: DeliveryRecord[]) => void;
}

/** Lets the user confirm or correct the fields extracted from speech before saving. */
export function DeliveryConfirmDialog({ draft, onClose, onSaved }: DeliveryConfirmDialogProps) {
  return (
    <Dialog open={draft !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-sm overflow-y-auto">
        <DialogHeader>
          <DialogTitle>배달 내용 확인</DialogTitle>
          <DialogDescription>
            {draft?.transcript
              ? `인식된 음성: "${draft.transcript}"`
              : "배달 정보를 입력해 주세요."}
          </DialogDescription>
        </DialogHeader>
        {draft ? (
          <DeliveryForm
            key={draft.id}
            defaultValues={draft.values}
            onCancel={onClose}
            onSaved={onSaved}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
