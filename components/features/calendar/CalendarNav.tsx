import { TriangleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CalendarNavProps {
  month: Date;
  onPrevious: () => void;
  onNext: () => void;
}

const NAV_BUTTON_CLASS =
  "size-12 shrink-0 rounded-xl border-2 border-brand-violet-soft bg-brand-lavender text-brand-violet hover:bg-brand-violet-mist min-[400px]:size-14";

export function CalendarNav({ month, onPrevious, onNext }: CalendarNavProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Button variant="outline" aria-label="이전 달" onClick={onPrevious} className={NAV_BUTTON_CLASS}>
        <TriangleIcon className="size-6! -rotate-90 fill-current" aria-hidden />
      </Button>
      <h2
        aria-live="polite"
        className="min-w-0 text-center text-[clamp(1.25rem,7vw,1.875rem)] font-bold whitespace-nowrap text-slate-800"
      >
        {month.getFullYear()}년 {month.getMonth() + 1}월
      </h2>
      <Button variant="outline" aria-label="다음 달" onClick={onNext} className={NAV_BUTTON_CLASS}>
        <TriangleIcon className="size-6! rotate-90 fill-current" aria-hidden />
      </Button>
    </div>
  );
}
