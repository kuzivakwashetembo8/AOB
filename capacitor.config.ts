import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // Keep the existing appId to preserve Android install identity and upgrades.
  appId: "com.interlinkglobal.poi",
  appName: "Age of Abundance",
  webDir: ".capacitor-web",
  server: {
    androidScheme: "https",
    cleartext: false,
  },
};

export default config;
