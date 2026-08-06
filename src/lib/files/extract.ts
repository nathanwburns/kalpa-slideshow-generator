import fs from "fs/promises";
import path from "path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { clipText } from "@/lib/utils";

const execFileAsync = promisify(execFile);

const textLike = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/xml"
]);

export async function extractTextFromFile(filePath: string, mimeType: string) {
  const extension = path.extname(filePath).toLowerCase();

  if (textLike.has(mimeType)) {
    return clipText(await fs.readFile(filePath, "utf8"), 18000);
  }

  if (mimeType === "application/pdf" || extension === ".pdf") {
    const buffer = await fs.readFile(filePath);
    const result = await pdfParse(buffer);
    return clipText(result.text || "", 18000);
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === ".docx"
  ) {
    const result = await mammoth.extractRawText({ path: filePath });
    return clipText(result.value || "", 18000);
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    extension === ".pptx"
  ) {
    return extractTextFromPptx(filePath);
  }

  return "";
}

async function extractTextFromPptx(filePath: string) {
  try {
    const { stdout: entriesRaw } = await execFileAsync("unzip", ["-Z1", filePath], { maxBuffer: 1024 * 1024 * 4 });
    const entries = entriesRaw
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => /^ppt\/(slides|notesSlides)\/(slide|notesSlide)\d+\.xml$/i.test(item))
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

    if (!entries.length) {
      return "";
    }

    const chunks: string[] = [];
    for (const entry of entries) {
      const { stdout } = await execFileAsync("unzip", ["-p", filePath, entry], { maxBuffer: 1024 * 1024 * 4 });
      const text = decodeXmlEntities(
        stdout
          .replace(/<a:tab\/>/g, "\t")
          .replace(/<a:br\/>/g, "\n")
          .replace(/<\/a:p>/g, "\n")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+\n/g, "\n")
          .replace(/\n\s+/g, "\n")
          .replace(/[ \t]{2,}/g, " ")
          .trim()
      );

      if (text) {
        chunks.push(text);
      }
    }

    return clipText(chunks.join("\n\n"), 18000);
  } catch {
    return "";
  }
}

function decodeXmlEntities(input: string) {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&#10;/g, "\n")
    .replace(/&#13;/g, "\n")
    .replace(/&#9;/g, "\t");
}
