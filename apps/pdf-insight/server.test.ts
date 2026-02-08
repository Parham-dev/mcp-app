import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  isFileUrl,
  isArxivUrl,
  normalizeArxivUrl,
  fileUrlToPath,
  pathToFileUrl,
  validateUrl,
  readPdfRange,
  allowedLocalFiles,
} from "./server.js";

// ---------------------------------------------------------------------------
// isFileUrl
// ---------------------------------------------------------------------------
describe("isFileUrl", () => {
  it("returns true for file:// URLs", () => {
    expect(isFileUrl("file:///tmp/test.pdf")).toBe(true);
    expect(isFileUrl("file:///home/user/doc.pdf")).toBe(true);
  });

  it("returns false for non-file URLs", () => {
    expect(isFileUrl("https://arxiv.org/pdf/123")).toBe(false);
    expect(isFileUrl("http://example.com")).toBe(false);
    expect(isFileUrl("")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isArxivUrl
// ---------------------------------------------------------------------------
describe("isArxivUrl", () => {
  it("returns true for arxiv.org URLs", () => {
    expect(isArxivUrl("https://arxiv.org/abs/1706.03762")).toBe(true);
    expect(isArxivUrl("https://arxiv.org/pdf/1706.03762")).toBe(true);
  });

  it("returns true for www.arxiv.org", () => {
    expect(isArxivUrl("https://www.arxiv.org/abs/1706.03762")).toBe(true);
  });

  it("returns false for non-arxiv URLs", () => {
    expect(isArxivUrl("https://example.com")).toBe(false);
    expect(isArxivUrl("https://biorxiv.org/pdf/123")).toBe(false);
  });

  it("returns false for invalid URLs", () => {
    expect(isArxivUrl("not-a-url")).toBe(false);
    expect(isArxivUrl("")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// normalizeArxivUrl
// ---------------------------------------------------------------------------
describe("normalizeArxivUrl", () => {
  it("converts /abs/ to /pdf/", () => {
    expect(normalizeArxivUrl("https://arxiv.org/abs/1706.03762")).toBe(
      "https://arxiv.org/pdf/1706.03762",
    );
  });

  it("strips trailing .pdf", () => {
    expect(normalizeArxivUrl("https://arxiv.org/pdf/1706.03762.pdf")).toBe(
      "https://arxiv.org/pdf/1706.03762",
    );
  });

  it("handles already-normalized URLs (no-op)", () => {
    expect(normalizeArxivUrl("https://arxiv.org/pdf/1706.03762")).toBe(
      "https://arxiv.org/pdf/1706.03762",
    );
  });

  it("converts /abs/ and strips .pdf together", () => {
    expect(normalizeArxivUrl("https://arxiv.org/abs/1706.03762.pdf")).toBe(
      "https://arxiv.org/pdf/1706.03762",
    );
  });
});

// ---------------------------------------------------------------------------
// fileUrlToPath
// ---------------------------------------------------------------------------
describe("fileUrlToPath", () => {
  it("converts file:// URL to a path", () => {
    expect(fileUrlToPath("file:///tmp/test.pdf")).toBe("/tmp/test.pdf");
  });

  it("decodes percent-encoded characters", () => {
    expect(fileUrlToPath("file:///tmp/my%20file.pdf")).toBe(
      "/tmp/my file.pdf",
    );
  });
});

// ---------------------------------------------------------------------------
// pathToFileUrl
// ---------------------------------------------------------------------------
describe("pathToFileUrl", () => {
  it("converts absolute path to file:// URL", () => {
    const url = pathToFileUrl("/tmp/test.pdf");
    expect(url).toBe("file:///tmp/test.pdf");
  });

  it("encodes spaces in path", () => {
    const url = pathToFileUrl("/tmp/my file.pdf");
    expect(url).toBe("file:///tmp/my%20file.pdf");
  });

  it("roundtrips with fileUrlToPath", () => {
    const original = "/tmp/some path/doc.pdf";
    expect(fileUrlToPath(pathToFileUrl(original))).toBe(original);
  });
});

// ---------------------------------------------------------------------------
// validateUrl
// ---------------------------------------------------------------------------
describe("validateUrl", () => {
  it("accepts allowed remote origins", () => {
    expect(validateUrl("https://arxiv.org/pdf/1706.03762")).toEqual({
      valid: true,
    });
    expect(validateUrl("https://www.biorxiv.org/content/123")).toEqual({
      valid: true,
    });
  });

  it("rejects disallowed remote origins", () => {
    const result = validateUrl("https://evil.com/malware.pdf");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/not allowed/i);
  });

  it("rejects invalid URLs", () => {
    const result = validateUrl("not-a-url");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/invalid url/i);
  });

  describe("local files", () => {
    const tmpFile = path.join(os.tmpdir(), "validate-test.pdf");

    beforeEach(() => {
      fs.writeFileSync(tmpFile, "fake-pdf");
      allowedLocalFiles.add(tmpFile);
    });

    afterEach(() => {
      allowedLocalFiles.delete(tmpFile);
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    });

    it("accepts an allowed local file", () => {
      const url = `file://${tmpFile}`;
      expect(validateUrl(url)).toEqual({ valid: true });
    });

    it("rejects a local file not in the allow list", () => {
      allowedLocalFiles.delete(tmpFile);
      const url = `file://${tmpFile}`;
      const result = validateUrl(url);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/not in allowed list/i);
    });

    it("rejects an allowed file that does not exist on disk", () => {
      fs.unlinkSync(tmpFile);
      const url = `file://${tmpFile}`;
      const result = validateUrl(url);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/not found/i);
    });
  });
});

// ---------------------------------------------------------------------------
// readPdfRange — local file reading
// ---------------------------------------------------------------------------
describe("readPdfRange", () => {
  const tmpFile = path.join(os.tmpdir(), "readrange-test.pdf");
  const content = Buffer.from("Hello PDF world — test content for range reads");

  beforeEach(() => {
    fs.writeFileSync(tmpFile, content);
    allowedLocalFiles.add(tmpFile);
  });

  afterEach(() => {
    allowedLocalFiles.delete(tmpFile);
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it("reads from offset 0", async () => {
    const url = `file://${tmpFile}`;
    const result = await readPdfRange(url, 0, 10);
    expect(result.totalBytes).toBe(content.length);
    expect(result.data.length).toBe(10);
    expect(Buffer.from(result.data).toString()).toBe(
      content.subarray(0, 10).toString(),
    );
  });

  it("reads from a non-zero offset", async () => {
    const url = `file://${tmpFile}`;
    const result = await readPdfRange(url, 6, 3);
    expect(Buffer.from(result.data).toString()).toBe("PDF");
  });

  it("clamps reads past end of file", async () => {
    const url = `file://${tmpFile}`;
    const result = await readPdfRange(url, content.length - 5, 100);
    expect(result.data.length).toBe(5);
  });

  it("returns empty data for offset beyond file size", async () => {
    const url = `file://${tmpFile}`;
    const result = await readPdfRange(url, content.length + 100, 10);
    expect(result.data.length).toBe(0);
  });
});
