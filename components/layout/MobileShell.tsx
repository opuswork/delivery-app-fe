import { cn } from "@/lib/utils";

interface MobileShellProps {
  variant: "navy" | "light";
  className?: string;
  children: React.ReactNode;
}

/**
 * Full-height page background with a centered, phone-width content column.
 * The references are mobile screenshots, so wide screens keep the same column
 * instead of stretching the layout.
 */
export function MobileShell({ variant, className, children }: MobileShellProps) {
  return (
    <main
      className={cn(
        "flex min-h-dvh w-full justify-center",
        variant === "navy" ? "bg-brand-navy" : "bg-brand-page",
      )}
    >
      <div className={cn("flex w-full max-w-md flex-col px-4", className)}>
        {children}
      </div>
    </main>
  );
}
