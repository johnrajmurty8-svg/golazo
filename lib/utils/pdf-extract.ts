export async function extractPdfText(buffer: Buffer): Promise<string | null> {
  try {
    // pdf-parse is excluded from bundling (serverExternalPackages) — use require for CJS compat
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
    const result = await pdfParse(buffer);
    const text = result.text?.trim() ?? "";
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}
