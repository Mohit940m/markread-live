# MarkRead Live 📖🎙️

A lightweight, zero-backend React Markdown live previewer and distraction-free reader designed for eye-comfort dark mode, mobile responsiveness, auto-hiding raw code on paste, native right-click browser access, and built-in Play/Pause Read Aloud.

---

## 🌟 Features & Highlights

- **Eye-Comfort Dark Mode (Default):** Soft low-glare dark slate palette (`#0F1117` canvas, `#161B22` surface, `#E2E8F0` text) designed to minimize eye fatigue during extended reading sessions, with clean Light Mode toggle.
- **Auto-Hide Raw Code on Paste:** Automatically collapses the Markdown editor pane upon pasting documents (`>= 40` characters or multi-line) or uploading files, centering the rendered `<article>` at an optimal reading measure (`max-w-3xl`, `65–75ch`).
- **Instant Code Toggle (`Ctrl+E`):** Seamless one-key / one-click toggle to reveal or hide the Markdown editor at any time.
- **Zero-Backend Native Read Aloud Engine:**
  - Built with the browser's native **Web Speech API** (`window.speechSynthesis`).
  - **Chrome 15-Second Stall Fix:** DOM and text extraction chunks content into clean sentence pieces (`<= 220` characters) to prevent Chrome from silently cutting off speech after 15 seconds.
  - **Android Chrome Pause Fix:** Solves Android Chrome's bug where `pause()` terminates utterances. Playback pauses via `cancel()` with saved index and resumes from the exact sentence.
  - **Active Block Highlighting:** Soft cyan accent highlight (`bg-sky-500/10 border-l-2 border-sky-400`) and smooth auto-scroll to center as playback advances.
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
| **Markdown Parsing** | `react-markdown` + `remark-gfm` |
| **Syntax Highlighting** | `rehype-highlight` |
| **Icons** | `lucide-react` |
| **Testing** | Vitest + Testing Library + JSDOM |
| **Hosting** | Vercel (Zero-Backend Static SPA) |

---

## 🚀 Local Development

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Start Dev Server
\`\`\`bash
npm run dev
\`\`\`
Visit `http://localhost:5173` in your browser.

### 3. Run Unit Tests
\`\`\`bash
npm run test
\`\`\`

### 4. Build for Production
\`\`\`bash
npm run build
\`\`\`

---

## 🌐 Deploy to Vercel

MarkRead Live is 100% client-side with zero backend or external API requirements:

1. Push your repository to GitHub.
2. In [Vercel](https://vercel.com/new), select your `markread-live` GitHub repository.
3. Vercel automatically detects the **Vite** preset:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Click **Deploy** — your live instance is ready on Vercel's global CDN!
