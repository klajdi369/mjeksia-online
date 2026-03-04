import { clsx, type ClassValue } from "clsx";
import Hex from "crypto-js/enc-hex";
import sha256 from "crypto-js/sha256";
import { twMerge } from "tailwind-merge";

export function hsl(hslValue: string): string {
  return `hsl(${hslValue})`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getHashedPiece(piece: string): string {
  const normalized = piece.trim().replace(/\s+/g, " ");
  return sha256(normalized).toString(Hex).substring(0, 12);
}

export const formatTime = (seconds: number) => {
  const mm = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
};

export function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function truncateString(str: string, length: number): string {
  if (str.length > length) {
    return str.slice(0, length) + "...";
  }
  return str;
}
