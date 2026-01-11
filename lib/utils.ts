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
