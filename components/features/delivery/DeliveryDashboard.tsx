"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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
  const knownCompanies = useMemo(
    () => [...new Set([...deliveries.byDate.values()].flat().map((r) => r.company_name))],
    [deliveries.byDate],
  );

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
      openDraft(
        parseDeliveryTranscript(result.segments, new Date(), knownCompanies),
        result.transcript,
      );
    },
    [openDraft, knownCompanies],
  );

  const handleManualEntry = () =>
    openDraft(
      {
        company_name: "",
        delivery_date: selectedKey,
        items: [{ product_name: "", product_quantity: "" }],
      },
      null,
    );

  const handleMonthChange = (next: Date) => {
    setMonth(startOfMonth(next));
    setSelectedDate(toMonthKey(next) === toMonthKey(today) ? today : startOfMonth(next));
  };

  /** Shows the saved delivery's day and reloads that month. */
  const focusSavedDelivery = ([record]: DeliveryRecord[]) => {
    if (!record) return;
    const savedDate = dateFromKey(record.delivery_date);
    setSelectedDate(savedDate);
    setMonth(startOfMonth(savedDate));
    deliveries.refresh();
  };

  const handleSaved = (records: DeliveryRecord[]) => {
    setDraft(null);
    toast.success(`배달 ${records.length}건이 저장되었습니다.`);
    focusSavedDelivery(records);
  };

  const handleAutoSaved = (records: DeliveryRecord[]) => {
    toast.success(`음성으로 저장됨: ${records[0]?.company_name ?? ""} ${records.length}건`);
    focusSavedDelivery(records);
  };

  return (
    <MobileShell variant="light" className="gap-3 py-5">
      <RecordingInstructions />
      <RecordingControl
        onRecorded={handleRecorded}
        onManualEntry={handleManualEntry}
        onAutoSaved={handleAutoSaved}
        knownCompanies={knownCompanies}
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
