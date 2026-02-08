# PDF Viewer (PDF Insight)

Interactive PDF viewer using PDF.js. Supports remote URLs from an allowlist and chunked streaming via app-only tools.

## Tools

- `list_pdfs` - List available local files (if configured) and allowed remote origins.
- `display_pdf` - Open the PDF viewer UI for a given URL and page.
- `read_pdf_bytes` - App-only tool used by the UI to stream PDF bytes in chunks.

## Notes

This app mirrors the example in `examples/pdf-server` and is intended to work the same way.
