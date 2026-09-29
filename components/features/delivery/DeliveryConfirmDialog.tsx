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
  /** Row numbers of the saved company block being edited (edit mode). */
  editDeliveryNumbers?: number[];
}

function descriptionFor(draft: DeliveryDraft | null): string {
  if (draft?.editDeliveryNumbers) return "저장된 배달을 수정하거나 삭제합니다.";
  if (draft?.transcript) return `인식된 음성: "${draft.transcript}"`;
  return "배달 정보를 입력해 주세요.";
}

interface DeliveryConfirmDialogProps {
  draft: DeliveryDraft | null;
  onClose: () => void;
  onSaved: (records: DeliveryRecord[]) => void;
  onDeleted: () => void;
}

/**
 * Confirms speech before saving, or edits/deletes a saved company block
 * (same form, `draft.editDeliveryNumbers` set).
 */
export function DeliveryConfirmDialog({
  draft,
  onClose,
  onSaved,
  onDeleted,
}: DeliveryConfirmDialogProps) {
  return (
    <Dialog open={draft !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-sm overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{draft?.editDeliveryNumbers ? "배달 수정" : "배달 내용 확인"}</DialogTitle>
          <DialogDescription>{descriptionFor(draft)}</DialogDescription>
        </DialogHeader>
        {draft ? (
          <DeliveryForm
            key={draft.id}
            defaultValues={draft.values}
            editDeliveryNumbers={draft.editDeliveryNumbers}
            onCancel={onClose}
            onSaved={onSaved}
            onDeleted={onDeleted}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
