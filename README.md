# Awqat

Awqat is a fully client-side React design studio for turning live prayer and fasting times into beautiful, shareable, printable timetables. Pick a location, choose a format, customize the look, and export — no server, no signup, no watermark.

**Powered by the [Miqaat API](https://miqaat-dev.vercel.app)** — Awqat never computes prayer times itself. Every calculation (prayer times, Hijri dates, fasting windows, qibla direction) comes straight from Miqaat, and every export carries a "Method: … · …" caption so the source and calculation method are always visible.

## Live demo

<!-- deployed URL TBD -->

## Features

- **Three output formats** — a single daily card, a full monthly table, or a printable full-year poster (all 12 months).
- **Two template lanes** — a Personal lane (greeting + dua) and an Organization lane (logo, name, and branding).
- **Trilingual** — English, বাংলা (Bengali), and العربية (Arabic), each with native numerals and full right-to-left layout support.
- **Deep customization** — themes, accent colors, gradient or photo backgrounds, Islamic SVG motifs, per-row visibility toggles, and month/day/year selection.
- **Ramadan-aware** — automatic Ramadan-mode highlighting and Hijri-derived special-day markers on the monthly and yearly views.
- **Qibla compass and live countdown** to the next prayer.
- **Export anywhere** — PNG (Story, Square, or Post aspect ratios), PDF (A4 or A3), and a one-click ZIP of all 12 monthly cards.

## Tech stack

- [Vite](https://vite.dev) + [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn](https://ui.shadcn.com)
- [html-to-image](https://github.com/bubkoo/html-to-image) for pixel-accurate PNG capture
- [jsPDF](https://github.com/parallax/jsPDF) for PDF generation
- [JSZip](https://stuk.github.io/jszip/) + [file-saver](https://github.com/eligrey/FileSaver.js) for the bulk ZIP export
- [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) for the test suite

## What it looks like

Awqat opens on a single studio screen: a location search on the left drives live data fetches from Miqaat, a format switcher (Daily / Monthly / Year) sits above a live preview panel, and a customize sidebar exposes template, language, theme, background, and personalization controls. The preview updates instantly as options change, and an export bar lets you download the current view as PNG, PDF, or (for the yearly view) a ZIP of every month.

## Local development

```bash
npm install
npm run dev       # start the dev server
npm test          # run the test suite
npm run build     # type-check and produce a production build
```

## Credits

- Prayer times, fasting windows, Hijri dates, and qibla direction — [Miqaat API](https://miqaat-dev.vercel.app), which wraps [`adhan`](https://github.com/batoulapps/adhan-js) and [`hijri-converter`](https://github.com/dralshehri/hijri-converter) for the underlying astronomical and calendrical calculations.
- Location geocoding — [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api).
- Fonts — [Geist](https://vercel.com/font), [Noto Sans Bengali](https://fonts.google.com/noto/specimen/Noto+Sans+Bengali), and [Amiri](https://fonts.google.com/specimen/Amiri).
