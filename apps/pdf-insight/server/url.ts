import fs from "node:fs";
import path from "node:path";

export function isFileUrl(url: string): boolean {
  return url.startsWith("file://");
}

export function isArxivUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "arxiv.org" || parsed.hostname === "www.arxiv.org"
    );
  } catch {
    return false;
  }
}

export function normalizeArxivUrl(url: string): string {
  // Convert arxiv abstract URLs to PDF URLs
  // https://arxiv.org/abs/1706.03762 -> https://arxiv.org/pdf/1706.03762
  return url.replace("/abs/", "/pdf/").replace(/\.pdf$/, "");
}

export function fileUrlToPath(fileUrl: string): string {
  return decodeURIComponent(fileUrl.replace("file://", ""));
}

export function pathToFileUrl(filePath: string): string {
  const absolutePath = path.resolve(filePath);
  return `file://${encodeURIComponent(absolutePath).replace(/%2F/g, "/")}`;
}

export function validateUrl(
  url: string,
  allowedRemoteOrigins: Set<string>,
  allowedLocalFiles: Set<string>,
): { valid: boolean; error?: string } {
  if (isFileUrl(url)) {
    const filePath = fileUrlToPath(url);
    if (!allowedLocalFiles.has(filePath)) {
      return {
        valid: false,
        error: `Local file not in allowed list: ${filePath}`,
      };
    }
    if (!fs.existsSync(filePath)) {
      return { valid: false, error: `File not found: ${filePath}` };
    }
    return { valid: true };
  }

  // Remote URL - check against allowed origins
  try {
    const parsed = new URL(url);
    const origin = `${parsed.protocol}//${parsed.hostname}`;
    if (
      ![...allowedRemoteOrigins].some((allowed) => origin.startsWith(allowed))
    ) {
      return { valid: false, error: `Origin not allowed: ${origin}` };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: `Invalid URL: ${url}` };
  }
}
