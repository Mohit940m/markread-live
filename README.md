# MarkRead Live 📖🎙️

[![GitHub stars](https://img.shields.io/github/stars/Mohit940m/markread-live?style=social)](https://github.com/Mohit940m/markread-live)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with Antigravity](https://img.shields.io/badge/Built%20with-Google%20Antigravity-38BDF8)](https://antigravity.google/)

A lightweight, zero-backend React Markdown live previewer and distraction-free reader designed for eye-comfort dark mode, mobile responsiveness, auto-hiding raw code on paste, native right-click browser access, and built-in Play/Pause Read Aloud.

---

## 🌟 Features & Highlights

- **Eye-Comfort Dark Mode (Default):** Soft low-glare dark slate palette (`#0F1117` canvas, `#161B22` surface, `#E2E8F0` text) designed to minimize eye fatigue during extended reading sessions, with clean Light Mode toggle.
- **Auto-Hide Raw Code on Paste:** Automatically collapses the Markdown editor pane upon pasting documents (`>= 40` characters or multi-line) or uploading files, centering the rendered `<article>` at an optimal reading measure (`max-w-3xl`, `65–75ch`).
- **Instant Code Toggle (`Ctrl+E`):** Seamless one-key / one-click toggle to reveal or hide the Markdown editor at any time.
- **Draggable Fluid Split-Pane:** Drag to adjust editor vs. preview width with smooth mouse/touch feedback and double-click 50/50 reset.
- **Full-Width vs. Centered Reading Mode:** One-click toggle in the top bar to expand preview to full widescreen width.
- **Zero-Backend Native Read Aloud Engine:**
  - Built with the browser's native **Web Speech API** (`window.speechSynthesis`).
  - **Chrome 15-Second Stall Fix:** DOM and text extraction chunks content into clean sentence pieces (`<= 220` characters) to prevent Chrome from silently cutting off speech after 15 seconds.
  - **Android Chrome Pause Fix:** Solves Android Chrome's bug where `pause()` terminates utterances. Playback pauses via `cancel()` with saved index and resumes from the exact sentence.
  - **Active Block Highlighting:** Soft cyan accent highlight (`bg-sky-500/10 border-l-2 border-sky-400`) and smooth auto-scroll to center as playback advances.
  - **Smart Ranked Voices:** Automatically detects and prioritizes natural voices (English UK Male, Google, Edge Online Natural) ahead of robotic OS voices.
- **Downloadable Local Neural Voices (Piper WASM):**
  - Download high-fidelity neural voices running completely on-device in a background Web Worker via `@mintplex-labs/piper-tts-web`.
  - Stored persistently in browser OPFS with one-click download, storage indicators, and voice deletion.
  - 3-second sample test button to preview voices without losing document reading position.
- **Lookahead Prefetch & Audio Export:**
  - Seamless zero-silence playback between sentences using background lookahead prefetching.
  - Click any paragraph or heading in the preview to start reading from that exact block.
  - Export narrated document as a single continuous `.wav` audio file.
- **Preserved Native Browser Right-Click:** Zero `onContextMenu` interception. Full access to Chrome extensions (e.g. Read Aloud extension), Chrome Reading Mode, Google Translate, Dictionary, Copy, and DevTools Inspect.
- **GitHub Flavored Markdown (GFM):** Tables with responsive horizontal scroll, task checklists, strikethrough, autolinks, and blockquotes.
- **Code Syntax Highlighting:** Dark theme highlighted code blocks with language badge and one-click **Copy Code** button.
- **Ergonomic Mobile Layout (< 768px):** Segmented `Preview | Edit` top toggle, touch-friendly `>= 44x44px` hit areas, and `env(safe-area-inset-bottom)` safe-area padding.
- **Local Persistence & Export:** Persists draft content, dark/light theme, auto-hide toggle, font size scale, reading speed, and selected voice in `localStorage`. Includes client-side **Copy Markdown** and **Download .md** blob export.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| `Ctrl + E` / `Cmd + E` | Show / Hide Markdown Editor | Global |
| `Space` | Play / Pause Read Aloud | Global (when editor is not focused) |

---

## 🛠️ Tech Stack

| Layer | Choice |
| :--- | :--- |
| **Framework & Build** | React 19 + TypeScript + Vite |
| **Styling & Theme** | Tailwind CSS + `@tailwindcss/typography` |
| **TTS & Neural Voices** | Web Speech API + `@mintplex-labs/piper-tts-web` (WASM / ONNX Worker) |
| **Markdown Parsing** | `react-markdown` + `remark-gfm` |
| **Syntax Highlighting** | `rehype-highlight` |
| **Icons** | `lucide-react` |
| **Testing** | Vitest + Testing Library + JSDOM |
| **Hosting** | Vercel (Zero-Backend Static SPA) |

---

## 🚀 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Dev Server
```bash
npm run dev
```
Visit `http://localhost:5173` in your browser.

### 3. Run Unit Tests
```bash
npm run test
```

### 4. Build for Production
```bash
npm run build
```

---

## 🌐 Deploy to Vercel

MarkRead Live is 100% client-side with zero backend or external API requirements:

1. Push your repository to GitHub.
2. In [Vercel](https://vercel.com/new), import your `markread-live` GitHub repository: [https://github.com/Mohit940m/markread-live](https://github.com/Mohit940m/markread-live).
3. Vercel automatically detects the **Vite** preset:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Click **Deploy** — your live instance is ready on Vercel's global CDN!

---

## 👨‍💻 Credits & Author

- **Creator & Maintainer:** [Mohit940m](https://github.com/Mohit940m/)
- **Repository:** [https://github.com/Mohit940m/markread-live](https://github.com/Mohit940m/markread-live)
- **Built with:** [Google Antigravity](https://antigravity.google/) (Autonomous Agentic Software Engineering)

---

## 🌟 Support & Star

If you find MarkRead Live helpful, please consider starring ⭐ the repository on [GitHub](https://github.com/Mohit940m/markread-live) — it helps the project reach more readers!
