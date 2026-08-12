"use client";

import Image from "next/image";
import { resolveSlide } from "@/lib/templates/layout-engine";
import type { AssetRecord, SlideContent, TemplateFamilyId } from "@/lib/schema";

type Props = {
  projectId: string;
  slide: SlideContent;
  assets: AssetRecord[];
  templateFamily: TemplateFamilyId;
  className?: string;
};

export function SlidePreview({ projectId, slide, assets, templateFamily, className }: Props) {
  const resolved = resolveSlide(slide, templateFamily, assets);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 9",
        overflow: "hidden",
        borderRadius: 20,
        background: "#d7e4ee",
        boxShadow: "0 20px 50px rgba(0, 26, 41, 0.18)"
      }}
    >
      {resolved.elements.map((element) => {
        const common = {
          position: "absolute" as const,
          left: `${element.x * 100}%`,
          top: `${element.y * 100}%`,
          width: `${element.w * 100}%`,
          height: `${element.h * 100}%`
        };

        if (element.kind === "shape") {
          return (
            <div
              key={element.id}
              style={{
                ...common,
                background: element.fill,
                borderRadius: element.radius ? `${element.radius}px` : undefined,
                border: element.stroke ? `1px solid ${element.stroke}` : undefined,
                transform: element.rotate ? `rotate(${element.rotate}deg)` : undefined
              }}
            />
          );
        }

        if (element.kind === "line") {
          return (
            <div
              key={element.id}
              style={{
                ...common,
                background: element.color,
                height: Math.max(2, element.h * 100) + "%",
                borderRadius: 999
              }}
            />
          );
        }

        if (element.kind === "text") {
          const previewFontSize = adjustPreviewFontSize(element.text, element.fontSize, element.w, element.h);
          return (
            <div
              key={element.id}
              style={{
                ...common,
                color: element.color,
                fontSize: `${previewFontSize}px`,
                fontWeight: element.fontWeight || 400,
                fontFamily: element.fontFace || resolved.family.fontBody,
                lineHeight: element.fontWeight && element.fontWeight >= 700 ? 1.05 : 1.14,
                textAlign: element.align || "left",
                whiteSpace: "pre-wrap",
                overflow: "hidden",
                wordBreak: "break-word",
                display: "flex",
                alignItems: "flex-start",
                paddingRight: "0.12rem"
              }}
            >
              {element.text}
            </div>
          );
        }

        if (element.kind === "image") {
          const url = element.assetId
            ? `/api/v1/projects/${projectId}/assets/${element.assetId}`
            : element.src;
          return (
            <div
              key={element.id}
              style={{
                ...common,
                overflow: "hidden",
                borderRadius: element.radius ? `${element.radius}px` : undefined
              }}
            >
              <Image src={url} alt="" fill unoptimized sizes="40vw" style={{ objectFit: "cover" }} />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

function adjustPreviewFontSize(text: string, fontSize: number, width: number, height: number) {
  const area = Math.max(0.02, width * height);
  const density = text.length / (area * 108);

  if (density > 2.1) return Math.max(8, Math.round(fontSize * 0.5));
  if (density > 1.7) return Math.max(9, Math.round(fontSize * 0.6));
  if (density > 1.3) return Math.max(10, Math.round(fontSize * 0.74));
  if (density > 1.0) return Math.max(11, Math.round(fontSize * 0.88));
  return fontSize;
}
