import { TriangleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CalendarNavProps {
  month: Date;
  onPrevious: () => void;
  onNext: () => void;
}

const NAV_BUTTON_CLASS =
  "size-14 rounded-xl border-2 border-brand-violet-soft bg-brand-lavender text-brand-violet hover:bg-brand-violet-mist";

export function CalendarNav({ month, onPrevious, onNext }: CalendarNavProps) {
  return (
    <div className="flex items-center justify-between">
      <Button variant="outline" aria-label="이전 달" onClick={onPrevious} className={NAV_BUTTON_CLASS}>
        <TriangleIcon className="size-6! -rotate-90 fill-current" aria-hidden />
      </Button>
      <h2 aria-live="polite" className="text-3xl font-bold text-slate-800">
        {month.getFullYear()}년 {month.getMonth() + 1}월
      </h2>
      <Button variant="outline" aria-label="다음 달" onClick={onNext} className={NAV_BUTTON_CLASS}>
        <TriangleIcon className="size-6! rotate-90 fill-current" aria-hidden />
      </Button>
    </div>
  );
}
