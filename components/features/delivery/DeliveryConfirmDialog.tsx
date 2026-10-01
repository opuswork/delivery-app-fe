"use client";

import { DeliveryForm } from "@/components/features/delivery/DeliveryForm";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet";
import type { DeliveryFormValues } from "@/lib/validation/delivery";
import type { DeliveryRecord } from "@/types/delivery";

export interface DeliveryDraft {
  /** Changes per draft so the form remounts with fresh default values. */
  id: number;
  values: DeliveryFormValues;
  transcript: string | null;
  /** The saved delivery being edited (edit mode). */
  editDeliveryNumber?: number;
}

function titleFor(draft: DeliveryDraft | null): string {
  if (draft?.editDeliveryNumber) return "배달 수정";
  if (draft?.transcript) return "배달 내용 확인";
  return "배달 메모 추가";
}

function descriptionFor(draft: DeliveryDraft | null): string {
  if (draft?.editDeliveryNumber) return "저장된 배달을 수정하거나 삭제합니다.";
  if (draft?.transcript) return `인식된 음성: "${draft.transcript}"`;
  return "납품일, 납품처, 메모를 입력해 주세요.";
}

interface DeliveryConfirmDialogProps {
  draft: DeliveryDraft | null;
  onClose: () => void;
  onSaved: (record: DeliveryRecord) => void;
  onDeleted: () => void;
}

/**
 * Bottom sheet that confirms speech before saving, adds a memo by hand, or edits/deletes a
 * saved delivery (same form, `draft.editDeliveryNumber` set).
 */
export function DeliveryConfirmDialog({
  draft,
  onClose,
  onSaved,
  onDeleted,
}: DeliveryConfirmDialogProps) {
  return (
    <BottomSheet open={draft !== null} onOpenChange={(open) => !open && onClose()}>
      <BottomSheetContent>
        <BottomSheetHeader>
          <BottomSheetTitle>{titleFor(draft)}</BottomSheetTitle>
          <BottomSheetDescription>{descriptionFor(draft)}</BottomSheetDescription>
        </BottomSheetHeader>
        {draft ? (
          <DeliveryForm
            key={draft.id}
            defaultValues={draft.values}
            editDeliveryNumber={draft.editDeliveryNumber}
            onCancel={onClose}
            onSaved={onSaved}
            onDeleted={onDeleted}
          />
        ) : null}
      </BottomSheetContent>
    </BottomSheet>
  );
}
