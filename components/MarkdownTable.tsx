import { getThemeColor } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { cn } from "@/lib/utils";
import React, { useMemo } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";

type Alignment = "left" | "center" | "right";

interface ParsedTable {
  headers: string[];
  rows: string[][];
  alignments: Alignment[];
}

interface MarkdownTableProps {
  /** Markdown table string. Renders nothing when null / undefined / empty. */
  content: string | null | undefined;
  /** Total horizontal padding to subtract from screen width (left + right). */
  horizontalPadding?: number;
  /** Extra className for the outer wrapper. */
  className?: string;
}

const MIN_COL_WIDTH = 80;

function parseCells(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

function isSeparator(line: string): boolean {
  // Matches lines like |---|:---:|---:| with optional outer pipes
  return /^\|?(\s*:?-{1,}:?\s*\|)*\s*:?-{1,}:?\s*\|?$/.test(line.trim());
}

function getAlignment(cell: string): Alignment {
  const s = cell.replace(/\s/g, "");
  if (s.startsWith(":") && s.endsWith(":")) return "center";
  if (s.endsWith(":")) return "right";
  return "left";
}

function parseMarkdownTable(md: string): ParsedTable | null {
  const lines = md
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Need at least a header row + separator
  if (lines.length < 2) return null;

  // Locate the separator row (usually index 1, but tolerate index 2)
  let sepIdx = -1;
  for (let i = 1; i < Math.min(lines.length, 3); i++) {
    if (isSeparator(lines[i])) {
      sepIdx = i;
      break;
    }
  }
  if (sepIdx === -1) return null;

  const headers = parseCells(lines[0]);
  const cols = headers.length;
  if (cols === 0) return null;

  // Derive per-column alignment from the separator
  const sepCells = parseCells(lines[sepIdx]);
  const alignments: Alignment[] = Array.from({ length: cols }, (_, i) =>
    i < sepCells.length ? getAlignment(sepCells[i]) : "left",
  );

  // Collect data rows, normalising each to exactly `cols` cells
  const rows: string[][] = [];
  for (let i = sepIdx + 1; i < lines.length; i++) {
    if (isSeparator(lines[i])) continue; // skip stray separators
    const cells = parseCells(lines[i]);
    rows.push(
      Array.from({ length: cols }, (_, j) =>
        j < cells.length ? cells[j] : "",
      ),
    );
  }

  return { headers, rows, alignments };
}

export default function MarkdownTable({
  content,
  horizontalPadding = 0,
  className,
}: MarkdownTableProps) {
  const { scheme, theme } = useAppTheme();
  const { width: screenWidth } = useWindowDimensions();

  const table = useMemo(
    () => (content?.trim() ? parseMarkdownTable(content) : null),
    [content],
  );

  if (!table) return null;

  const { headers, rows, alignments } = table;
  const numCols = headers.length;

  // If columns fit at equal width fill the available space.
  // Otherwise clamp to MIN_COL_WIDTH and let the user scroll.
  const availableWidth = screenWidth - horizontalPadding;
  const equalWidth = availableWidth / numCols;
  const needsScroll = equalWidth < MIN_COL_WIDTH;
  const colWidth = needsScroll ? MIN_COL_WIDTH : equalWidth;

  const foreground = getThemeColor("--foreground", scheme, theme);
  const mutedForeground = getThemeColor("--muted-foreground", scheme, theme);

  const renderRow = (cells: string[], isHeader: boolean, rowIndex?: number) => (
    <View
      key={isHeader ? "header" : `row-${rowIndex}`}
      className={cn(
        "flex-row",
        isHeader && "bg-muted",
        !isHeader && "border-t border-border/50",
        !isHeader &&
          rowIndex !== undefined &&
          rowIndex % 2 !== 0 &&
          "bg-muted/30",
      )}
    >
      {cells.map((cell, ci) => (
        <View
          key={ci}
          style={{ width: colWidth }}
          className={cn(
            "px-3 justify-center",
            isHeader ? "py-2.5" : "py-2",
            ci < numCols - 1 && "border-r border-border/40",
          )}
        >
          <Text
            style={{
              textAlign: alignments[ci] ?? "left",
              color: foreground,
            }}
            className={cn("text-sm", isHeader && "font-semibold")}
          >
            {cell || "—"}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <View
      className={cn(
        "rounded-lg overflow-hidden border border-border",
        className,
      )}
    >
      <ScrollView
        horizontal
        scrollEnabled={needsScroll}
        showsHorizontalScrollIndicator={needsScroll}
        bounces={false}
      >
        <View>
          {renderRow(headers, true)}

          {rows.length > 0 ? (
            rows.map((row, i) => renderRow(row, false, i))
          ) : (
            <View className="py-4 items-center border-t border-border/50">
              <Text
                style={{ color: mutedForeground }}
                className="text-sm italic"
              >
                Nuk ka të dhëna
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
