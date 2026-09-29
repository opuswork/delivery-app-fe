"use client";

import { Trash2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface DeleteDeliveryButtonProps {
  disabled?: boolean;
  onConfirm: () => Promise<void>;
}

/** "배달 삭제" with an inline confirmation step. */
export function DeleteDeliveryButton({ disabled, onConfirm }: DeleteDeliveryButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        disabled={disabled}
        onClick={() => setConfirming(true)}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2Icon /> 배달 삭제
      </Button>
    );
  }

  const confirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <div
      role="alertdialog"
      aria-label="배달 삭제 확인"
      className="flex items-center justify-between gap-2 rounded-lg bg-destructive/10 px-3 py-2"
    >
      <span className="text-sm font-medium text-destructive">정말 삭제할까요?</span>
      <div className="flex gap-1.5">
        <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>
          아니요
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={deleting}
          onClick={() => void confirm()}
          className="bg-destructive text-white hover:bg-destructive/90"
        >
          {deleting ? <Spinner /> : "삭제"}
        </Button>
      </div>
    </div>
  );
}
