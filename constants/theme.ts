import { vars } from "nativewind";

export const NAV_THEME = {
  light: {
    "--background": "0 0% 100%",
    "--foreground": "0 0% 14.9020%",
    "--card": "0 0% 100%",
    "--card-foreground": "0 0% 14.9020%",
    "--popover": "0 0% 100%",
    "--popover-foreground": "0 0% 14.9020%",
    "--primary": "37.6923 92.1260% 50.1961%",
    "--primary-foreground": "0 0% 0%",
    "--secondary": "220.0000 14.2857% 95.8824%",
    "--secondary-foreground": "215 13.7931% 34.1176%",
    "--muted": "210 20.0000% 98.0392%",
    "--muted-foreground": "220 8.9362% 46.0784%",
    "--accent": "48.0000 100.0000% 96.0784%",
    "--accent-foreground": "22.7273 82.5000% 31.3725%",
    "--destructive": "0 84.2365% 60.1961%",
    "--destructive-foreground": "0 0% 100%",
    "--border": "220 13.0435% 90.9804%",
    "--input": "220 13.0435% 90.9804%",
    "--ring": "37.6923 92.1260% 50.1961%",
    "--radius": "0.375rem",
  },
  dark: {
    "--background": "0 0% 9.0196%",
    "--foreground": "0 0% 89.8039%",
    "--card": "0 0% 14.9020%",
    "--card-foreground": "0 0% 89.8039%",
    "--popover": "0 0% 14.9020%",
    "--popover-foreground": "0 0% 89.8039%",
    "--primary": "37.6923 92.1260% 50.1961%",
    "--primary-foreground": "0 0% 0%",
    "--secondary": "0 0% 14.9020%",
    "--secondary-foreground": "0 0% 89.8039%",
    "--muted": "0 0% 12.1569%",
    "--muted-foreground": "0 0% 63.9216%",
    "--accent": "22.7273 82.5000% 31.3725%",
    "--accent-foreground": "48 96.6387% 76.6667%",
    "--destructive": "0 84.2365% 60.1961%",
    "--destructive-foreground": "0 0% 100%",
    "--border": "0 0% 25.0980%",
    "--input": "0 0% 25.0980%",
    "--ring": "37.6923 92.1260% 50.1961%",
    "--radius": "0.375rem",
  },
};

export const themes = {
  light: vars(NAV_THEME.light),
  dark: vars(NAV_THEME.dark),
};

export function getThemeColor(
  color: keyof typeof NAV_THEME.light,
  scheme: "light" | "dark" | undefined
) {
  return `hsl(${NAV_THEME[scheme ?? "light"][color]})`;
}
