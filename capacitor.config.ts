import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Android/iOS store app: a native shell that loads the deployed site, so a
 * Vercel production deploy updates the app without a store release.
 * Only changes to this file, native plugins or app icons need a new build.
 */
const config: CapacitorConfig = {
  appId: "net.opuscore.malloiljeong",
  appName: "말로일정",
  // Shown only when the site cannot be loaded (see server.errorPath).
  webDir: "native-shell",
  server: {
    url: "https://delivery-app-fe-kohl.vercel.app",
    errorPath: "offline.html",
  },
  backgroundColor: "#1b3358",
  ios: {
    // Keeps the page below the notch and above the home indicator.
    contentInset: "automatic",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: "#1b3358",
      showSpinner: false,
    },
    SystemBars: {
      // White status bar icons on the navy background.
      style: "DARK",
    },
  },
};

export default config;
