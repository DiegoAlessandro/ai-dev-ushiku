# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static landing page for "AI活用相談 牛久" — a freelance AI development service targeting local businesses in Ushiku/Tsukuba, Ibaraki, Japan. Domain: `ai-dev-ushiku.jp`

## Architecture

This is a **single-file static site** with minimal JavaScript (hamburger menu + smooth scroll only).

- `public/index.html` — Entire site (HTML + inline CSS + minimal JS). Japanese-language LP with light trust-oriented theme.
- `public/sitemap.xml` — SEO sitemap
- `public/robots.txt` — Crawler config
- `public/.gitignore` — Ignores `.vercel`

## Development

No build or test commands. Edit `public/index.html` directly. Open in browser to preview.

## Deployment

Static hosting (previously Vercel, based on `.gitignore`). All deployable content lives in `public/`.

## Design Conventions

- CSS custom properties defined in `:root`:
  - `--primary: #2563A0` (落ち着いた青 — 信頼感)
  - `--primary-light: #3B82C4` (ホバー用)
  - `--primary-pale: #EBF4FA` (背景アクセント)
  - `--accent: #E8793A` (CTA用オレンジ — 行動促進)
  - `--accent-light: #FFF3EB`
  - `--bg: #FAFAF8` (オフホワイト), `--bg-white: #FFFFFF`, `--bg-section: #F3F4F1`
  - `--text: #1F2937`, `--text-sub: #6B7280`
  - `--success: #16A34A`, `--border: #E5E7EB`
- Light theme with white card base + soft shadows (no glassmorphism)
- Alternating section backgrounds for visual rhythm (`bg-white` / `bg-alt`)
- `prefers-reduced-motion` media query for accessibility
- Fonts: Noto Sans JP (400, 500, 700), Font Awesome 6 icons
- Responsive breakpoints: 480px / 768px / 1024px
- Semantic HTML: `<nav aria-label>`, `<section aria-labelledby>`, proper heading hierarchy (h1 > h2 > h3)
- FAQ uses native `<details>/<summary>` (no JS)
- All content in Japanese

## Section Order

Hero > Worries (pain points) > Profile > Services > Pricing (comparison) > Process > Portfolio > FAQ > CTA

## SEO

- JSON-LD structured data (`ProfessionalService`)
- OGP / Twitter Card meta tags (og:image placeholder for future)
- Canonical URL
- Title: 60 chars max, Description: 120-160 chars

## Commit Message Style

Format: `Category: Description` (e.g., `Design: UX update for Ushiku local businesses`, `SEO: 牛久市・中小企業向け关键词追加`). Mix of English and Japanese descriptions.
