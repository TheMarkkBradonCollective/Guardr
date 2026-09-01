# Guardr marketing kit

Portable ads for the Sacramento launch. Guardr is a **marketplace**, not a security company.

**Never say “client.”** Say **people and businesses** (or “need security”). Guards are **independent contractors**.

## Quick use

Finished files live in `assets/marketing/export/`:

| File | Use |
|---|---|
| `sacramento-launch-square.png` | Instagram / LinkedIn / Facebook feed — **Sacramento post** |
| `sacramento-launch-story.png` | Instagram / TikTok / Reels story |
| `sacramento-launch-landscape.png` | Facebook / LinkedIn / OG share |
| `ic-recruit-square.png` / `ic-recruit-story.png` | Independent contractor recruitment (photo, no app) |
| `ic-app-preview-square.png` / `ic-app-preview-story.png` | Independent contractor ads **with in-app UI** |
| `need-security-square.png` / `need-security-story.png` | People & businesses (photo) |
| `need-security-app-preview-*.png` | People & businesses **with in-app UI** |
| `platform-explainer-*.png` | Typographic “we are a platform” |
| `real-app-ic-square.png` / `real-app-ic-story.png` | **Real in-app Shifts screenshot** (Sacramento) |
| `landing-preview-landscape.png` / `landing-mobile-story.png` | Real homepage preview |
| `carousel-01/02/03-*.png` | Instagram carousel (3 slides) |
| `twitter-1600x900.png` | X / LinkedIn banner |
| `og-image.png` | Website share card |
| `flyer-sacramento.pdf` | Print flyer (letter) |
| `flyer-independent-contractors.pdf` | Print flyer for contractors |
| `business-card.png` | Digital card |
| `*.jpg` | Same boards, smaller email-friendly copies |

Captions for each post: [`copy.md`](./copy.md).

Photos (no text) are in `photos/`. HTML boards: `templates/boards.html`.

## Regenerate

```bash
npx playwright install chromium
npm run generate:marketing
```

To also capture live app screens (needs `npm run dev`):

```bash
GUARDR_CAPTURE_APP=1 npm run generate:marketing
```

Live captures write to `screenshots/`.
