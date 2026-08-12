import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { getOpenAIClient } from "@/lib/ai/client";
import { outlineJsonSchema, questionsJsonSchema, slidesJsonSchema, themeConceptsJsonSchema } from "@/lib/ai/schemas";
import type {
  AdminSettings,
  AssetRecord,
  BriefInput,
  OutlineItem,
  SlideContent,
  TemplateFamilyId,
  ThemeConcept
} from "@/lib/schema";
import { outlineItemSchema, questionSchema, slideContentSchema, themeConceptSchema } from "@/lib/schema";
import { finalizeSlidesForRender, isImageAsset } from "@/lib/slides/normalize";
import { clipText } from "@/lib/utils";
import { createId, ensureProjectFilesDir } from "@/lib/data/storage";

function composeAssetContext(assets: AssetRecord[]) {
  return assets
    .map(
      (asset) =>
        `Asset: ${asset.name}\nType: ${asset.mimeType}\nVisual asset: ${isImageAsset(asset) ? "yes" : "no"}\nExtracted text:\n${asset.extractedText || "[no extractable text]"}`
    )
    .join("\n\n---\n\n")
    .slice(0, 18000);
}

function composeAssetInventory(assets: AssetRecord[]) {
  return JSON.stringify(
    assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      mimeType: asset.mimeType,
      visual: isImageAsset(asset)
    })),
    null,
    2
  );
}

async function loadBrandBookContext() {
  try {
    const filePath = path.join(process.cwd(), "docs", "kalpa-brand-book.md");
    const raw = await fs.readFile(filePath, "utf8");
    return clipText(raw, 14000);
  } catch {
    return "";
  }
}

function composeBrandPrompt(brandBook: string) {
  return brandBook ? `\n\nKalpa brand book:\n${brandBook}` : "";
}

function composeSlideDesignPrompt() {
  return [
    "Design like a professional business presentation system, not a generic AI page.",
    "Every slide must fit cleanly into its layout with no text overflow, no overlapping text, and no placeholder-looking empty regions.",
    "Use short executive headlines, concise supporting copy, and only the fields that the selected layout can present well.",
    "Prefer one dominant idea per slide and leave visual breathing room.",
    "Content budgets by layout:",
    "- hero: headline <= 10 words, subheadline <= 20 words, max 3 bullets",
    "- challenge: 3-4 editorial points, each <= 12 words; do not turn every point into a card",
    "- industry-grid: exactly 3 pillars, each <= 11 words",
    "- proof: max 3 stats, each label <= 4 words, or 3-4 evidence bullets of <= 11 words",
    "- process: max 4 steps, each step <= 5 words",
    "- comparison: max 4 bullets per column, each bullet <= 10 words",
    "- quote: one quote and one short attribution",
    "- cta: one short action line and one short subline",
    "Use imageAssetIds only for real image files. Use at most one image per slide.",
    "If suitable image assets exist, prioritize them on hero, proof, challenge, industry-grid, or CTA slides.",
    "If there is no suitable image asset, do not imply a photo-dependent composition; favor a strong text-and-shape layout instead.",
    "Never use generic button labels, fake controls, or dense dashboard components as slide content.",
    "Do not create a title cover or thank-you slide. The application adds Kalpa-branded bookends automatically.",
    "Use the content capacity provided: core slides need a clear supporting line plus concrete evidence, not only a headline and a decorative shape.",
    "Prefer whitespace, hierarchy, and restraint over filling every field. If an idea does not fit its content budget, rewrite it rather than shrinking it."
  ].join("\n");
}

async function parseStructuredJson<T>(response: any, schema: z.ZodType<T>) {
  const raw = response.output_text || response.output?.[0]?.content?.[0]?.text || "";
  return schema.parse(JSON.parse(raw));
}

export async function generateQuestions(brief: BriefInput, assets: AssetRecord[], settings: AdminSettings) {
  const client = getOpenAIClient();
  const brandBook = await loadBrandBookContext();
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              `${settings.systemPrompt}\nAsk no more than five clarifying questions. If something can be reasonably assumed, include that assumption.${composeBrandPrompt(brandBook)}`
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              `Create clarifying questions for this Kalpa presentation brief.\n\nBrief:\n${JSON.stringify(brief, null, 2)}\n\nSource context:\n${composeAssetContext(assets)}`
          }
        ]
      }
    ],
    text: {
      format: {
        type: "json_schema",
        ...questionsJsonSchema
      }
    }
  });

  const parsed = await parseStructuredJson(response, z.object({ questions: z.array(questionSchema) }));
  return parsed.questions;
}

