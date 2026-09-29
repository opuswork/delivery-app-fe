import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { HandsFreeStatus } from "@/lib/speech/hands-free-engine";

const STATUS_TEXT: Record<Exclude<HandsFreeStatus, "off">, string> = {
  waiting: "\"오케이 배달\"이라고 말하세요",
  prompting: "말씀하세요!",
  dictating: "듣고 있어요…",
  saving: "저장 중…",
  announcing: "안내 중…",
};

interface HandsFreeToggleProps {
  supported: boolean;
  status: HandsFreeStatus;
  liveText: string;
  error: string | null;
  disabled?: boolean;
  onToggle: (enabled: boolean) => void;
}

/** "오케이 배달" hands-free switch with the assistant's current status. */
export function HandsFreeToggle({
  supported,
  status,
  liveText,
  error,
  disabled,
  onToggle,
}: HandsFreeToggleProps) {
  const active = status !== "off";

  return (
    <Card className="rounded-3xl bg-white py-4 shadow-sm ring-0">
      <CardContent className="flex flex-col gap-2 px-5">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="hands-free" className="flex flex-col items-start gap-0.5">
            <span className="text-base font-bold text-slate-800">핸즈프리 모드</span>
            <span className="text-xs font-normal text-slate-500">
              {supported
                ? "\"오케이 배달\"로 말해서 바로 저장"
                : "이 브라우저는 핸즈프리를 지원하지 않습니다"}
            </span>
          </Label>
          <Switch
            id="hands-free"
            checked={active}
            disabled={!supported || disabled}
            onCheckedChange={onToggle}
          />
        </div>
        {active ? (
          <p aria-live="polite" className="text-sm font-bold text-brand-violet">
            {STATUS_TEXT[status]}
          </p>
        ) : null}
        {active && liveText ? (
          <p className="line-clamp-2 text-sm break-keep text-slate-500">{liveText}</p>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
