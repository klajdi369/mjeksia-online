import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Mjeksia Online",
  slug: "mjeksia-online",
  version: "0.5.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "mjeksiaonline",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
  },
  android: {
    icon: "./assets/images/icon.png",
    adaptiveIcon: {
      backgroundColor: "#ECFEFF",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.visarmullaj.mjeksiaonline",
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#F7FAFC",
        dark: {
          image: "./assets/images/splash-icon.png",
          backgroundColor: "#020617",
        },
      },
    ],
    "expo-sqlite",
    "expo-font",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    ...config.extra,
    router: {},
    eas: {
      projectId: "ee137e19-390b-497f-b06d-40c7a226fc76",
    },
    showDevSettings: process.env.ENVIRONMENT === "dev",
  },
});