export async function generateOutline(
  brief: BriefInput,
  assets: AssetRecord[],
  questions: { question: string; answer?: string; assumption?: string }[],
  settings: AdminSettings
) {
  const client = getOpenAIClient();
  const brandBook = await loadBrandBookContext();
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              `${settings.systemPrompt}\n${settings.salesDeckBias}\nBuild a credible, persuasive business presentation outline.${composeBrandPrompt(brandBook)}`
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              `Generate a ${brief.requestedSlideCount}-slide outline.\n\nBrief:\n${JSON.stringify(brief, null, 2)}\n\nQuestion answers:\n${JSON.stringify(questions, null, 2)}\n\nSource context:\n${composeAssetContext(assets)}`
          }
        ]
      }
    ],
    text: {
      format: {
        type: "json_schema",
        ...outlineJsonSchema
      }
    }
  });

  const parsed = await parseStructuredJson(response, z.object({ outline: z.array(outlineItemSchema) }));
  return parsed.outline as OutlineItem[];
}

export async function generateThemeConcepts(
  brief: BriefInput,
  assets: AssetRecord[],
  outline: OutlineItem[],
  settings: AdminSettings
) {
  const client = getOpenAIClient();
  const brandBook = await loadBrandBookContext();
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              `${settings.systemPrompt}\nCreate exactly three distinct but Kalpa-aligned visual theme directions. Each direction must still feel credible for executive ERP and operations storytelling.${composeBrandPrompt(brandBook)}`
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              `Create 3 theme options for this presentation.\n\nBrief:\n${JSON.stringify(brief, null, 2)}\n\nOutline:\n${JSON.stringify(outline, null, 2)}\n\nSource context:\n${composeAssetContext(assets)}\n\nFor each option, choose one templateFamily enum that best matches the direction, provide a short name, a one-sentence summary, a rationale, 2-4 theme keywords, and 3-4 swatch hex colors that stay within a Kalpa-safe palette.`
          }
        ]
      }
    ],
    text: {
      format: {
        type: "json_schema",
        ...themeConceptsJsonSchema
      }
    }
  });

  const parsed = await parseStructuredJson(response, z.object({ themeConcepts: z.array(themeConceptSchema).length(3) }));
  return parsed.themeConcepts as ThemeConcept[];
}

export async function generateSlides(
  brief: BriefInput,
  outline: OutlineItem[],
  assets: AssetRecord[],
  templateFamily: TemplateFamilyId,
  settings: AdminSettings,
  themeConcept?: ThemeConcept | null
) {
  const client = getOpenAIClient();
  const brandBook = await loadBrandBookContext();
  const slideDesignPrompt = composeSlideDesignPrompt();
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              `${settings.systemPrompt}\nFollow the template family exactly: ${templateFamily}.\nRespect banned words: ${settings.bannedWords.join(", ")}.\nWriting rules: ${settings.writingRules.join(" | ")}.\nOnly use imageAssetIds from the provided asset list.\nIf a theme concept is provided, reflect its tone, emphasis, and palette sensibility in the slide content and structure choices.\n${slideDesignPrompt}${composeBrandPrompt(brandBook)}`
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              `Turn this approved outline into presentation slides.\n\nBrief:\n${JSON.stringify(brief, null, 2)}\n\nSelected theme concept:\n${JSON.stringify(themeConcept || null, null, 2)}\n\nOutline:\n${JSON.stringify(outline, null, 2)}\n\nAvailable assets:\n${composeAssetInventory(assets)}\n\nSource context:\n${composeAssetContext(assets)}`
          }
        ]
      }
    ],
    text: {
      format: {
        type: "json_schema",
        ...slidesJsonSchema
      }
    }
  });

  const parsed = await parseStructuredJson(response, z.object({ slides: z.array(slideContentSchema) }));
  return finalizeSlidesForRender(parsed.slides as SlideContent[], assets);
}

