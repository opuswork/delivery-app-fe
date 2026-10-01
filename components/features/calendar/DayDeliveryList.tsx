import { CopyIcon, PencilIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { deliveryTypeColor } from "@/lib/constants/delivery";
import { formatDateKeyKo } from "@/lib/date";
import type { DeliveryRecord } from "@/types/delivery";

interface DayDeliveryListProps {
  dateKey: string;
  records: readonly DeliveryRecord[];
  loading: boolean;
  error: string | null;
  /** Opens the edit modal for one delivery of this day. */
  onEdit: (record: DeliveryRecord) => void;
  /** Opens the repeat sheet to copy one delivery onto other dates. */
  onRepeat: (record: DeliveryRecord) => void;
}

/** The recorded deliveries (납품처 + 납품종류 + 메모) for the selected calendar day. */
export function DayDeliveryList({
  dateKey,
  records,
  loading,
  error,
  onEdit,
  onRepeat,
}: DayDeliveryListProps) {
  return (
    <Card className="rounded-3xl bg-white shadow-sm ring-0">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-lg font-bold text-slate-800">
          {formatDateKeyKo(dateKey)} 배달 {records.length}건
        </CardTitle>
        {loading ? <Spinner className="text-brand-violet" /> : null}
      </CardHeader>
      <CardContent>
        {error ? (
          <p role="alert" className="text-sm text-destructive">{error}</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-slate-400">등록된 배달이 없습니다.</p>
        ) : (
          <ol className="flex flex-col">
            {records.map((record, index) => (
              <li key={record.delivery_number}>
                {index > 0 ? <Separator className="my-2" /> : null}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 pt-1">
                    {/* Records saved before 납품처 was its own field have it inside the memo. */}
                    {record.company_name || record.delivery_type ? (
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {record.company_name ? (
                          <span className="text-base font-bold break-words text-slate-800">
                            {record.company_name}
                          </span>
                        ) : null}
                        {record.delivery_type ? (
                          <span
                            className="rounded-md px-1.5 py-0.5 text-xs font-bold text-white"
                            style={{ backgroundColor: deliveryTypeColor(record.delivery_type) }}
                          >
                            {record.delivery_type}
                          </span>
                        ) : null}
                      </p>
                    ) : null}
                    {record.memo ? (
                      <p className="text-sm whitespace-pre-wrap break-words text-slate-600">
                        {record.memo}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-stretch gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`${record.company_name || `배달 ${index + 1}`} 수정`}
                      onClick={() => onEdit(record)}
                      className="justify-start text-brand-violet hover:bg-brand-lavender"
                    >
                      <PencilIcon /> 수정
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`${record.company_name || `배달 ${index + 1}`} 다른 날짜에 반복`}
                      onClick={() => onRepeat(record)}
                      className="justify-start text-brand-violet hover:bg-brand-lavender"
                    >
                      <CopyIcon /> 반복
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
