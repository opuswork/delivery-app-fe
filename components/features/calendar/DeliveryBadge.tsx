import { Badge } from "@/components/ui/badge";

export function DeliveryBadge({ count }: { count: number }) {
  return (
    <Badge className="h-6 rounded-lg bg-brand-violet-mist px-1.5 text-xs font-bold text-brand-violet">
      배달{count}
    </Badge>
  );
}
