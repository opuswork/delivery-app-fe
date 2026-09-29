import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SectionFrameProps {
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

/** Lavender outer panel with the pink-bordered inner box used by the top two sections. */
export function SectionFrame({ className, contentClassName, children }: SectionFrameProps) {
  return (
    <section className={cn("rounded-[2rem] bg-brand-lavender p-4 shadow-sm", className)}>
      <Card className="rounded-3xl border-2 border-brand-pink bg-brand-lavender-soft py-3 ring-0">
        <CardContent className={cn("px-4", contentClassName)}>{children}</CardContent>
      </Card>
    </section>
  );
}
