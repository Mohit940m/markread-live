# AGENTS.md — MarkRead Live Workspace Rules & Constraints

## Core Architecture Constraints
- **Zero-Backend Architecture:** Pure frontend React + TypeScript + Vite SPA. NO backend, NO external servers, NO third-party API keys required.
- **Deploy Target:** Vercel static CDN hosting (`npm run build` -> `dist/`). Zero-config Vite preset.
- **Native Context Menu Rule:** NEVER override or `preventDefault` on `onContextMenu` anywhere in the app. Preserve Chrome's native right-click context menu (Read Aloud extension, Chrome Reading Mode, Translate, Copy, Search, Inspect).
- **DOM Fidelity:** Preview renders as selectable semantic HTML inside an `<article>` container (never `<canvas>` or sandboxed `<iframe>`).

## UI / UX & Eye-Comfort Design Tokens
- **Default Theme:** Eye-comfort dark mode MUST be the default theme on first load.
  - `--bg-canvas`: `#0F1117` (Deep viewport background, soft low-glare)
  - `--bg-surface`: `#161B22` (Panes, header toolbar, floating TTS bar)
  - `--bg-elevated`: `#1E2530` (Code blocks, table headers, hover surfaces)
  - `--border-subtle`: `#2A3241` (Hairline dividers, borders)
  - `--text-primary`: `#E2E8F0` (Prose reading text, soft off-white)
  - `--text-muted`: `#94A3B8` (Metadata, counts, secondary icons)
  - `--accent`: `#38BDF8` (Sky blue for active highlights and buttons)
- **FOUC Prevention:** Include inline script in `index.html` to read theme from `localStorage` and set `dark` class before React mounts.

## Read Aloud (TTS) Engine Rules
- **Web Speech API:** Implement native zero-backend TTS using `window.speechSynthesis`.
- **Chrome 15-Second Stall Fix:** DOM and text extraction MUST chunk content into clean sentence pieces (`<= 220` characters) and play sequentially.
- **Android Chrome Pause Fix:** Chrome on Android terminates utterances on `pause()`. Track `currentChunkIndex` in state; implement Pause via `speechSynthesis.cancel()` retaining `currentChunkIndex`, and Resume by restarting playback from `currentChunkIndex`.
- **Active Block Highlighting:** Highlight the currently read section (`bg-sky-500/10 border-l-2 border-sky-400`) and smooth scroll into view.

## Performance & Bundle Budgets
- Use tree-shakeable packages: `react-markdown`, `remark-gfm`, subset of `rehype-highlight` languages, `lucide-react`.
- Initial JS bundle target: `< 120 KB` gzipped. Code-split heavy syntax highlighting or non-critical components.
