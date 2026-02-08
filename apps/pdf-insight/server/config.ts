import fs from "node:fs";
import path from "node:path";

export const DEFAULT_PDF = "https://arxiv.org/pdf/1706.03762"; // Attention Is All You Need
export const RESOURCE_URI = "ui://pdf-insight/mcp-app.html";

/** Allowed remote origins (security allowlist) */
export const allowedRemoteOrigins = new Set([
  "https://agrirxiv.org",
  "https://arxiv.org",
  "https://chemrxiv.org",
  "https://edarxiv.org",
  "https://engrxiv.org",
  "https://hal.science",
  "https://osf.io",
  "https://psyarxiv.com",
  "https://ssrn.com",
  "https://www.biorxiv.org",
  "https://www.eartharxiv.org",
  "https://www.medrxiv.org",
  "https://www.preprints.org",
  "https://www.researchsquare.com",
  "https://www.sportarxiv.org",
  "https://zenodo.org",
]);

/** Allowed local file paths (populated from env) */
export const allowedLocalFiles = new Set<string>();

export function addLocalFile(filePath: string) {
  const absolutePath = path.resolve(filePath.trim());
  if (!absolutePath) return;
  if (fs.existsSync(absolutePath)) {
    allowedLocalFiles.add(absolutePath);
  }
}

export function addLocalDirectory(dirPath: string) {
  const absoluteDir = path.resolve(dirPath.trim());
  if (!absoluteDir || !fs.existsSync(absoluteDir)) return;
  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.toLowerCase().endsWith(".pdf")) continue;
    addLocalFile(path.join(absoluteDir, entry.name));
  }
}

export function loadLocalPathsFromEnv() {
  const files = process.env.PDF_LOCAL_FILES;
  if (files) {
    for (const filePath of files.split(",")) {
      addLocalFile(filePath);
    }
  }

  const dirs = process.env.PDF_LOCAL_DIRS;
  if (dirs) {
    for (const dirPath of dirs.split(",")) {
      addLocalDirectory(dirPath);
    }
  }
}

loadLocalPathsFromEnv();
