export const DEFAULT_SAMPLE_MARKDOWN = `# Welcome to MarkRead Live 📖🎙️

MarkRead Live is a lightweight, zero-backend Markdown previewer and distraction-free reader designed for eye comfort.

---

## 🚀 Key Highlights

- **Eye-Comfort Dark Mode**: Soft dark palette (\`#0F1117\`) designed to minimize eye fatigue during extended reading sessions.
- **Zero-Backend Architecture**: 100% client-side React + TypeScript SPA. No servers, no tracking, no API keys needed.
- **Native Context Menu Fidelity**: Right-click anywhere to use Chrome's native Read Aloud extension, translation, or dictionary.
- **Built-in SpeechSynthesis**: Chunked sentence reading engine that avoids Chrome's 15-second stall and Android's pause cutoff.
- **Natural Voice Upgrades**: Downloadable Piper neural offline voices cached in OPFS and smart browser voice ranking.

---

## 📊 Feature Comparison Matrix

| Feature | MarkRead Live | Standard Web Viewers |
| :--- | :--- | :--- |
| **Dark Palette** | Soft slate (\`#0F1117\`) | Harsh pure black (\`#000000\`) |
| **Context Menu** | 100% Native Chrome support | Often hijacked / blocked |
| **Voice Playback** | Native chunked sentence TTS + Piper WASM | Requires heavy external APIs |
| **Auto-Hide Code** | Collapses editor on paste | Manual pane dragging |

---

## 💻 Code Example

Here is a TypeScript snippet showing how sentence chunking works:

\`\`\`typescript
export function chunkSentence(text: string, maxLen = 220): string[] {
  // Regex preserves sentence boundaries cleanly
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  return sentences.map((s) => s.trim()).filter(Boolean);
}
\`\`\`

---

## 🌟 Support & Credits

Enjoying **MarkRead Live**?

- ⭐ **Star this repo on GitHub:** [Mohit940m/markread-live](https://github.com/Mohit940m/markread-live)
- 👨‍💻 **Author:** Created by [Mohit940m](https://github.com/Mohit940m/)
- 🤖 **Built with:** [Google Antigravity](https://antigravity.google/) (Autonomous Agentic Engineering)

---

## ✅ Reading Checklist

- [x] Paste or upload your favorite Markdown document
- [x] Toggle between Edit and Preview modes
- [x] Hit Play on the floating bar to listen hands-free
- [x] Explore the **Voice Manager** drawer for local neural offline voices
- [ ] Star the repository on [GitHub](https://github.com/Mohit940m/markread-live)!

> *"Reading should feel effortless, comfortable on the eyes, and accessible on any device."*
`;
