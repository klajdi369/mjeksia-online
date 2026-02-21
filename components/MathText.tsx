import * as schema from "@/db/schema";
import { useDrizzle } from "@/hooks/useDrizzle";
import { getHashedPiece } from "@/lib/utils";
import { inArray } from "drizzle-orm";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  Text,
  useWindowDimensions,
  type TextStyle,
} from "react-native";
import { SvgXml } from "react-native-svg";

interface MathSvgData {
  xml: string;
  w: number;
  h: number;
  v: number;
}

interface MathTextProps {
  text: string;
  color?: string;
  fontSize?: number;
  className?: string;
  style?: TextStyle;
  paddingHorizontal: number;
}

const EX_RATIO = 0.5;

const MathText = ({
  text,
  className,
  style,
  color = "black",
  fontSize = 16,
  paddingHorizontal,
}: MathTextProps) => {
  const { drizzleDb } = useDrizzle();
  const { width: windowWidth } = useWindowDimensions();
  const [svgDataMap, setSvgDataMap] = useState<Record<string, MathSvgData>>({});
  const fetchedHashes = useRef<Set<string>>(new Set());

  const mathPieces = useMemo(() => {
    return text.split(/(\$[^$]+\$)/g).map((piece, index) => {
      const isMath = piece.startsWith("$") && piece.endsWith("$");
      const rawFormula = isMath ? piece.slice(1, -1) : piece;
      return {
        id: index,
        content: piece,
        isMath,
        hash: isMath ? getHashedPiece(rawFormula) : null,
      };
    });
  }, [text]);

  useEffect(() => {
    const fetchSvgs = async () => {
      const hashesToFetch = mathPieces
        .filter((p) => p.isMath && p.hash && !fetchedHashes.current.has(p.hash))
        .map((p) => p.hash as string);

      if (hashesToFetch.length === 0) return;

      hashesToFetch.forEach((h) => fetchedHashes.current.add(h));

      try {
        const results = await drizzleDb
          .select({
            hash: schema.math_svgs.hash,
            xml: schema.math_svgs.xml,
            w: schema.math_svgs.w,
            h: schema.math_svgs.h,
            v: schema.math_svgs.v,
          })
          .from(schema.math_svgs)
          .where(inArray(schema.math_svgs.hash, hashesToFetch));

        if (results.length > 0) {
          setSvgDataMap((prev) => {
            const next = { ...prev };
            results.forEach((row) => {
              if (row.hash && row.xml) {
                next[row.hash] = {
                  xml: row.xml,
                  w: row.w,
                  h: row.h,
                  v: row.v,
                };
              }
            });
            return next;
          });
        }
      } catch (error) {
        hashesToFetch.forEach((h) => fetchedHashes.current.delete(h));
        console.error("DB Fetch Error:", error);
      }
    };

    fetchSvgs();
  }, [mathPieces, drizzleDb]);

  const scalePx = fontSize * EX_RATIO;

  // Calculate the width of the widest SVG
  const maxContentWidth = useMemo(() => {
    const availableWidth = windowWidth - paddingHorizontal;
    let widestSvg = 0;

    mathPieces.forEach((piece) => {
      if (piece.isMath && piece.hash && svgDataMap[piece.hash]) {
        const w = svgDataMap[piece.hash].w * scalePx;
        if (w > widestSvg) widestSvg = w;
      }
    });

    // The text box should be at least the screen width, or the width of the largest SVG
    return Math.max(availableWidth, widestSvg);
  }, [mathPieces, svgDataMap, scalePx, windowWidth, paddingHorizontal]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={true}
      contentContainerStyle={{ minWidth: "100%", paddingBottom: 2 }}
    >
      <Text
        className={className}
        style={[
          style,
          {
            width: maxContentWidth, // Forces the wrap boundary to the widest element
            fontSize: fontSize,
            color: color,
          },
        ]}
      >
        {mathPieces.map((piece) => {
          if (!piece.isMath) {
            return piece.content;
          }

          const data = piece.hash ? svgDataMap[piece.hash] : null;

          if (!data) {
            return (
              <Text key={piece.id} style={{ color: "gray" }}>
                ...
              </Text>
            );
          }

          const widthPx = data.w * scalePx;
          const heightPx = data.h * scalePx;
          const translateY = -1 * (data.v * scalePx);
          const verticalMargin = Math.abs(translateY);

          return (
            <SvgXml
              key={piece.id}
              xml={data.xml}
              width={widthPx}
              height={heightPx}
              color={color}
              style={{
                // Transform handles the baseline alignment
                transform: [{ translateY }],
                // Margins prevent the SVG from clipping into lines above/below (I think they do nothing)
                marginTop: verticalMargin,
                marginBottom: verticalMargin,
              }}
            />
          );
        })}
      </Text>
    </ScrollView>
  );
};

export default MathText;
