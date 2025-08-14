## TimeLab — Interactive Analog Clock

A beautiful, full‑screen analog clock (SVG) with Normal and Interactive modes. Designed for teaching kids to tell time while also being a practical world‑clock with themes and timezone support.

### Table of Contents
- Overview
- Requirements vs Delivery
- Features (Current)
- Usage
- Deployment
- SEO & Monetization
- Accessibility
- Roadmap (Future Work)

## Overview
TimeLab provides two primary modes:
- Normal: A live clock that adapts to your timezone with optional digital readout and customization.
- Interactive: A hands‑on teaching tool where kids can drag hands, toggle visibility, and hear the time read aloud.

## Requirements vs Delivery

### User Requirements (Initial)
- Full‑screen analog clock with a Normal mode and an Interactive mode.
- Normal mode: detect current timezone and show time; optional digital display; 12/24‑hour; seconds on/off; multiple color themes.
- Interactive mode: show/hide specific hands; show/hide numbers; read time; drag hands; teaching helpers.
- Settings accessible on the main page for kid‑friendly interaction.
- Option to add ads for monetization.

### Delivered (v1)
- Full‑screen analog clock (SVG), responsive layout.
- Two modes (Normal/Interactive) with a persistent sidebar settings panel on desktop; collapsible on small screens.
- Normal mode:
  - Auto timezone detection and manual timezone selection (common IANA zones included).
  - Digital display toggle; 12/24‑hour toggle; seconds on/off.
  - Multiple themes (blue, mint, purple, sunset, slate, contrast).
- Interactive mode:
  - Toggle hour/minute/second hands and numbers on/off.
  - Drag to set time (mouse/touch).
  - “Read time aloud” via Speech Synthesis.
  - Spotlight on the dragged hand with nearest number highlighting.
- Responsiveness: digital/timezone labels adjusted to avoid clipping; extra bottom padding when ads are present.
- SEO: meta description/keywords, Open Graph/Twitter cards, JSON‑LD (WebApplication), canonical, favicon.
- Monetization: Google AdSense script + bottom banner `adsbygoogle` slot (requires your publisher ID & approval).

### Partially Delivered / Known Gaps
- Drag modes: UI includes Independent vs Snapped. Current logic:
  - Minute hand: independent; in Snapped mode, it proportionally nudges the hour (e.g., at :30 the hour is halfway between numbers).
  - Hour hand: currently snaps to nearest hour on drag; Independent (continuous) drag is planned.
- Timezone list: a common subset is included. A searchable, full IANA list is planned.
- Ads: basic slot wired; consent management and empty‑slot auto‑collapse are planned.

## Features (Current)
- Analog clock face with minute/hour ticks and numbers.
- Smooth updates at ~60fps.
- Digital readout (optional) with 12/24h and seconds.
- Theme switching via on‑page swatches.
- Timezone label + selectable timezone in Normal mode.
- Interactive teaching:
  - Toggle hands/numbers; drag hands; read time aloud.
  - Spotlight on drag with target number highlight.

## Usage

### Local
Open `index.html` directly or serve locally (e.g., `python3 -m http.server` or `npx serve .`).

### Settings
- Mode switch: Normal / Interactive.
- Normal mode:
  - Show digital time, Show seconds.
  - 12h/24h toggle.
  - Timezone select (Auto or common IANA zones).
  - Theme picker.
- Interactive mode:
  - Show hour/minute/second hand, Show numbers.
  - Allow dragging hands.
  - Drag mode: Independent vs Snapped (teaching‑friendly).
  - Spotlight on drag (hand tip + number highlight).
  - Read time aloud / Set to now / Random time.

## Deployment

### S3 static hosting
1. Create S3 bucket; enable Static Website Hosting (index: `index.html`).
2. Upload `index.html`, `styles.css`, `script.js` (and a `favicon.ico` if desired).
3. Make public (bucket policy) or front with CloudFront for HTTPS.

CLI example:
```bash
aws s3 mb s3://your-clock-bucket
aws s3 sync . s3://your-clock-bucket --delete --exclude ".git/*" --exclude ".DS_Store"
```

### CloudFront (recommended)
- Create a distribution with S3 as origin.
- Set default root object to `index.html`.
- Attach your ACM TLS certificate for your domain.
- Invalidate on deploy (`/*`).

## SEO & Monetization
- SEO: Title, meta description/keywords, canonical, Open Graph/Twitter meta, JSON‑LD (WebApplication).
- Ads: Google AdSense integrated. Replace placeholders:
  - In head: `client=ca-pub-XXXXXXXXXXXXXXXX`
  - In banner slot: `data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"` and `data-ad-slot="0000000000"`
- Notes:
  - Serve on your approved domain; AdSense may show blank while under review.
  - Optional: add CMP (GDPR/CCPA) and collapse empty ad slots after a timeout.

## Accessibility
- Keyboard accessible controls with visible focus.
- ARIA labels for the clock and toolbar.
- Digital time has `aria-live` for updates when shown.
- High‑contrast theme option.
- Speech output for interactive read‑aloud.

## Roadmap (Future Work)
- Drag behavior refinements:
  - True independent hour drag (continuous angle).
  - Optional stronger snapping with visual feedback.
  - Dim non‑target numbers during drag; optional radial spotlight mask.
- World time exploration:
  - Map: click anywhere to show local time and preview clock.
  - 3D globe: spin/drag to pick a city/timezone (with labels and search).
- Education tools:
  - Guided lessons (o’clock, half‑past, quarter‑past/to), timed quizzes, scoring.
  - Teacher mode: preset exercise lists, shareable links.
  - Voice hints and sound effects (muted by default).
- Usability & UX:
  - Full IANA timezone search with fuzzy matching.
  - Save preferences to localStorage; share via URL params.
  - Big digital display / accessibility mode.
- PWA & Performance:
  - Add service worker for offline; install prompts; icons/manifest.
  - Lighthouse pass (SEO/PWA/perf) and bundle optimizations.
- Internationalization:
  - i18n for UI text and time read‑outs.
- Privacy & Analytics:
  - Consent Management Platform (GDPR/CCPA).
  - Privacy‑friendly analytics (e.g., Plausible/GA4 opt‑in).
- Testing & CI:
  - Visual regression tests (Playwright), unit tests for time math.
  - CI/CD pipeline to S3/CloudFront.

---
For changes or ideas, open issues or PRs. Enjoy teaching time with TimeLab!


