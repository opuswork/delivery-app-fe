import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { formatDateKeyKo } from "@/lib/date";
import type { DeliveryRecord } from "@/types/delivery";

interface CompanyGroup {
  company: string;
  records: DeliveryRecord[];
}

/** Groups the day's records by 납품처, keeping the order they were saved in. */
function groupByCompany(records: readonly DeliveryRecord[]): CompanyGroup[] {
  const groups = new Map<string, DeliveryRecord[]>();
  for (const record of records) {
    const list = groups.get(record.company_name);
    if (list) list.push(record);
    else groups.set(record.company_name, [record]);
  }
  return [...groups].map(([company, list]) => ({ company, records: list }));
}

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
            {groupByCompany(records).map((group, index) => (
              <li key={group.company}>
                {index > 0 ? <Separator className="my-2" /> : null}
                <p className="text-base font-bold text-slate-800">{group.company}</p>
                <ul className="flex flex-col gap-0.5">
                  {group.records.map((record) => (
                    <li key={record.delivery_number} className="text-sm text-slate-600">
                      {record.product_name} · {record.product_quantity}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
