import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { formatDateKeyKo } from "@/lib/date";
import type { DeliveryRecord } from "@/types/delivery";

interface DayDeliveryListProps {
  dateKey: string;
  records: readonly DeliveryRecord[];
  loading: boolean;
  error: string | null;
}

/** The recorded deliveries (as text) for the selected calendar day. */
export function DayDeliveryList({ dateKey, records, loading, error }: DayDeliveryListProps) {
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
                <p className="text-base font-bold text-slate-800">{record.company_name}</p>
                <p className="text-sm text-slate-600">
                  {record.product_name} · {record.product_quantity}
                </p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