export async function generatePresentationVisuals(input: {
  projectId: string;
  brief: BriefInput;
  slides: SlideContent[];
  assets: AssetRecord[];
  settings: AdminSettings;
}) {
  // Preserve supplied artwork. AI visuals fill the gap only when a project has no usable imagery.
  if (input.assets.some((asset) => isImageAsset(asset))) return [] as AssetRecord[];

  const candidates = input.slides
    .filter((slide) => ["hero", "challenge", "industry-grid", "proof", "cta"].includes(slide.layoutKind))
    .slice(0, 3);
  if (!candidates.length) return [] as AssetRecord[];

  const client = getOpenAIClient();
  const directory = await ensureProjectFilesDir(input.projectId);
  const visuals: AssetRecord[] = [];

  for (const [index, slide] of candidates.entries()) {
    const response = await client.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      size: "1536x1024",
      quality: "medium",
      output_format: "png",
      n: 1,
      prompt: [
        "Create a premium editorial visual for a Kalpa executive business presentation.",
        `Topic: ${slide.headline}.`,
        `Presentation brief: ${clipText(input.brief.rawPrompt, 460)}.`,
        "Show a believable operations, finance, manufacturing, distribution, or leadership context appropriate to the topic.",
        "Refined architectural composition, calm natural light, clear focal point, purposeful negative space for adjacent slide copy.",
        "Do not include typography, letters, logos, watermarks, dashboards, browser windows, or collage panels.",
        input.settings.imageGuidance
      ].join(" ")
    });
    const image = response.data?.[0]?.b64_json;
    if (!image) continue;

    const assetId = createId("asset");
    const name = `kalpa-visual-${String(index + 1).padStart(2, "0")}.png`;
    const relativePath = path.join("uploads", input.projectId, `${assetId}.png`);
    const buffer = Buffer.from(image, "base64");
    await fs.writeFile(path.join(directory, `${assetId}.png`), buffer);
    visuals.push({
      id: assetId,
      name,
      mimeType: "image/png",
      size: buffer.length,
      path: relativePath,
      extractedText: "AI-generated visual for this presentation.",
      createdAt: new Date().toISOString()
    });
  }

  return visuals;
}

export async function editOutline(
  brief: BriefInput,
  outline: OutlineItem[],
  assets: AssetRecord[],
  instruction: string,
  targetOutlineId: string | null,
  settings: AdminSettings
) {
  const client = getOpenAIClient();
  const brandBook = await loadBrandBookContext();
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              `${settings.systemPrompt}\nRevise only the requested outline scope. Preserve unaffected outline items. Return the full ordered outline array.${composeBrandPrompt(brandBook)}`
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              `Edit this presentation outline.\n\nBrief:\n${JSON.stringify(brief, null, 2)}\n\nInstruction: ${instruction}\n\nTarget outline ID: ${targetOutlineId || "all"}\n\nCurrent outline:\n${JSON.stringify(outline, null, 2)}\n\nSource context:\n${composeAssetContext(assets)}`
          }
        ]
      }
    ],
    text: {
      format: {
        type: "json_schema",
        ...outlineJsonSchema
      }
    }
  });

  const parsed = await parseStructuredJson(response, z.object({ outline: z.array(outlineItemSchema) }));
  return parsed.outline as OutlineItem[];
}

export async function editSlides(
  instruction: string,
  slides: SlideContent[],
  assets: AssetRecord[],
  targetSlideId: string | null,
  settings: AdminSettings
) {
  const client = getOpenAIClient();
  const brandBook = await loadBrandBookContext();
  const slideDesignPrompt = composeSlideDesignPrompt();
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              `${settings.systemPrompt}\nRevise only the requested scope. Preserve unaffected slides. Return the full slide array.\n${slideDesignPrompt}${composeBrandPrompt(brandBook)}`
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              `Edit this presentation.\n\nInstruction: ${instruction}\n\nTarget slide ID: ${targetSlideId || "all"}\n\nCurrent slides:\n${JSON.stringify(slides, null, 2)}\n\nAvailable assets:\n${composeAssetInventory(assets)}`
          }
        ]
      }
    ],
    text: {
      format: {
        type: "json_schema",
        ...slidesJsonSchema
      }
    }
  });

  const parsed = await parseStructuredJson(response, z.object({ slides: z.array(slideContentSchema) }));
  return finalizeSlidesForRender(parsed.slides as SlideContent[], assets);
}
