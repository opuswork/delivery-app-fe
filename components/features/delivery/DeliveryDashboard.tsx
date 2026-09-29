"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { DayDeliveryList } from "@/components/features/calendar/DayDeliveryList";
import { DeliveryCalendar } from "@/components/features/calendar/DeliveryCalendar";
import {
  DeliveryConfirmDialog,
  type DeliveryDraft,
} from "@/components/features/delivery/DeliveryConfirmDialog";
import { RecordingControl } from "@/components/features/recording/RecordingControl";
import { RecordingInstructions } from "@/components/features/recording/RecordingInstructions";
import { AccountFooter } from "@/components/layout/AccountFooter";
import { MobileShell } from "@/components/layout/MobileShell";
import { useMonthlyDeliveries } from "@/hooks/useMonthlyDeliveries";
import { startOfMonth, toDateKey, toMonthKey } from "@/lib/date";
import { parseDeliveryTranscript } from "@/lib/speech/parse-delivery";
import type { DeliveryFormValues } from "@/lib/validation/delivery";
import type { DeliveryRecord } from "@/types/delivery";
import type { RecordingResult } from "@/types/recording";

function dateFromKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Main screen: recording instructions → recording control → delivery calendar. */
export function DeliveryDashboard() {
  const [today] = useState(() => new Date());
  const todayKey = toDateKey(today);
  const [month, setMonth] = useState(() => startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState(today);
  const [draft, setDraft] = useState<DeliveryDraft | null>(null);
  const draftSeq = useRef(0);
  const deliveries = useMonthlyDeliveries(month);
  const selectedKey = toDateKey(selectedDate);

  const openDraft = useCallback(
    (values: DeliveryFormValues, transcript: string | null) => {
      draftSeq.current += 1;
      setDraft({ id: draftSeq.current, values, transcript });
    },
    [],
  );

  const handleRecorded = useCallback(
    (result: RecordingResult) => {
      if (!result.transcript) {
        toast.info("인식된 음성이 없습니다. 다시 녹음해 주세요.");
        return;
      }
      openDraft(parseDeliveryTranscript(result.segments), result.transcript);
    },
    [openDraft],
  );

  const handleManualEntry = () =>
    openDraft(
      { company_name: "", product_name: "", product_quantity: "", delivery_date: selectedKey },
      null,
    );

  const handleMonthChange = (next: Date) => {
    setMonth(startOfMonth(next));
    setSelectedDate(toMonthKey(next) === toMonthKey(today) ? today : startOfMonth(next));
  };

  /** Shows the saved delivery's day and reloads that month. */
  const focusSavedDelivery = (record: DeliveryRecord) => {
    const savedDate = dateFromKey(record.delivery_date);
    setSelectedDate(savedDate);
    setMonth(startOfMonth(savedDate));
    deliveries.refresh();
  };

  const handleSaved = (record: DeliveryRecord) => {
    setDraft(null);
    toast.success("배달이 저장되었습니다.");
    focusSavedDelivery(record);
  };

  const handleAutoSaved = (record: DeliveryRecord) => {
    toast.success(`음성으로 저장됨: ${record.company_name}`);
    focusSavedDelivery(record);
  };

  return (
    <MobileShell variant="light" className="gap-3 py-5">
      <RecordingInstructions />
      <RecordingControl
        onRecorded={handleRecorded}
        onManualEntry={handleManualEntry}
        onAutoSaved={handleAutoSaved}
      />
      <DeliveryCalendar
        month={month}
        todayKey={todayKey}
        byDate={deliveries.byDate}
        selectedDate={selectedDate}
        onMonthChange={handleMonthChange}
        onSelectDate={setSelectedDate}
      />
      <DayDeliveryList
        dateKey={selectedKey}
        records={deliveries.byDate.get(selectedKey) ?? []}
        loading={deliveries.loading}
        error={deliveries.error}
      />
      <AccountFooter />
      <DeliveryConfirmDialog
        draft={draft}
        onClose={() => setDraft(null)}
        onSaved={handleSaved}
      />
    </MobileShell>
  );
}
