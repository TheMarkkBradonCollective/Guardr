#!/usr/bin/env node
/**
 * Build print-ready Letter PDFs for docs/user-manuals/*.md
 *
 * Each role manual is a standalone printable PDF (cover + body + document control).
 * The combined binder merges those exact PDFs in order so content always matches.
 *
 * Usage: node scripts/build-user-manual-pdfs.mjs
 * Output:
 *   docs/user-manuals/pdf/*.pdf  (repo docs)
 *   public/manuals/*.pdf         (website / app downloads at /manuals/)
 */
import { copyFile, mkdir, readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MANUALS_DIR = path.join(ROOT, 'docs', 'user-manuals');
const OUT_DIR = path.join(MANUALS_DIR, 'pdf');
const PUBLIC_DIR = path.join(ROOT, 'public', 'manuals');
const BUILD_DATE = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

/** Standalone manuals — order is the combined binder order. */
const MANUALS = [
  {
    file: 'quick-start.md',
    pdf: 'Guardr-Quick-Start.pdf',
    title: 'Quick Start',
    subtitle: 'I need security (Personal or Business), licensed guard, or Apply to work at Guardr',
    audience: 'New users',
  },
  {
    file: 'client-user-manual.md',
    pdf: 'Guardr-Client-User-Manual.pdf',
    title: 'Client User Manual',
    subtitle: 'Hire independent contractors, post jobs, pay, and confirm coverage',
    audience: 'Personal and business clients',
  },
  {
    file: 'guard-user-manual.md',
    pdf: 'Guardr-Guard-User-Manual.pdf',
    title: 'Guard User Manual',
    subtitle: 'Independent contractor credentials, shifts, earnings, and payouts',
    audience: 'Licensed independent contractors',
  },
  {
    file: 'staff-ops-manual.md',
    pdf: 'Guardr-Staff-Ops-Manual.pdf',
    title: 'Staff Ops Manual',
    subtitle: 'Guardr employee ops, governance, marketplace payments, and staff pay',
    audience: 'Platform staff (Support through Founder)',
  },
];

const COMBINED_PDF = 'Guardr-User-Manuals-Combined.pdf';

const PRINT_CSS = `
  :root {
    --ink: #111111;
    --muted: #444444;
    --line: #cccccc;
    --accent: #111111;
    --bg-soft: #f5f5f5;
  }

  @page {
    size: letter;
  }

  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
    color: var(--ink);
    background: #fff;
    font-family: "IBM Plex Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.45;
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

  .cover-brand {
    font-size: 28pt;
    font-weight: 700;
    letter-spacing: 0.02em;
    margin: 0 0 0.15in;
  }

  .cover-tag {
    font-size: 10pt;
    color: var(--muted);
    margin: 0 0 0.6in;
  }

  .cover-rule {
    border: 0;
    border-top: 3px solid var(--ink);
    width: 1.6in;
    margin: 0 0 0.45in;
  }

  .cover h1 {
    font-size: 22pt;
    font-weight: 700;
    margin: 0 0 0.2in;
    page-break-before: avoid;
  }

  .cover .subtitle {
    font-size: 12pt;
    color: var(--muted);
    max-width: 5.5in;
    margin: 0 0 0.35in;
  }

  .cover-meta {
    margin-top: auto;
    border-top: 1px solid var(--line);
    padding-top: 0.25in;
    font-size: 9.5pt;
    color: var(--muted);
  }

  .cover-meta dl {
    display: grid;
    grid-template-columns: 1.4in 1fr;
    gap: 0.08in 0.2in;
    margin: 0;
  }

  .cover-meta dt { font-weight: 600; color: var(--ink); }
  .cover-meta dd { margin: 0; }

  .cover-legal {
    margin-top: 0.35in;
    font-size: 8.5pt;
    color: var(--muted);
    max-width: 6in;
  }

  .cover ol {
    margin: 0.15in 0 0;
    padding-left: 0.28in;
    font-size: 10.5pt;
    color: var(--ink);
  }

  .cover li { margin: 0.06in 0; }

  .doc-body h1 {
    display: none;
  }

  .doc-body h2 {
    font-size: 14pt;
    margin: 0.28in 0 0.1in;
    padding-bottom: 0.05in;
    border-bottom: 1.5px solid var(--ink);
    page-break-after: avoid;
    page-break-before: auto;
  }

  .doc-body h2:first-of-type {
    margin-top: 0;
  }

  .doc-body h2.part-break {
    page-break-before: always;
  }

  .doc-body h2.part-break-first {
    page-break-before: avoid;
  }

  .doc-body h3 {
    font-size: 11.5pt;
    margin: 0.22in 0 0.08in;
    page-break-after: avoid;
  }

  .doc-body p { margin: 0 0 0.12in; }

  .doc-body a {
    color: var(--ink);
    text-decoration: underline;
  }

  .doc-body ul, .doc-body ol {
    margin: 0 0 0.14in;
    padding-left: 0.28in;
  }

  .doc-body li { margin: 0.03in 0; }

  .doc-body strong { font-weight: 700; }

  .doc-body code {
    font-family: "IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace;
    font-size: 9pt;
    background: var(--bg-soft);
    padding: 0.02in 0.05in;
  }

  .doc-body pre {
    background: var(--bg-soft);
    border: 1px solid var(--line);
    padding: 0.12in 0.14in;
    font-size: 9pt;
    line-height: 1.35;
    white-space: pre-wrap;
    page-break-inside: avoid;
    margin: 0 0 0.16in;
  }

  .doc-body pre code {
    background: none;
    padding: 0;
  }

  .doc-body hr {
    border: 0;
    border-top: 1px solid var(--line);
    margin: 0.22in 0;
  }

  .doc-body table {
    width: 100%;
    border-collapse: collapse;
    margin: 0 0 0.18in;
    font-size: 9.5pt;
    page-break-inside: auto;
  }

  .doc-body thead { display: table-header-group; }

  .doc-body th, .doc-body td {
    border: 1px solid #bbb;
    padding: 0.06in 0.08in;
    vertical-align: top;
    text-align: left;
  }

  .doc-body th {
    background: var(--bg-soft);
    font-weight: 700;
  }

  .doc-body tr { page-break-inside: avoid; }

  .doc-body blockquote {
    margin: 0 0 0.14in;
    padding: 0.08in 0.14in;
    border-left: 3px solid var(--ink);
    background: var(--bg-soft);
    color: var(--muted);
  }

  .end-matter {
    page-break-before: always;
    margin-top: 0.2in;
  }

  .end-matter h2 {
    page-break-before: avoid;
  }
`;

function stripFirstH1(markdown) {
  return markdown.replace(/^#\s+.+\n+/, '');
}

function markPartHeadings(html) {
  let seenPart = false;
  return html.replace(/<h2>(\s*Part\s+[A-Z0-9]+[\s\S]*?)<\/h2>/gi, (_, inner) => {
    const cls = seenPart ? 'part-break' : 'part-break part-break-first';
    seenPart = true;
    return `<h2 class="${cls}">${inner}</h2>`;
  });
}

async function markdownToBodyHtml(fileName) {
  const markdown = await readFile(path.join(MANUALS_DIR, fileName), 'utf8');
  return markPartHeadings(marked.parse(stripFirstH1(markdown), { async: false }));
}

function renderStandaloneHtml(manual, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Guardr — ${manual.title}</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  <section class="cover">
    <div>
      <p class="cover-brand">Guardr</p>
      <p class="cover-tag">Anytime. Anywhere. Security, When You Need It.</p>
      <hr class="cover-rule" />
      <h1>${manual.title}</h1>
      <p class="subtitle">${manual.subtitle}</p>
      <p class="cover-legal" style="margin-top:0.25in;font-size:9pt;">
        Standalone printable manual — print this PDF alone or use the combined binder
        (<strong>${COMBINED_PDF}</strong>) which contains this file unchanged.
      </p>
    </div>
    <div class="cover-meta">
      <dl>
        <dt>Audience</dt><dd>${manual.audience}</dd>
        <dt>Document date</dt><dd>${BUILD_DATE}</dd>
        <dt>Format</dt><dd>US Letter · standalone print PDF</dd>
        <dt>File</dt><dd>${manual.pdf}</dd>
        <dt>Operator</dt><dd>Signature Security Specialist, LLC</dd>
        <dt>Product</dt><dd>guardr.co</dd>
      </dl>
      <p class="cover-legal">
        Guardr is a technology marketplace platform. It is not a private patrol operator,
        security guard employer, or staffing agency. Guards and clients contract directly
        for each job. This document is for operational training and end-user reference.
      </p>
    </div>
  </section>
  <main class="doc-body">
    ${bodyHtml}
  </main>
  <section class="end-matter">
    <h2>Document control</h2>
    <table>
      <thead><tr><th>Field</th><th>Value</th></tr></thead>
      <tbody>
        <tr><td>Title</td><td>Guardr — ${manual.title}</td></tr>
        <tr><td>File</td><td>${manual.pdf}</td></tr>
        <tr><td>Audience</td><td>${manual.audience}</td></tr>
        <tr><td>Printed</td><td>${BUILD_DATE}</td></tr>
        <tr><td>Source</td><td>docs/user-manuals/${manual.file}</td></tr>
        <tr><td>Combined binder</td><td>${COMBINED_PDF} (this manual included in order)</td></tr>
        <tr><td>Support</td><td>support@guardr.co · In-app Support</td></tr>
        <tr><td>Legal</td><td>guardr.co/legal/terms · guardr.co/legal/privacy</td></tr>
      </tbody>
    </table>
    <p>© Signature Security Specialist, LLC. For authorized internal and user distribution.</p>
  </section>
</body>
</html>`;
}

function renderBinderCoverHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Guardr — User Manuals (Combined Binder)</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  <section class="cover">
    <div>
      <p class="cover-brand">Guardr</p>
      <p class="cover-tag">Anytime. Anywhere. Security, When You Need It.</p>
      <hr class="cover-rule" />
      <h1>User Manuals</h1>
      <p class="subtitle">Combined print binder — assembled from the standalone role PDFs below (same content, same order).</p>
      <ol>
        ${MANUALS.map((m, i) => `<li><strong>${m.title}</strong> — ${m.audience}<br /><span style="color:var(--muted);font-size:9pt;">File: ${m.pdf}</span></li>`).join('')}
      </ol>
      <p class="cover-legal" style="margin-top:0.3in;">
        To print one role only, download its standalone PDF. Each section in this binder matches its standalone file page-for-page (after this cover).
      </p>
    </div>
    <div class="cover-meta">
      <dl>
        <dt>Document date</dt><dd>${BUILD_DATE}</dd>
        <dt>Format</dt><dd>US Letter · combined binder PDF</dd>
        <dt>File</dt><dd>${COMBINED_PDF}</dd>
        <dt>Operator</dt><dd>Signature Security Specialist, LLC</dd>
      </dl>
      <p class="cover-legal">
        Guardr is a technology marketplace platform. Not a PPO, employer, or staffing agency.
      </p>
    </div>
  </section>
</body>
</html>`;
}

async function printHtmlToPdf(browser, html, pdfPath, headerTitle) {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'guardr-manual-'));
  const htmlPath = path.join(tmpDir, 'manual.html');
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
        <span>Guardr</span>
        <span>${headerTitle}</span>
      </div>`,
      footerTemplate: `
      <div style="width:100%;font-size:8pt;color:#555;padding:0 0.75in;display:flex;justify-content:space-between;font-family:Arial,sans-serif;">
        <span>Signature Security Specialist, LLC · Confidential training copy</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>`,
      margin: {
        top: '0.7in',
        bottom: '0.85in',
        left: '0.75in',
        right: '0.75in',
      },
    });
    await page.close();
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
  return pdfPath;
}

async function buildStandalone(browser, manual) {
  const bodyHtml = await markdownToBodyHtml(manual.file);
  const html = renderStandaloneHtml(manual, bodyHtml);
  const pdfPath = path.join(OUT_DIR, manual.pdf);
  await printHtmlToPdf(browser, html, pdfPath, manual.title);
  return pdfPath;
}

async function buildBinderCover(browser) {
  const pdfPath = path.join(OUT_DIR, '.binder-cover-temp.pdf');
  await printHtmlToPdf(browser, renderBinderCoverHtml(), pdfPath, 'User Manuals (Combined)');
  return pdfPath;
}

async function mergePdfFiles(outputPath, inputPaths) {
  const merged = await PDFDocument.create();
  for (const inputPath of inputPaths) {
    const bytes = await readFile(inputPath);
    const doc = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    for (const page of pages) {
      merged.addPage(page);
    }
  }
  const saved = await merged.save();
  await writeFile(outputPath, saved);
  return outputPath;
}

async function buildCombined(browser, standalonePaths) {
  const binderCoverPath = await buildBinderCover(browser);
  const combinedPath = path.join(OUT_DIR, COMBINED_PDF);
  try {
    await mergePdfFiles(combinedPath, [binderCoverPath, ...standalonePaths]);
  } finally {
    await rm(binderCoverPath, { force: true });
  }
  return combinedPath;
}

async function syncPublicDownloads(pdfPaths) {
  await mkdir(PUBLIC_DIR, { recursive: true });
  for (const pdfPath of pdfPaths) {
    const dest = path.join(PUBLIC_DIR, path.basename(pdfPath));
    await copyFile(pdfPath, dest);
    console.log('Synced', path.relative(ROOT, dest));
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(PUBLIC_DIR, { recursive: true });

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  try {
    const standalonePaths = [];
    for (const manual of MANUALS) {
      const pdfPath = await buildStandalone(browser, manual);
      standalonePaths.push(pdfPath);
      console.log('Wrote standalone', path.relative(ROOT, pdfPath));
    }

    const combinedPath = await buildCombined(browser, standalonePaths);
    console.log('Wrote combined (merged standalone PDFs)', path.relative(ROOT, combinedPath));

    const allPaths = [...standalonePaths, combinedPath];
    await syncPublicDownloads(allPaths);

    const index = [
      '# Print-ready PDFs',
      '',
      `Generated ${BUILD_DATE}. US Letter, with cover page, running headers/footers, and page numbers.`,
      '',
      'Each role manual is a **standalone printable PDF**. The combined binder merges those exact files in order (plus a binder cover page).',
      '',
      'Public downloads (website/app): `/manuals/*.pdf` and [guardr.co/manuals](https://www.guardr.co/manuals).',
      '',
      '| Manual | Standalone PDF | In combined binder |',
      '|--------|----------------|-------------------|',
      ...MANUALS.map((m) => `| ${m.title} | [${m.pdf}](./${m.pdf}) | Yes (same file) |`),
      `| Combined binder | [${COMBINED_PDF}](./${COMBINED_PDF}) | All standalone PDFs merged |`,
      '',
      'Regenerate:',
      '',
      '```bash',
      'npm run docs:manuals-pdf',
      '```',
      '',
    ].join('\n');
    await writeFile(path.join(OUT_DIR, 'README.md'), index, 'utf8');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
