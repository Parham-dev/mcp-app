import type { App } from "@modelcontextprotocol/ext-apps";

export const CHUNK_SIZE = 500 * 1024;

interface PdfBytesChunk {
  url: string;
  bytes: string;
  offset: number;
  byteCount: number;
  totalBytes: number;
  hasMore: boolean;
}

export async function loadPdfInChunks(
  app: App,
  urlToLoad: string,
  updateProgress: (loaded: number, total: number) => void,
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let offset = 0;
  let totalBytes = 0;
  let hasMore = true;

  updateProgress(0, 1);

  while (hasMore) {
    const result = await app.callServerTool({
      name: "read_pdf_bytes",
      arguments: { url: urlToLoad, offset, byteCount: CHUNK_SIZE },
    });

    if (result.isError) {
      const errorText = result.content
        ?.map((c) => ("text" in c ? c.text : ""))
        .join(" ");
      throw new Error(`Tool error: ${errorText}`);
    }

    if (!result.structuredContent) {
      throw new Error("No structuredContent in tool response");
    }

    const chunk = result.structuredContent as unknown as PdfBytesChunk;
    totalBytes = chunk.totalBytes;
    hasMore = chunk.hasMore;

    const binaryString = atob(chunk.bytes);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    chunks.push(bytes);

    offset += chunk.byteCount;
    updateProgress(offset, totalBytes);
  }

  const fullPdf = new Uint8Array(totalBytes);
  let pos = 0;
  for (const chunk of chunks) {
    fullPdf.set(chunk, pos);
    pos += chunk.length;
  }

  return fullPdf;
}
