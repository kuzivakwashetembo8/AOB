import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.interlinkglobal.poi",
  appName: "P.O.I",
  webDir: ".capacitor-web",
  server: {
    androidScheme: "https",
    cleartext: false,
  },
};

export default config;
