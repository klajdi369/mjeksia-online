import Color from "color";
import { vars } from "nativewind";

export const NAV_THEME = {
  light: {
    "--background": "0 0% 100%",
    "--foreground": "240 4.7619% 4.1176%",
    "--card": "240 11.1111% 96.4706%",
    "--card-foreground": "240 4.7619% 4.1176%",
    "--popover": "0 0% 100%",
    "--popover-foreground": "240 4.7619% 4.1176%",
    "--primary": "243.3962 75.3555% 58.6275%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": "240 100% 93.9216%",
    "--secondary-foreground": "243.7500 47.0588% 20%",
    "--muted": "240 11.1111% 94.7059%",
    "--muted-foreground": "240 1.4925% 39.4118%",
    "--accent": "238.7324 83.5294% 66.6667%",
    "--accent-foreground": "0 0% 100%",
    "--destructive": "0 84.2365% 60.1961%",
    "--destructive-foreground": "0 0% 100%",
    "--border": "240 4.0000% 90.1961%",
    "--input": "240 4.0000% 90.1961%",
    "--ring": "243.3962 75.3555% 58.6275%",
    "--chart-1": "243.3962 75.3555% 58.6275%",
    "--chart-2": "234.4538 89.4737% 73.9216%",
    "--chart-3": "228.0000 96.4912% 88.8235%",
    "--chart-4": "242.1687 47.4286% 34.3137%",
    "--chart-5": "229.6552 93.5484% 81.7647%",
    "--sidebar": "240 27.2727% 97.8431%",
    "--sidebar-foreground": "243.7500 47.0588% 20%",
    "--sidebar-primary": "243.3962 75.3555% 58.6275%",
    "--sidebar-primary-foreground": "0 0% 100%",
    "--sidebar-accent": "240 100% 93.9216%",
    "--sidebar-accent-foreground": "243.3962 75.3555% 58.6275%",
    "--sidebar-border": "240 4.0000% 90.1961%",
    "--sidebar-ring": "243.3962 75.3555% 58.6275%",
    "--radius": "12px",
    "--radius-sm": "8px",
    "--radius-md": "10px",
    "--radius-lg": "12px",
    "--tracking-normal": "0.01em",
  },
  dark: {
    "--background": "0 0% 0%",
    "--foreground": "0 0% 100%",
    "--card": "240 9.0909% 4.3137%",
    "--card-foreground": "240 23.8095% 95.8824%",
    "--popover": "0 0% 0%",
    "--popover-foreground": "240 23.8095% 95.8824%",
    "--primary": "239.1781 82.0225% 65.0980%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": "240 35.4839% 18.2353%",
    "--secondary-foreground": "240 100% 93.9216%",
    "--muted": "240 26.8293% 8.0392%",
    "--muted-foreground": "240 4.0404% 61.1765%",
    "--accent": "240 40.3974% 29.6078%",
    "--accent-foreground": "229.6552 93.5484% 81.7647%",
    "--destructive": "3.3503 100.0000% 61.3725%",
    "--destructive-foreground": "0 0% 100%",
    "--border": "240 8.1967% 11.9608%",
    "--input": "240 8.1967% 11.9608%",
    "--ring": "239.1781 82.0225% 65.0980%",
    "--chart-1": "239.1781 82.0225% 65.0980%",
    "--chart-2": "243.7500 47.0588% 20%",
    "--chart-3": "229.6552 93.5484% 81.7647%",
    "--chart-4": "262.1229 83.2558% 57.8431%",
    "--chart-5": "242.1687 47.4286% 34.3137%",
    "--sidebar": "0 0% 1.1765%",
    "--sidebar-foreground": "240 23.8095% 95.8824%",
    "--sidebar-primary": "239.1781 82.0225% 65.0980%",
    "--sidebar-primary-foreground": "0 0% 100%",
    "--sidebar-accent": "240 35.4839% 18.2353%",
    "--sidebar-accent-foreground": "229.6552 93.5484% 81.7647%",
    "--sidebar-border": "240 8.1967% 11.9608%",
    "--sidebar-ring": "239.1781 82.0225% 65.0980%",
    "--radius": "12px",
    "--radius-sm": "8px",
    "--radius-md": "10px",
    "--radius-lg": "12px",
    "--tracking-normal": "0.01em",
  },
};

export const themes = Object.fromEntries(
  Object.entries(NAV_THEME).map(([key, value]) => [key, vars(value)]),
) as Record<keyof typeof NAV_THEME, ReturnType<typeof vars>>;

export function getThemeColor(
  color: keyof typeof NAV_THEME.light,
  theme: keyof typeof NAV_THEME,
  opacity?: number,
) {
  const hslValue = NAV_THEME[theme][color];

  const colorObj = Color(`hsl(${hslValue})`);

  if (opacity === undefined) {
    return colorObj.hsl().string();
  }

  return colorObj
    .alpha(Math.max(0, Math.min(1, opacity)))
    .rgb()
    .string();
}
