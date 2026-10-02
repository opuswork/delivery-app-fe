"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { DayDeliveryList } from "@/components/features/calendar/DayDeliveryList";
import { DeliveryCalendar } from "@/components/features/calendar/DeliveryCalendar";
import {
  DeliveryConfirmDialog,
  type DeliveryDraft,
} from "@/components/features/delivery/DeliveryConfirmDialog";
import { BulkEditDeliverySheet } from "@/components/features/delivery/BulkEditDeliverySheet";
import { RepeatDeliverySheet } from "@/components/features/delivery/RepeatDeliverySheet";
import { RecordingControl } from "@/components/features/recording/RecordingControl";
import { RecordingInstructions } from "@/components/features/recording/RecordingInstructions";
import { AccountFooter } from "@/components/layout/AccountFooter";
import { MobileShell } from "@/components/layout/MobileShell";
import { useMonthlyDeliveries } from "@/hooks/useMonthlyDeliveries";
import { DEFAULT_BADGE_COLOR } from "@/lib/constants/delivery";
import { formatDateKeyKo, fromDateKey, startOfMonth, toDateKey, toMonthKey } from "@/lib/date";
import { parseDeliveryTranscript } from "@/lib/speech/parse-delivery";
import type { DeliveryFormValues } from "@/lib/validation/delivery";
import type { DeliveryRecord, KnownCompanies } from "@/types/delivery";
import type { RecordingResult } from "@/types/recording";

/** Main screen: recording instructions → recording control → delivery calendar. */
export function DeliveryDashboard() {
  const [today] = useState(() => new Date());
  const todayKey = toDateKey(today);
  const [month, setMonth] = useState(() => startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState(today);
  const [draft, setDraft] = useState<DeliveryDraft | null>(null);
  const [repeatSource, setRepeatSource] = useState<DeliveryRecord | null>(null);
  const [bulkEditSource, setBulkEditSource] = useState<DeliveryRecord | null>(null);
  const draftSeq = useRef(0);
  const deliveries = useMonthlyDeliveries(month);
  const selectedKey = toDateKey(selectedDate);
  /** 납품처 of this month → its latest badge colour (records are in date order). */
  const knownCompanies = useMemo<KnownCompanies>(() => {
    const companies = new Map<string, string>();
    for (const record of [...deliveries.byDate.values()].flat()) {
      if (!record.company_name) continue;
      const known = companies.get(record.company_name);
      companies.set(record.company_name, record.badge_color || known || "");
    }
    return companies;
  }, [deliveries.byDate]);

  const openDraft = useCallback(
    (values: DeliveryFormValues, transcript: string | null, editDeliveryNumber?: number) => {
      draftSeq.current += 1;
      setDraft({ id: draftSeq.current, values, transcript, editDeliveryNumber });
    },
    [],
  );

  /** Opens the modal prefilled with one saved delivery of the day. */
  const handleEdit = ({
    delivery_number,
    delivery_date,
    company_name,
    badge_color,
    memo,
  }: DeliveryRecord) =>
    openDraft(
      { delivery_date, company_name, badge_color: badge_color || DEFAULT_BADGE_COLOR, memo },
      null,
      delivery_number,
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

  /** Empty memo for `date` (calendar "+" or the manual-entry fallback). */
  const handleAdd = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      openDraft(
        {
          delivery_date: toDateKey(date),
          company_name: "",
          badge_color: DEFAULT_BADGE_COLOR,
          memo: "",
        },
        null,
      );
    },
    [openDraft],
  );

  const handleMonthChange = (next: Date) => {
    setMonth(startOfMonth(next));
    setSelectedDate(toMonthKey(next) === toMonthKey(today) ? today : startOfMonth(next));
  };

  /** Shows the saved delivery's day and reloads that month. */
  const focusSavedDelivery = (record: DeliveryRecord) => {
    const savedDate = fromDateKey(record.delivery_date);
    setSelectedDate(savedDate);
    setMonth(startOfMonth(savedDate));
    deliveries.refresh();
  };

  const handleSaved = (record: DeliveryRecord) => {
    setDraft(null);
    toast.success(draft?.editDeliveryNumber ? "배달이 수정되었습니다." : "배달이 저장되었습니다.");
    focusSavedDelivery(record);
  };

  const handleDeleted = () => {
    setDraft(null);
    toast.success("배달이 삭제되었습니다.");
    deliveries.refresh();
  };

  const handleRepeated = (message: string) => {
    setRepeatSource(null);
    toast.success(message);
    deliveries.refresh();
  };

  const handleBulkEdited = (message: string) => {
    setBulkEditSource(null);
    toast.success(message);
    deliveries.refresh();
  };

  const handleAutoSaved = (record: DeliveryRecord) => {
    toast.success(
      `음성으로 저장됨: ${formatDateKeyKo(record.delivery_date)} ${record.company_name}`,
    );
    focusSavedDelivery(record);
  };

  return (
    <MobileShell variant="light" className="gap-3 py-5">
      <RecordingInstructions />
      <RecordingControl
        onRecorded={handleRecorded}
        onManualEntry={() => handleAdd(selectedDate)}
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
        onAdd={handleAdd}
      />
      <DayDeliveryList
        dateKey={selectedKey}
        records={deliveries.byDate.get(selectedKey) ?? []}
        loading={deliveries.loading}
        error={deliveries.error}
        onEdit={handleEdit}
        onRepeat={setRepeatSource}
        onBulkEdit={setBulkEditSource}
      />
      <AccountFooter />
      <DeliveryConfirmDialog
        draft={draft}
        onClose={() => setDraft(null)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
        knownCompanies={knownCompanies}
      />
      <RepeatDeliverySheet
        source={repeatSource}
        onClose={() => setRepeatSource(null)}
        onRepeated={handleRepeated}
      />
      <BulkEditDeliverySheet
        source={bulkEditSource}
        onClose={() => setBulkEditSource(null)}
        onSaved={handleBulkEdited}
      />
    </MobileShell>
  );
}
