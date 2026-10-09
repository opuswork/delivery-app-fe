import { Capacitor, registerPlugin } from "@capacitor/core";

import { isNativeApp } from "@/lib/native/platform";

/** android/app/src/main/java/delivery/my/app/widget/MalloWidgetPlugin.java */
const MalloWidget = registerPlugin<{ refresh(): Promise<void> }>("MalloWidget");

/**
 * Asks the Android home-screen calendar widget to fetch again, after the app
 * has saved something. Does nothing in browsers, on iOS, or without a widget.
 */
export function refreshWidget(): void {
  if (!isNativeApp() || Capacitor.getPlatform() !== "android") return;
  void MalloWidget.refresh().catch(() => undefined);
}
