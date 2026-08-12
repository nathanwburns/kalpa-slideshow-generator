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
        containerType: "inline-size",
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
                borderRadius: element.radius ? `${element.radius * 100}%` : undefined,
                border: element.stroke ? `1px solid ${element.stroke}` : undefined,
                transform: element.rotate ? `rotate(${element.rotate}deg)` : undefined,
                clipPath: element.variant === "parallelogram" ? "polygon(24% 0, 100% 0, 76% 100%, 0 100%)" : undefined,
                boxShadow: element.shadow ? "0 1.1cqw 2.4cqw rgba(5, 34, 48, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.45)" : undefined,
                backdropFilter: element.shadow ? "blur(0.7cqw) saturate(1.12)" : undefined
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
                // A 13.333in PowerPoint slide maps to 1280px at 96dpi. Container
                // units keep preview typography proportional at every carousel size.
                fontSize: `${element.fontSize / 9.6}cqw`,
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
              <Image src={url} alt="" fill unoptimized sizes="40vw" style={{ objectFit: element.fit || "cover" }} />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
