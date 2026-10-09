"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { isNativeApp } from "@/lib/native/platform";
import type { BeforeInstallPromptEvent } from "@/types/pwa";

const STANDALONE_QUERY = "(display-mode: standalone)";

function subscribeDisplayMode(onChange: () => void) {
  const media = window.matchMedia(STANDALONE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** The store app counts as installed, so it never offers to install the PWA. */
function isStandalone(): boolean {
  if (isNativeApp()) return true;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone;
  return window.matchMedia(STANDALONE_QUERY).matches || iosStandalone === true;
}

function isIos(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

/**
 * Install state for the PWA: Android/Chrome offers a prompt event we can
 * trigger from a button; iOS Safari only supports Share → 홈 화면에 추가.
 */
export function useInstallPrompt() {
  const installed = useSyncExternalStore(subscribeDisplayMode, isStandalone, () => true);
  const ios = useSyncExternalStore(() => () => {}, isIos, () => false);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault(); // show our own button instead of the mini-infobar
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setPromptEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null); // a prompt event can only be used once
  }, [promptEvent]);

  return {
    installed,
    canPrompt: !installed && promptEvent !== null,
    showIosHint: !installed && ios,
    install,
  };
}
