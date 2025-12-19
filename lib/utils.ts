import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function hsl(hslValue: string): string {
  return `hsl(${hslValue})`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
