#!/usr/bin/env node
/**
 * Build print-ready Letter PDFs for management+ stakeholder documents.
 *
 * Usage: node scripts/build-stakeholder-pdfs.mjs
 * Output:
 *   docs/stakeholder/pdf/*.pdf
 *   public/stakeholder/*.pdf  (download at /stakeholder/*.pdf — links shown Manager+ only)
 */
import { copyFile, mkdir, readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const OUT_DIR = path.join(DOCS_DIR, 'stakeholder', 'pdf');
const PUBLIC_DIR = path.join(ROOT, 'public', 'stakeholder');
const BUILD_DATE = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const MARKDOWN_DOCS = [
  {
    file: 'executive-summary.md',
    pdf: 'Guardr-Executive-Summary.pdf',
    title: 'Executive Summary',
    subtitle: 'One-page company briefing — legal, advisors, investors',
    audience: 'Manager+ staff, counsel, advisors, investors',
    singlePage: true,
  },
  {
    file: 'company-information-package.md',
    pdf: 'Guardr-Company-Information-Package.pdf',
    title: 'Company Information Package',
    subtitle: 'Head-to-toe stakeholder briefing',
    audience: 'Manager+ staff, counsel, advisors, investors, partners',
    singlePage: false,
  },
];

const HTML_DOCS = [
  {
    file: 'counsel-intake-form.html',
    pdf: 'Guardr-Counsel-Intake-Form.pdf',
    title: 'Legal Counsel Intake Form',
  },
];

const PRINT_CSS = `
  :root {
    --ink: #111111;
    --muted: #444444;
    --line: #cccccc;
    --bg-soft: #f5f5f5;
  }
  @page { size: letter; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    color: var(--ink);
    background: #fff;
    font-family: "IBM Plex Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.4;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cover {
    page-break-after: always;
    min-height: 9.2in;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 0.4in 0.1in 0.2in;
  }
  .cover-brand { font-size: 24pt; font-weight: 700; margin: 0 0 0.1in; }
  .cover-tag { font-size: 9.5pt; color: var(--muted); margin: 0 0 0.5in; }
  .cover-rule { border: 0; border-top: 3px solid var(--ink); width: 1.6in; margin: 0 0 0.4in; }
  .cover h1 { font-size: 20pt; margin: 0 0 0.15in; }
  .cover .subtitle { font-size: 11pt; color: var(--muted); max-width: 5.5in; margin: 0; }
  .cover-meta {
    margin-top: auto;
    border-top: 1px solid var(--line);
    padding-top: 0.2in;
    font-size: 9pt;
    color: var(--muted);
  }
  .cover-meta dl {
    display: grid;
    grid-template-columns: 1.3in 1fr;
    gap: 0.06in 0.15in;
    margin: 0;
  }
  .cover-meta dt { font-weight: 600; color: var(--ink); }
  .cover-meta dd { margin: 0; }
  .cover-confidential {
    margin-top: 0.25in;
    font-size: 8.5pt;
    color: var(--muted);
    border: 1px solid var(--line);
    padding: 0.1in;
    background: var(--bg-soft);
  }
  .doc-body h1 { display: none; }
  .doc-body h2 {
    font-size: 12pt;
    margin: 0.2in 0 0.08in;
    padding-bottom: 0.04in;
    border-bottom: 1.5px solid var(--ink);
    page-break-after: avoid;
  }
  .doc-body h2:first-of-type { margin-top: 0; }
  .doc-body h3 { font-size: 10.5pt; margin: 0.15in 0 0.06in; page-break-after: avoid; }
  .doc-body p { margin: 0 0 0.1in; }
  .doc-body ul, .doc-body ol { margin: 0 0 0.1in; padding-left: 0.25in; }
  .doc-body li { margin: 0.02in 0; }
  .doc-body table {
    width: 100%;
    border-collapse: collapse;
    margin: 0 0 0.12in;
    font-size: 9pt;
    page-break-inside: auto;
  }
  .doc-body th, .doc-body td {
    border: 1px solid #bbb;
    padding: 0.05in 0.07in;
    vertical-align: top;
  }
  .doc-body th { background: var(--bg-soft); font-weight: 700; }
  .doc-body hr { border: 0; border-top: 1px solid var(--line); margin: 0.15in 0; }
  .doc-body strong { font-weight: 700; }
  .doc-body a { color: var(--ink); text-decoration: underline; }
  .single-page .doc-body { font-size: 9pt; line-height: 1.32; }
  .single-page .doc-body h2 { font-size: 10.5pt; margin: 0.12in 0 0.05in; }
  .single-page .doc-body table { font-size: 8.5pt; }
  .end-matter { page-break-before: always; margin-top: 0.15in; }
`;

function stripFirstH1(markdown) {
  return markdown.replace(/^#\s+.+\n+/, '');
}

function renderMarkdownCover(doc) {
  return `
  <section class="cover">
    <div>
      <p class="cover-brand">Guardr</p>
      <p class="cover-tag">Signature Security Specialist, LLC · Manager+ confidential</p>
      <hr class="cover-rule" />
      <h1>${doc.title}</h1>
      <p class="subtitle">${doc.subtitle}</p>
    </div>
    <div class="cover-meta">
      <dl>
        <dt>Audience</dt><dd>${doc.audience}</dd>
        <dt>Document date</dt><dd>${BUILD_DATE}</dd>
        <dt>Format</dt><dd>US Letter · print PDF</dd>
        <dt>File</dt><dd>${doc.pdf}</dd>
        <dt>Operator</dt><dd>Signature Security Specialist, LLC</dd>
      </dl>
      <p class="cover-confidential">
        <strong>Confidential.</strong> For legal counsel, advisors, investors, and Manager+ staff only.
        Not a securities offering. Guards and clients contract directly — Guardr is a technology marketplace only.
      </p>
    </div>
  </section>`;
}

function renderMarkdownHtml(doc, bodyHtml) {
  const singlePageClass = doc.singlePage ? ' single-page' : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Guardr — ${doc.title}</title>
  <style>${PRINT_CSS}</style>
</head>
<body class="${singlePageClass.trim()}">
  ${renderMarkdownCover(doc)}
  <main class="doc-body">${bodyHtml}</main>
  <section class="end-matter">
    <h2>Document control</h2>
    <table>
      <thead><tr><th>Field</th><th>Value</th></tr></thead>
      <tbody>
        <tr><td>Title</td><td>Guardr — ${doc.title}</td></tr>
        <tr><td>File</td><td>${doc.pdf}</td></tr>
        <tr><td>Printed</td><td>${BUILD_DATE}</td></tr>
        <tr><td>Source</td><td>docs/${doc.file}</td></tr>
        <tr><td>Distribution</td><td>Manager+ staff, counsel, advisors, investors</td></tr>
        <tr><td>Legal</td><td>legal@guardr.co</td></tr>
      </tbody>
    </table>
    <p style="font-size:8.5pt;color:#444;">© Signature Security Specialist, LLC. Confidential.</p>
  </section>
</body>
</html>`;
}

async function printHtmlToPdf(browser, html, pdfPath, headerTitle) {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'guardr-stakeholder-'));
  const htmlPath = path.join(tmpDir, 'doc.html');
  try {
    await writeFile(htmlPath, html, 'utf8');
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'load' });
    await page.pdf({
      path: pdfPath,
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: false,
      displayHeaderFooter: true,
      headerTemplate: `
      <div style="width:100%;font-size:8pt;color:#555;padding:0 0.75in;display:flex;justify-content:space-between;font-family:Arial,sans-serif;">
        <span>Guardr · Confidential</span>
        <span>${headerTitle}</span>
      </div>`,
      footerTemplate: `
      <div style="width:100%;font-size:8pt;color:#555;padding:0 0.75in;display:flex;justify-content:space-between;font-family:Arial,sans-serif;">
        <span>Signature Security Specialist, LLC · Manager+ only</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>`,
      margin: { top: '0.7in', bottom: '0.85in', left: '0.75in', right: '0.75in' },
    });
    await page.close();
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
  return pdfPath;
}

async function buildMarkdownPdf(browser, doc) {
  const markdown = await readFile(path.join(DOCS_DIR, doc.file), 'utf8');
  const bodyHtml = marked.parse(stripFirstH1(markdown), { async: false });
  const html = renderMarkdownHtml(doc, bodyHtml);
  const pdfPath = path.join(OUT_DIR, doc.pdf);
  await printHtmlToPdf(browser, html, pdfPath, doc.title);
  return pdfPath;
}

async function buildHtmlPdf(browser, doc) {
  const html = await readFile(path.join(DOCS_DIR, doc.file), 'utf8');
  const pdfPath = path.join(OUT_DIR, doc.pdf);
  await printHtmlToPdf(browser, html, pdfPath, doc.title);
  return pdfPath;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(PUBLIC_DIR, { recursive: true });

  const browser = await chromium.launch();
  const built = [];

  try {
    for (const doc of MARKDOWN_DOCS) {
      const pdfPath = await buildMarkdownPdf(browser, doc);
      built.push(pdfPath);
      console.log(`Built ${doc.pdf}`);
    }
    for (const doc of HTML_DOCS) {
      const pdfPath = await buildHtmlPdf(browser, doc);
      built.push(pdfPath);
      console.log(`Built ${doc.pdf}`);
    }
  } finally {
    await browser.close();
  }

  for (const pdfPath of built) {
    const fileName = path.basename(pdfPath);
    await copyFile(pdfPath, path.join(PUBLIC_DIR, fileName));
  }

  console.log(`\nDone. ${built.length} PDFs → docs/stakeholder/pdf/ and public/stakeholder/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
