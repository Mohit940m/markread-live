# MarkRead Live — Research & Agile Implementation Plan

A lightweight, zero-backend React Markdown live previewer and reader designed for eye-comfort dark mode, mobile responsiveness, auto-hiding raw code on paste, native right-click browser access, and built-in Play/Pause Read Aloud — ready to build with [Google Antigravity in VS Code](https://antigravity.google/docs/ide/extensions/vscode/) and deploy statically on [Vercel](https://vercel.com/docs/frameworks/frontend/vite).

---

## 1. Repository Name Recommendations

| Option | Repo Name | Why It Fits |
| :--- | :--- | :--- |
| **Recommended** | `markread-live` | Short, memorable, and clearly signals Markdown live preview + Read Aloud reading. |
| Alternative 1 | `quietmd` | Highlights the distraction-free, auto-hide, eye-comfort dark reading experience. |
| Alternative 2 | `md-voice-preview` | Explicitly communicates Markdown preview with built-in voice playback. |
| Alternative 3 | `inkflow-md` | Clean product-style name suited for a public portfolio or Vercel showcase. |

---

## 2. Technical Research Findings

### 2.1 Can a Frontend Button Control the "Read Aloud" Chrome Extension?

**Short answer: No — not directly from a webpage.**

* **Browser Security Boundary (`externally_connectable`):** Under Chrome's [`externally_connectable` manifest policy](https://developer.chrome.com/docs/extensions/reference/manifest/externally-connectable), a webpage can only send messages to an extension if that extension explicitly whitelists the site's URL pattern in its `manifest.json`. If `"matches"` is empty or unspecified, no external webpage can connect to it.
* **Read Aloud Extension Behavior:** The open-source [Read Aloud extension (`Read-Aloud/read-aloud`)](https://github.com/Read-Aloud/read-aloud) does not expose a webpage messaging API for arbitrary sites. It is controlled via its browser toolbar icon, right-click context menu, or keyboard shortcuts (`Alt+P` / `Option+P` to Play/Pause, `Alt+O` / `Option+O` to Stop).

### 2.2 Recommended Solution: Native Frontend Read Aloud + Full Browser Compatibility

Instead of relying on an external extension that also breaks on mobile browsers, build a **zero-backend native Read Aloud engine** directly in React using the browser's built-in **Web Speech API** ([`SpeechSynthesis`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/resume) and [`SpeechSynthesis.paused`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/paused)), while keeping the DOM 100% compatible with Chrome extensions and native right-click menus:

1. **Always-Accessible Play / Pause / Stop Bar:** A sticky floating audio bar gives one-tap Play, Pause, Resume, Stop, Speed (`0.75x`–`2.0x`), and Voice selection directly inside your app on both desktop and mobile.
2. **Solving Chrome's 15-Second Cutoff Bug:** On desktop Chrome, long single utterances in `speechSynthesis.speak()` can silently stall after ~15 seconds ([Stack Overflow](https://stackoverflow.com/questions/42875726/speechsynthesis-speak-in-web-speech-api-always-stops-after-a-few-seconds-in-go)). **Solution:** Split the rendered preview text into sentence/paragraph chunks and queue them sequentially via `utterance.onend`.
3. **Solving Android Chrome's `pause()` / `resume()` Bug:** On Chrome for Android, calling `speechSynthesis.pause()` terminates the current utterance like `cancel()`, causing `resume()` to fail ([Stack Overflow](https://stackoverflow.com/questions/58953882/resuming-a-paused-speech-using-speechsynthesis-resume-on-chrome-android-doesn)). **Solution:** Track `currentChunkIndex` in React state. Implement **Pause** as `speechSynthesis.cancel()` while retaining `currentChunkIndex`, and **Resume** as starting playback from `currentChunkIndex`. This delivers reliable Play/Pause on Desktop Chrome, Safari, Firefox, Android, and iOS.
4. **Native Right-Click & Chrome Feature Preservation:** Never attach `e.preventDefault()` to `onContextMenu`. Render the preview inside a clean semantic `<article>` container (not a `<canvas>` or sandboxed `<iframe>`) so right-clicking any word or paragraph opens Chrome's native context menu (Read Aloud extension, Chrome Reading Mode, Translate, Copy, Search, Inspect).

### 2.3 Lightweight, Zero-Backend Tech Stack

| Layer | Choice | Rationale |
| :--- | :--- | :--- |
| **Build & Framework** | React 19 + TypeScript + Vite | Fast local dev, tiny static bundle, zero-config deployment via [Vercel Vite integration](https://vercel.com/i/react-typescript-vite). |
| **Markdown Renderer** | [`react-markdown`](https://strapi.io/blog/react-markdown-complete-guide-security-styling) + `remark-gfm` | Renders safely to React virtual DOM (no `dangerouslySetInnerHTML` XSS risk) with full GitHub Flavored Markdown (tables, checklists, strikethrough, autolinks). |
| **Syntax Highlighting** | `rehype-highlight` (subset of common languages) | Avoids bloating the bundle with 200+ unused language grammars ([React Markdown Guide](https://macmdviewer.com/blog/react-markdown-guide), [Medium](https://medium.com/@kalaivani7m/build-a-markdown-renderer-in-react-with-react-markdown-0a015d5075c8)). |
| **Styling & Dark Mode** | Tailwind CSS + `@tailwindcss/typography` | Minimal utility CSS with `prose prose-invert` for clean reading typography. |
| **Icons** | `lucide-react` | Tree-shakeable SVG icons (~1 KB per icon). |
| **State & Persistence** | React state + `localStorage` | Zero backend; persists theme, auto-hide toggle, reading speed, and last pasted draft locally. |
| **Hosting** | [Vercel](https://vercel.com/docs/frameworks/frontend/vite) | Automatic static CDN deploys on `git push` from GitHub. |

---

## 3. UI/UX & Eye-Comfort Design Spec

### 3.1 Eye-Comfort Dark Mode Palette (Default)

Pure black (`#000000`) with pure white (`#FFFFFF`) text causes halation and eye fatigue during long reading sessions. Use a soft low-glare dark slate palette:

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `--bg-canvas` | `#0F1117` | Main viewport background |
| `--bg-surface` | `#161B22` | Editor pane, top toolbar, floating TTS bar |
| `--bg-elevated` | `#1E2530` | Code blocks, table headers, hover surfaces |
| `--border-subtle` | `#2A3241` | Hairline dividers and pane borders |
| `--text-primary` | `#E2E8F0` | Primary reading prose (soft off-white) |
| `--text-muted` | `#94A3B8` | Metadata, word count, secondary icons |
| `--accent` | `#38BDF8` | Active buttons, links, active TTS highlight |

### 3.2 Auto-Hide Code Workflow & Mobile Responsiveness

* **Paste-to-Read Flow:** When the user pastes Markdown into the editor (or drops/uploads a `.md` file) and **Auto-Hide on Paste** is enabled (ON by default), the editor collapses automatically after a brief 150ms transition, centering the rendered `<article>` at an optimal reading measure (`max-w-3xl`, `65–75ch`).
* **Instant Code Toggle:** A persistent **"Show Code / Hide Code"** button in the header (plus `Ctrl/Cmd + E`) brings the editor back immediately for quick edits.
* **Mobile-First Layout:** Below `768px`, never squeeze two panes side-by-side. Default to full-width Preview with a segmented `Preview | Edit` toggle in the top bar, and pin the compact Read Aloud controls to the bottom with `env(safe-area-inset-bottom)` padding and `>= 44x44px` touch targets.

---

## 4. Agile Roadmap — Epics, User Stories & Story Points

**Point Scale:** Fibonacci (`1` = trivial, `2` = small, `3` = medium, `5` = complex).

### Epic Summary

| Epic ID | Epic Name | Stories | Total Points |
| :--- | :--- | :---: | :---: |
| **EP-1** | Project Foundation & Lightweight React/Vite Setup | 3 | 5 |
| **EP-2** | Markdown Engine, File Import & Right-Click Preservation | 4 | 11 |
| **EP-3** | Auto-Hide Editor & Eye-Comfort Dark Mode UI | 4 | 10 |
| **EP-4** | Native Frontend Read Aloud Engine (Play/Pause + Mobile Fix) | 5 | 15 |
| **EP-5** | Mobile Responsiveness & Reading Ergonomics | 3 | 7 |
| **EP-6** | Performance Optimization & Vercel Zero-Backend Deployment | 3 | 6 |
| **Total** | **6 Epics** | **22 Stories** | **54 Points** |

---

### EP-1: Project Foundation & Lightweight React/Vite Setup (5 Points)

* **US-1.1 — Scaffold React + TypeScript + Vite App (2 pts)**
  * *As a developer, I want a clean Vite + React + TypeScript scaffold with Tailwind CSS so I can build with fast HMR and a small bundle.*
  * **Acceptance Criteria:** `npm run dev` and `npm run build` succeed with zero TypeScript errors; Tailwind CSS and `@tailwindcss/typography` are configured; clean folder structure (`src/components`, `src/hooks`, `src/utils`, `src/styles`).
* **US-1.2 — Configure Antigravity Workspace Rules (1 pt)**
  * *As a developer using Antigravity in VS Code, I want an `AGENTS.md` file in the repo root so the AI agent consistently follows project constraints.*
  * **Acceptance Criteria:** `AGENTS.md` defines zero-backend architecture, bundle budget, dark-mode tokens, chunked TTS rule, and right-click preservation rule.
* **US-1.3 — LocalStorage Persistence Hook (2 pts)**
  * *As a user, I want my pasted Markdown, theme, auto-hide preference, and TTS speed to persist across page refreshes without needing an account or backend.*
  * **Acceptance Criteria:** Custom `useLocalStorage` hook safely reads/writes JSON with fallback handling for private browsing or quota errors.

---

### EP-2: Markdown Engine, File Import & Right-Click Preservation (11 Points)

* **US-2.1 — Live Markdown Rendering with GFM Support (3 pts)**
  * *As a user, I want to paste any GitHub Flavored Markdown and see headings, tables, task lists, blockquotes, links, and inline code rendered cleanly.*
  * **Acceptance Criteria:** Uses `react-markdown` + `remark-gfm`; links open safely (`target="_blank" rel="noopener noreferrer"`); tables scroll horizontally on narrow screens without breaking layout.
* **US-2.2 — Tree-Shaken Code Syntax Highlighting (3 pts)**
  * *As a user, I want fenced code blocks highlighted nicely without slowing down page load.*
  * **Acceptance Criteria:** Uses `rehype-highlight` (or `lowlight` common language subset) with a dark eye-comfort highlight theme and a one-click **Copy Code** button on every code block.
* **US-2.3 — Paste, Drag-and-Drop, and `.md` File Upload (3 pts)**
  * *As a user, I want to paste raw Markdown, drag-and-drop a `.md` file, or pick a file from my device (desktop or mobile) to preview it immediately.*
  * **Acceptance Criteria:** Supports `<textarea>` paste, window-wide drag-and-drop overlay for `.md`/`.txt` files, and a hidden `<input type="file" accept=".md,.markdown,.txt">` triggered from the toolbar; includes a **Clear** and **Load Sample** button.
* **US-2.4 — Native Browser Right-Click & Selection Fidelity (2 pts)**
  * *As a user, I want right-clicking anywhere in the preview to show Chrome's native context menu (including Read Aloud extension, Translate, Copy, Inspect).*
  * **Acceptance Criteria:** Zero `onContextMenu` overrides anywhere in the app; preview renders as selectable semantic HTML inside `<article>`; verified that highlighting text and right-clicking invokes Chrome's native menu and extensions.

---

### EP-3: Auto-Hide Editor & Eye-Comfort Dark Mode UI (10 Points)

* **US-3.1 — Auto-Hide Raw Code Pane on Paste / File Load (3 pts)**
  * *As a user, I want the raw Markdown editor to automatically hide right after I paste a document or upload a `.md` file so I can read immediately without clutter.*
  * **Acceptance Criteria:** Detecting a paste (`>= 40` characters or multi-line) or file drop collapses the editor pane when `autoHideOnPaste` is `true`; does not trigger annoyingly on single-word typing; displays a subtle toast/pill ("Code hidden — click Show Code to edit").
* **US-3.2 — Manual Show/Hide Code Control & Auto-Hide Toggle (2 pts)**
  * *As a user, I want a clear button and shortcut to toggle the code editor whenever I want to edit, plus a switch to turn auto-hide on or off.*
  * **Acceptance Criteria:** Top toolbar has a prominent `Show Code` / `Hide Code` button (`Ctrl/Cmd + E` shortcut) and an `Auto-hide` toggle saved in `localStorage`.
* **US-3.3 — Eye-Comfort Dark Mode Default + Light Mode Toggle (3 pts)**
  * *As a user, I want a soft dark mode by default so reading long Markdown files is comfortable on my eyes, with an option to switch to Light mode.*
  * **Acceptance Criteria:** Defaults to the soft slate dark palette (`#0F1117` / `#161B22` / `#E2E8F0`) meeting WCAG AA (`>= 4.5:1`) contrast; includes a Light/Dark toggle in the header; no white flash on reload (theme class applied in `index.html` before React mounts).
* **US-3.4 — Minimal Distraction-Free Header & Reading Stats (2 pts)**
  * *As a user, I want a clean top bar showing word count and estimated reading time without cluttering the screen.*
  * **Acceptance Criteria:** Displays live word count and estimated read time (`words / 200` min); header stays compact (`<= 56px` height) and unobtrusive.

---

### EP-4: Native Frontend Read Aloud Engine (15 Points)

* **US-4.1 — Markdown-to-Clean-Speech Text Chunker (3 pts)**
  * *As a user, I want Read Aloud to read my rendered text naturally without speaking raw Markdown symbols like `###`, `**`, or URLs.*
  * **Acceptance Criteria:** Extracts readable text blocks directly from the rendered `<article>` DOM (skipping decorative icons and optionally skipping code blocks via a toggle), splitting long paragraphs into clean sentence chunks (`<= 220` chars) so Chrome never hits its 15-second synthesis stall.
* **US-4.2 — Cross-Platform Play / Pause / Resume / Stop Hook (5 pts)**
  * *As a user, I want a reliable Play/Pause button on my frontend site that pauses and resumes cleanly on both desktop Chrome and mobile Android/iOS.*
  * **Acceptance Criteria:** Custom `useReadAloud` hook wraps `window.speechSynthesis`; tracks `status` (`idle | playing | paused`) and `currentChunkIndex`; implements Pause via `speechSynthesis.cancel()` + saved index and Resume from `currentChunkIndex` (bypassing Android Chrome's broken `resume()`); cleans up speech on unmount or new document paste.
* **US-4.3 — Floating Sticky Read Aloud Control Bar (3 pts)**
  * *As a user, I want an always-accessible floating control bar so I can play, pause, skip forward/backward, or stop reading with one click.*
  * **Acceptance Criteria:** Sticky bottom pill/bar with Play/Pause, Previous/Next sentence, Stop, and progress indicator (`Chunk X / Y`); keyboard shortcut `Space` (when not typing in editor) toggles Play/Pause.
* **US-4.4 — Voice Selector & Speed Control (2 pts)**
  * *As a user, I want to adjust reading speed and choose from my browser's available voices (including natural Google/OS voices).*
  * **Acceptance Criteria:** Handles async `voiceschanged` event in Chrome; provides speed presets (`0.75x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`) and a compact voice dropdown persisted in `localStorage`.
* **US-4.5 — Active Block Highlighting & Auto-Scroll (2 pts)**
  * *As a user, I want the currently spoken paragraph/section highlighted and gently scrolled into view so I can follow along visually.*
  * **Acceptance Criteria:** Highlights the active block with a soft eye-comfort tint (`bg-sky-500/10 border-l-2 border-sky-400`) and calls `scrollIntoView({ behavior: 'smooth', block: 'center' })` when reading advances.

---

### EP-5: Mobile Responsiveness & Reading Ergonomics (7 Points)

* **US-5.1 — Responsive Single-Pane Mobile Layout (3 pts)**
  * *As a mobile user, I want a clean full-screen preview with easy switching to the editor so I never deal with cramped split panes.*
  * **Acceptance Criteria:** Mobile (`< 768px`) renders either Preview or Editor full-width with a top segmented toggle; desktop (`>= 768px`) supports split-pane when Editor is shown and centered reading column (`max-w-3xl`) when Editor is hidden.
* **US-5.2 — Touch-Friendly Controls & Safe-Area Support (2 pts)**
  * *As a mobile user, I want all buttons and the floating Read Aloud bar to be easy to tap without colliding with my phone's bottom gesture bar.*
  * **Acceptance Criteria:** All interactive controls meet `>= 44x44px` tap area; bottom Read Aloud bar uses `pb-[env(safe-area-inset-bottom)]`; zero horizontal overflow across `360px`–`1440px` viewports.
* **US-5.3 — Quick Font-Size Adjustment (`A- / A+`) (2 pts)**
  * *As a reader on mobile or desktop, I want to adjust preview text size for maximum eye comfort.*
  * **Acceptance Criteria:** Three preset prose scales (`sm`, `base`, `lg`) persisted in `localStorage`.

---

### EP-6: Performance Optimization & Vercel Deployment (6 Points)

* **US-6.1 — Bundle Optimization & Lazy Loading (3 pts)**
  * *As a user, I want the site to load almost instantaneously even on mobile networks.*
  * **Acceptance Criteria:** Syntax highlighter and non-critical modals are code-split via `React.lazy` / dynamic import; Vite production build produces a lean initial JS bundle (`< 120 KB` gzipped target); Lighthouse Performance & Accessibility scores `>= 95`.
* **US-6.2 — Export / Copy Utilities (1 pt)**
  * *As a user, I want to quickly copy rendered HTML or download my edited `.md` file.*
  * **Acceptance Criteria:** Toolbar includes **Copy Markdown** and **Download `.md`** actions (100% client-side using Blob download).
* **US-6.3 — Zero-Backend Vercel Deployment & GitHub CI (2 pts)**
  * *As a developer, I want every push to `main` to auto-deploy cleanly to Vercel.*
  * **Acceptance Criteria:** GitHub repo connected to [Vercel](https://vercel.com/docs/git/vercel-for-github); Vite preset auto-detected (`npm run build` -> `dist/`); custom `README.md` with live demo link and shortcut cheatsheet.

---

## 5. Recommended Folder Structure

```text
markread-live/
├── AGENTS.md                 # Antigravity workspace rules & constraints
├── PLAN.md                   # This epic & user story roadmap
├── index.html                # Pre-mount dark theme script (prevents flash)
├── package.json
├── vite.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── styles/
    │   └── index.css         # Eye-comfort CSS variables & prose overrides
    ├── hooks/
    │   ├── useLocalStorage.ts
    │   └── useReadAloud.ts   # Chunked Web Speech API + mobile pause fix
    ├── utils/
    │   └── textChunker.ts    # DOM/text extraction into speakable sentences
    └── components/
        ├── TopBar.tsx        # Show/Hide Code, Auto-Hide, Theme, Upload
        ├── MarkdownEditor.tsx
        ├── MarkdownPreview.tsx
        └── ReadAloudBar.tsx  # Floating Play/Pause/Stop/Speed/Voice bar
```

---

## 6. How to Build This with Google Antigravity in VS Code

Per the [Google Antigravity VS Code Extension Docs](https://antigravity.google/docs/ide/extensions/vscode/) and [Antigravity Rules Docs](https://antigravity.google/docs/rules/):

### Step 1: Initialize Repo & Add `AGENTS.md`

Create the repo (`markread-live`), save this file as `PLAN.md`, and add an `AGENTS.md` file in the root with these exact guardrails:

```markdown
# AGENTS.md — MarkRead Live Rules
- Pure frontend React + TypeScript + Vite SPA. NO backend, NO external API keys.
- Deploy target: Vercel static hosting (`npm run build` -> `dist`).
- NEVER override or preventDefault on `onContextMenu` (preserve native Chrome right-click & extensions).
- Default theme MUST be eye-comfort dark mode (`#0F1117` bg, `#161B22` surface, `#E2E8F0` text).
- Implement Read Aloud via browser `window.speechSynthesis` with sentence chunking (`<= 220` chars) and index-based Pause/Resume (`cancel()` on pause, restart from `currentChunkIndex` on resume) so Android Chrome and Desktop Chrome never stall.
- Keep bundle lightweight: use `react-markdown`, `remark-gfm`, and a small subset of `rehype-highlight` languages.
- Verify `npm run build` passes after completing each Epic.
```

### Step 2: Execute Epic-by-Epic in Antigravity

Feed Antigravity one Epic at a time so changes stay clean, testable, and easy to review:

1. **Kickoff Prompt (EP-1):** *"Read `AGENTS.md` and `PLAN.md`. Implement Epic EP-1 (US-1.1 through US-1.3) and verify `npm run build`."*
2. **Core Preview Prompt (EP-2 & EP-3):** *"Implement EP-2 and EP-3 from `PLAN.md`, including auto-hide on paste (`>= 40` chars), Show/Hide Code toggle, and eye-comfort dark mode. Ensure native right-click is untouched."*
3. **Read Aloud Prompt (EP-4):** *"Implement EP-4 from `PLAN.md`. Build `useReadAloud.ts` with sentence chunking and index-based pause/resume so Chrome Desktop and Android pause cleanly without stalling."*
4. **Polish & Ship Prompt (EP-5 & EP-6):** *"Implement EP-5 and EP-6 from `PLAN.md`. Verify mobile layout at 375px width, check Vite bundle size, and prepare for Vercel deployment."*
