import { InstallAppButton } from "@/components/features/pwa/InstallAppButton";

/** Bottom of the main screen. The app has no login, so there is nothing to sign out of. */
export function AccountFooter() {
  return (
    <footer className="flex flex-col items-center gap-2 py-4 text-sm text-slate-500">
      <InstallAppButton tone="light" />
    </footer>
  );
}
