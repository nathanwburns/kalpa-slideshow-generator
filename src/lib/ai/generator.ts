import { z } from "zod";
import { getOpenAIClient } from "@/lib/ai/client";
import { outlineJsonSchema, questionsJsonSchema, slidesJsonSchema } from "@/lib/ai/schemas";
import type { AdminSettings, AssetRecord, BriefInput, OutlineItem, SlideContent, TemplateFamilyId } from "@/lib/schema";
import { outlineItemSchema, questionSchema, slideContentSchema } from "@/lib/schema";

function composeAssetContext(assets: AssetRecord[]) {
  return assets
    .map(
      (asset) =>
        `Asset: ${asset.name}\nType: ${asset.mimeType}\nExtracted text:\n${asset.extractedText || "[no extractable text]"}`
    )
    .join("\n\n---\n\n")
    .slice(0, 18000);
}

async function parseStructuredJson<T>(response: any, schema: z.ZodType<T>) {
  const raw = response.output_text || response.output?.[0]?.content?.[0]?.text || "";
  return schema.parse(JSON.parse(raw));
}

export async function generateQuestions(brief: BriefInput, assets: AssetRecord[], settings: AdminSettings) {
  const client = getOpenAIClient();
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              `${settings.systemPrompt}\nAsk no more than five clarifying questions. If something can be reasonably assumed, include that assumption.`
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
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              `${settings.systemPrompt}\n${settings.salesDeckBias}\nBuild a credible, persuasive business presentation outline.`
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

export async function generateSlides(
  brief: BriefInput,
  outline: OutlineItem[],
  assets: AssetRecord[],
  templateFamily: TemplateFamilyId,
  settings: AdminSettings
) {
  const client = getOpenAIClient();
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              `${settings.systemPrompt}\nFollow the template family exactly: ${templateFamily}.\nRespect banned words: ${settings.bannedWords.join(", ")}.\nWriting rules: ${settings.writingRules.join(" | ")}.\nOnly use imageAssetIds from the provided asset list.`
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              `Turn this approved outline into presentation slides.\n\nBrief:\n${JSON.stringify(brief, null, 2)}\n\nOutline:\n${JSON.stringify(outline, null, 2)}\n\nAvailable assets:\n${JSON.stringify(
                assets.map((asset) => ({ id: asset.id, name: asset.name, mimeType: asset.mimeType })),
                null,
                2
              )}\n\nSource context:\n${composeAssetContext(assets)}`
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
  return parsed.slides as SlideContent[];
}

export async function editSlides(
  instruction: string,
  slides: SlideContent[],
  targetSlideId: string | null,
  settings: AdminSettings
) {
  const client = getOpenAIClient();
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              `${settings.systemPrompt}\nRevise only the requested scope. Preserve unaffected slides. Return the full slide array.`
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              `Edit this presentation.\n\nInstruction: ${instruction}\n\nTarget slide ID: ${targetSlideId || "all"}\n\nCurrent slides:\n${JSON.stringify(slides, null, 2)}`
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
  return parsed.slides as SlideContent[];
}
