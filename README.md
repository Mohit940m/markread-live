# MarkRead Live 📖🎙️

> A lightweight, zero-backend React Markdown live previewer and distraction-free reader designed for eye-comfort dark mode, mobile responsiveness, auto-hiding raw code on paste, native right-click browser access, and built-in Play/Pause Read Aloud.

## Features
- **Eye-Comfort Dark Palette:** Tailored soft dark slate theme (`#0F1117` canvas, `#161B22` surface) with WCAG AA compliance and light mode support.
- **Auto-Hide on Paste:** Raw Markdown editor seamlessly hides upon pasting long documents or loading files.
- **Native Read Aloud (TTS):** Browser-native SpeechSynthesis with sentence chunking (solves Chrome 15s stall) and indexed pause/resume (solves Android Chrome pause termination).
- **Native Context Menu Fidelity:** 100% untouched right-click menu for Chrome extensions, reading mode, and translation.
- **Responsive & Touch-Friendly:** Segmented mobile layout (< 768px), >= 44x44px touch targets, safe-area inset support.
- **Offline & Zero-Backend:** 100% client-side Vite SPA, persists state in `localStorage`, deployable to Vercel in seconds.

## Roadmap & Architecture
See [PLAN.md](PLAN.md) and [AGENTS.md](AGENTS.md) for full architecture details and the 6-epic agile delivery plan.
