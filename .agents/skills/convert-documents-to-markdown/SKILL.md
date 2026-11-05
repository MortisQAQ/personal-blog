---
name: convert-documents-to-markdown
description: Convert documents to Markdown with the zero-install anydoc CLI. Use when you need clean, layout-aware text and tables out of an office or PDF file — DOC/DOCX/ODT/RTF, PPT/PPTX/ODP, XLS/XLSX/ODS, PDF, EPUB, CSV — including extracting content from PowerPoint slides, and when a PDF's pages are scanned (the CLI exits 3, rerun with --ocr hosted).
---

# Convert documents to Markdown

Run the anydoc CLI. It needs Node 20+ and no install:

```bash
npx -y @firecrawl/anydoc < file >              # Markdown to stdout
npx -y @firecrawl/anydoc < file > -o out.md   # write to a file
npx -y @firecrawl/anydoc - --format csv < f   # read stdin
```

## Rules

- Supported inputs: .doc, .docx, .docm, .odt, .rtf, .epub, .pdf, .ppt, .pps, .pot, .pptx, .pptm, .ppsx, .ppsm, .odp, .xls, .xlsx, .xlsm, .xlsb, .ods, .csv. The format is detected from the file content. Pass `--format <name>` only when detection cannot work: CSV from stdin, or a missing or wrong extension.
- Exit codes: 0 success, 1 the document could not be converted, 2 usage error, 3 pages of a PDF need OCR. Failures print one `anydoc: <message>` line to stderr. The CLI never prompts.
- For a large document, write to a file with `-o` and read the parts you need instead of streaming everything into context.
- Scanned and image-only pages need OCR, which anydoc does not do, so the document exits 3. Rerun with `--ocr hosted` to send it to Firecrawl Parse. No signup needed. Pass `--api-key` or set `FIRECRAWL_API_KEY` for higher limits.
- On Windows / sandboxed agent hosts, `npx` may be unable to write its own cache (`EPERM ... _cacache`). Point the cache at a writable directory first: `$env:npm_config_cache='<workdir>\.tmp\npm-cache'`, or install once outside the sandbox with `npm i -g @firecrawl/anydoc` and call `anydoc` directly.
- Inside a Node, Python, or Rust codebase, prefer the library over shelling out: `@firecrawl/anydoc` on npm, `firecrawl-anydoc` on PyPI, `anydoc` on crates.io. Each exposes the same `to_markdown` / `toMarkdown` API.
