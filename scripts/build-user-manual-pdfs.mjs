#!/usr/bin/env node
/**
 * Build print-ready Letter PDFs for docs/user-manuals/*.md
 *
 * Usage: node scripts/build-user-manual-pdfs.mjs
 * Output: docs/user-manuals/pdf/*.pdf
 */
import { mkdir, readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MANUALS_DIR = path.join(ROOT, 'docs', 'user-manuals');
const OUT_DIR = path.join(MANUALS_DIR, 'pdf');
const BUILD_DATE = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const MANUALS = [
  {
    file: 'quick-start.md',
    pdf: 'Guardr-Quick-Start.pdf',
    title: 'Quick Start',
    subtitle: 'Get started as a client, guard, or Guardr staff member',
    audience: 'New users',
  },
  {
    file: 'client-user-manual.md',
    pdf: 'Guardr-Client-User-Manual.pdf',
    title: 'Client User Manual',
    subtitle: 'Post jobs, hire licensed guards, pay, and confirm coverage',
    audience: 'Businesses & property owners',
  },
  {
    file: 'guard-user-manual.md',
    pdf: 'Guardr-Guard-User-Manual.pdf',
    title: 'Guard User Manual',
    subtitle: 'Credentials, marketplace jobs, shifts, and payouts',
    audience: 'Licensed independent contractors',
  },
  {
    file: 'staff-ops-manual.md',
    pdf: 'Guardr-Staff-Ops-Manual.pdf',
    title: 'Staff Ops Manual',
    subtitle: 'Support through Founder — onboarding, verification, and operations',
    audience: 'Platform staff',
  },
];

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

  .doc-body h1 {
    display: none; /* title lives on cover */
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

  /* Major staff-manual parts start on a new page (except the first) */
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

/** Mark major "Part …" H2s so print CSS can start them on a new page. */
function markPartHeadings(html) {
  let seenPart = false;
  return html.replace(/<h2>(\s*Part\s+[A-Z0-9]+[\s\S]*?)<\/h2>/gi, (_, inner) => {
    const cls = seenPart ? 'part-break' : 'part-break part-break-first';
    seenPart = true;
    return `<h2 class="${cls}">${inner}</h2>`;
  });
}

function renderHtml({ title, subtitle, audience, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Guardr — ${title}</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  <section class="cover">
    <div>
      <p class="cover-brand">Guardr</p>
      <p class="cover-tag">Anytime. Anywhere. Security, When You Need It.</p>
      <hr class="cover-rule" />
      <h1>${title}</h1>
      <p class="subtitle">${subtitle}</p>
    </div>
    <div class="cover-meta">
      <dl>
        <dt>Audience</dt><dd>${audience}</dd>
        <dt>Document date</dt><dd>${BUILD_DATE}</dd>
        <dt>Format</dt><dd>US Letter · print-ready PDF</dd>
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
        <tr><td>Title</td><td>Guardr — ${title}</td></tr>
        <tr><td>Audience</td><td>${audience}</td></tr>
        <tr><td>Printed</td><td>${BUILD_DATE}</td></tr>
        <tr><td>Source</td><td>docs/user-manuals (repository)</td></tr>
        <tr><td>Support</td><td>support@guardr.co · In-app Support</td></tr>
        <tr><td>Legal</td><td>guardr.co/legal/terms · guardr.co/legal/privacy</td></tr>
      </tbody>
    </table>
    <p>© Signature Security Specialist, LLC. For authorized internal and user distribution.</p>
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
  return { pdfPath };
}

async function buildOne(browser, manual) {
  const mdPath = path.join(MANUALS_DIR, manual.file);
  const markdown = await readFile(mdPath, 'utf8');
  const bodyHtml = markPartHeadings(
    marked.parse(stripFirstH1(markdown), { async: false }),
  );
  const html = renderHtml({
    title: manual.title,
    subtitle: manual.subtitle,
    audience: manual.audience,
    bodyHtml,
  });
  const pdfPath = path.join(OUT_DIR, manual.pdf);
  return printHtmlToPdf(browser, html, pdfPath, manual.title);
}

async function buildCombined(browser) {
  const sections = [];
  for (const manual of MANUALS) {
    const markdown = await readFile(path.join(MANUALS_DIR, manual.file), 'utf8');
    const bodyHtml = markPartHeadings(
      marked.parse(stripFirstH1(markdown), { async: false }),
    );
    sections.push(`
      <section class="cover">
        <div>
          <p class="cover-brand">Guardr</p>
          <p class="cover-tag">User Manuals · Combined print edition</p>
          <hr class="cover-rule" />
          <h1>${manual.title}</h1>
          <p class="subtitle">${manual.subtitle}</p>
        </div>
        <div class="cover-meta">
          <dl>
            <dt>Audience</dt><dd>${manual.audience}</dd>
            <dt>Document date</dt><dd>${BUILD_DATE}</dd>
          </dl>
        </div>
      </section>
      <main class="doc-body">${bodyHtml}</main>
    `);
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Guardr — User Manuals (Combined)</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  <section class="cover">
    <div>
      <p class="cover-brand">Guardr</p>
      <p class="cover-tag">Anytime. Anywhere. Security, When You Need It.</p>
      <hr class="cover-rule" />
      <h1>User Manuals</h1>
      <p class="subtitle">Combined print edition — Quick Start, Client, Guard, and Staff Ops.</p>
      <ol>
        ${MANUALS.map((m) => `<li><strong>${m.title}</strong> — ${m.audience}</li>`).join('')}
      </ol>
    </div>
    <div class="cover-meta">
      <dl>
        <dt>Document date</dt><dd>${BUILD_DATE}</dd>
        <dt>Format</dt><dd>US Letter · print-ready PDF</dd>
        <dt>Operator</dt><dd>Signature Security Specialist, LLC</dd>
      </dl>
      <p class="cover-legal">
        Guardr is a technology marketplace platform. Not a PPO, employer, or staffing agency.
      </p>
    </div>
  </section>
  ${sections.join('\n')}
</body>
</html>`;

  const pdfPath = path.join(OUT_DIR, 'Guardr-User-Manuals-Combined.pdf');
  return printHtmlToPdf(browser, html, pdfPath, 'User Manuals (Combined)');
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  try {
    const results = [];
    for (const manual of MANUALS) {
      const built = await buildOne(browser, manual);
      results.push(built);
      console.log('Wrote', path.relative(ROOT, built.pdfPath));
    }
    const combined = await buildCombined(browser);
    results.push(combined);
    console.log('Wrote', path.relative(ROOT, combined.pdfPath));

    const index = [
      '# Print-ready PDFs',
      '',
      `Generated ${BUILD_DATE}. US Letter, with cover page, running headers/footers, and page numbers.`,
      '',
      '| Manual | PDF |',
      '|--------|-----|',
      ...MANUALS.map((m) => `| ${m.title} | [${m.pdf}](./${m.pdf}) |`),
      `| Combined (all) | [Guardr-User-Manuals-Combined.pdf](./Guardr-User-Manuals-Combined.pdf) |`,
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
