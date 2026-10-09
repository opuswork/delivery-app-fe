import { Badge } from "@/components/ui/badge";
import { badgeColorOf, badgeTextColor } from "@/lib/constants/delivery";
import type { DeliveryRecord } from "@/types/delivery";

/** Badges that fit in a day cell; the rest are summed up as "+N". */
const MAX_BADGES = 2;

/** 납품처 in the badge colour chosen for the delivery. */
export function DeliveryBadge({ record }: { record: DeliveryRecord }) {
  return (
    <Badge
      className="h-auto min-h-5 w-full max-w-full min-w-0 shrink justify-center rounded-md px-px py-0.5 text-[11px] leading-tight font-bold whitespace-normal"
      style={{ backgroundColor: badgeColorOf(record), color: badgeTextColor(badgeColorOf(record)) }}
    >
      {/* A long name wraps onto a second line rather than being cut to one letter. */}
      <span className="line-clamp-2 min-w-0 break-all">{record.company_name || "배달"}</span>
    </Badge>
  );
}

/** The day's deliveries as stacked 납품처 badges. */
export function DeliveryBadgeList({ records }: { records: readonly DeliveryRecord[] }) {
  const hidden = records.length - MAX_BADGES;
  return (
    <span className="flex w-full flex-col items-center gap-0.5 px-0.5">
      {records.slice(0, MAX_BADGES).map((record) => (
        <DeliveryBadge key={record.delivery_number} record={record} />
      ))}
      {hidden > 0 ? (
        <span className="text-[11px] leading-none font-bold text-slate-500">+{hidden}</span>
      ) : null}
    </span>
  );
}
