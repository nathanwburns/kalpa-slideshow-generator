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
                border: element.stroke ? `1px solid ${element.stroke}` : undefined
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
          return (
            <div
              key={element.id}
              style={{
                ...common,
                color: element.color,
                fontSize: `${element.fontSize}px`,
                fontWeight: element.fontWeight || 400,
                lineHeight: 1.18,
                textAlign: element.align || "left",
                whiteSpace: "pre-wrap",
                overflow: "hidden"
              }}
            >
              {element.text}
            </div>
          );
        }

        if (element.kind === "image") {
          const url = element.assetId
            ? `/api/v1/projects/${projectId}/assets/${element.assetId}`
            : "";
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
