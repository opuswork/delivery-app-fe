import { Spinner } from "@/components/ui/spinner";

export function FullScreenLoader() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-brand-page">
      <Spinner className="size-8 text-brand-violet" />
    </main>
  );
}
