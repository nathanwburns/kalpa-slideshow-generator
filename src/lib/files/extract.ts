import fs from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { clipText } from "@/lib/utils";

const textLike = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/xml"
]);

export async function extractTextFromFile(filePath: string, mimeType: string) {
  if (textLike.has(mimeType)) {
    return clipText(await fs.readFile(filePath, "utf8"), 18000);
  }

  if (mimeType === "application/pdf" || path.extname(filePath).toLowerCase() === ".pdf") {
    const buffer = await fs.readFile(filePath);
    const result = await pdfParse(buffer);
    return clipText(result.text || "", 18000);
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    path.extname(filePath).toLowerCase() === ".docx"
  ) {
    const result = await mammoth.extractRawText({ path: filePath });
    return clipText(result.value || "", 18000);
  }

  return "";
}
