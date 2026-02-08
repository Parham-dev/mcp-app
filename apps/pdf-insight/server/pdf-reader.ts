import fs from "node:fs";
import { isFileUrl, isArxivUrl, normalizeArxivUrl, fileUrlToPath } from "./url.js";

export const MAX_CHUNK_BYTES = 512 * 1024; // 512KB max per request

export async function readPdfRange(
  url: string,
  offset: number,
  byteCount: number,
): Promise<{ data: Uint8Array; totalBytes: number }> {
  const normalized = isArxivUrl(url) ? normalizeArxivUrl(url) : url;
  const clampedByteCount = Math.min(byteCount, MAX_CHUNK_BYTES);

  if (isFileUrl(normalized)) {
    const filePath = fileUrlToPath(normalized);
    const stats = await fs.promises.stat(filePath);
    const totalBytes = stats.size;

    // Clamp to file bounds
    const start = Math.min(offset, totalBytes);
    const end = Math.min(start + clampedByteCount, totalBytes);

    if (start >= totalBytes) {
      return { data: new Uint8Array(0), totalBytes };
    }

    // Read range from local file
    const buffer = Buffer.alloc(end - start);
    const fd = await fs.promises.open(filePath, "r");
    try {
      await fd.read(buffer, 0, end - start, start);
    } finally {
      await fd.close();
    }

    return { data: new Uint8Array(buffer), totalBytes };
  }

  // Remote URL - Range request
  const response = await fetch(normalized, {
    headers: {
      Range: `bytes=${offset}-${offset + clampedByteCount - 1}`,
    },
  });

  if (!response.ok && response.status !== 206) {
    throw new Error(
      `Range request failed: ${response.status} ${response.statusText}`,
    );
  }

  // Parse total size from Content-Range header
  const contentRange = response.headers.get("content-range");
  let totalBytes = 0;
  if (contentRange) {
    const match = contentRange.match(/bytes \d+-\d+\/(\d+)/);
    if (match) {
      totalBytes = parseInt(match[1], 10);
    }
  }

  const data = new Uint8Array(await response.arrayBuffer());
  return { data, totalBytes };
}
