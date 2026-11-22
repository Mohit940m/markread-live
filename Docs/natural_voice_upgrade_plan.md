# MarkRead Live — Natural Neural Voice Upgrade Plan

An upgrade blueprint to replace robotic default browser TTS with **natural, downloadable neural voices** — inspired by the [Read Aloud Chrome Extension](https://chromewebstore.google.com/detail/read-aloud-a-text-to-spee/hdhinadidafjejdhmfkjgnolgimiaplp?hl=en) — while keeping your React + Vite app **100% frontend (zero backend)** on Vercel and ready to build with [Google Antigravity in VS Code](https://antigravity.google/docs/ide/extensions/vscode/).

## 1. Why the Current Voice Sounds Robotic (and How the Read Aloud Extension Does It)

When `window.speechSynthesis` runs without voice ranking, browsers often default to legacy OS synthesizers (such as Windows SAPI David/Zira or Linux eSpeak). The [Read Aloud extension (`Read-Aloud/read-aloud`)](https://github.com/Read-Aloud/read-aloud) sounds dramatically more natural because it combines multiple voice engines:

1. **Higher-Quality Browser/OS Voices:** Prioritizes Chrome's remote `Google US English` / `Google UK English` voices and Edge's `Microsoft ... Online (Natural)` voices over legacy OS defaults ([Web Speech Recommended Voices](https://github.com/HadrienGardeur/web-speech-recommended-voices)).
2. **Downloadable Local Neural Voices (Piper):** The same Read Aloud GitHub organization maintains [`piper-browser-extension`](https://github.com/Read-Aloud), which runs open-source Piper neural ONNX voice models locally in the browser.
3. **Cloud Neural Voices (Optional Paid / API Key):** Supports [Google Cloud Text-to-Speech](https://cloud.google.com/text-to-speech) (WaveNet/Neural2), Amazon Polly, and Microsoft Neural voices.

You can replicate this exact multi-engine experience **inside your pure-React Vercel app with zero backend**.

## 2. Recommended Zero-Backend Natural Voice Architecture

Use a clean **Strategy Pattern (`VoiceProvider` interface)** so your UI stays identical regardless of which voice engine the user picks:

| Tier | Engine / Library | Voice Quality | Download Size | Offline & Privacy | Audio Download (`.wav`) | Best For |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 1 (Instant Default)** | **Smart Web Speech API** (ranked filter) | Good (Chrome Google / Edge Natural voices) | `0 MB` | Online for Google/Edge remote voices | No | Instant zero-wait playback on first visit |
| **Tier 2 (Recommended Primary)** | **[`@mintplex-labs/piper-tts-web`](https://www.npmjs.com/package/@mintplex-labs/piper-tts-web)** (ONNX + WASM) | Very Natural (Neural VITS) | ~15–60 MB per voice (cached in OPFS) | 100% Local & Offline after download | Yes (`.wav`) | Best balance of speed, mobile compatibility, and downloadable voices |
| **Tier 3 (Studio Optional)** | **[`kokoro-js`](https://huggingface.co/posts/Xenova/503648859052804)** (Kokoro-82M, Apache 2.0) | Near-Human (24 kHz Neural) | ~80–300 MB one-time cache | 100% Local & Offline after download | Yes (`.wav` / `.mp3`) | Desktop users wanting top-tier audiobook quality ([Kokoro specs](https://github.com/kizuna-ai-lab/sokuji/issues/134)) |
| **Tier 4 (Optional BYOK)** | **[Google Cloud Text-to-Speech](https://cloud.google.com/text-to-speech)** REST API | Studio / Neural2 / WaveNet | `0 MB` (streams MP3) | Requires user's own API key in `localStorage` | Yes (`.mp3`) | Users who want Google's official cloud voices without a backend |

### Why Tier 2 (`@mintplex-labs/piper-tts-web`) Is the Sweet Spot

* **Built-In Download & Cache API:** Exposes `tts.download(voiceId, progressCallback)` and stores models in the browser's Origin Private File System (OPFS), so users get a real **Download Voice** button with a progress bar — and never re-download the same voice ([`@mintplex-labs/piper-tts-web` docs](https://www.npmjs.com/package/@mintplex-labs/piper-tts-web)).
* **Real HTML5 `<audio>` Playback:** Because Piper outputs standard WAV blobs (`URL.createObjectURL(wav)`), playback uses native `<audio>` instead of `speechSynthesis`. That gives **rock-solid Play, Pause, Resume, Seek, and Speed (`0.75x`–`2.0x`)** on desktop Chrome, Safari, Firefox, Android, and iOS — eliminating Chrome's 15-second stall and Android's broken `resume()`.
* **Zero UI Lag via Web Worker + Lookahead Prefetching:** Running Piper inference inside a Web Worker while prefetching chunk `N + 1` while chunk `N` plays delivers smooth, gapless narration ([Piper Browser TTS Architecture](https://dev.to/linmingren/building-a-browser-based-text-to-speech-system-with-piper-tts-ljh)).
* **One-Click Audio Export:** Users can download the narrated document as a `.wav` file directly from the browser.

## 3. Agile Upgrade Roadmap — Epics, User Stories & Story Points

**Point Scale:** Fibonacci (`1` = trivial, `2` = small, `3` = medium, `5` = complex).

### Epic Summary

| Epic ID | Epic Name | Stories | Total Points |
| :--- | :--- | :---: | :---: |
| **NV-1** | Unified Multi-Engine Voice Abstraction & Smart Browser Ranking | 3 | 6 |
| **NV-2** | Downloadable Local Neural Voices (Piper WASM + Web Worker) | 5 | 16 |
| **NV-3** | Voice Manager UI (Download, Progress, Cache & Preview) | 3 | 8 |
| **NV-4** | Gapless Prefetch Audio Player & `.wav` Export | 3 | 9 |
| **NV-5** | Optional Studio Engine (Kokoro-82M) & Google Cloud BYOK | 2 | 8 |
| **Total** | **5 Epics** | **16 Stories** | **47 Points** |

---

### NV-1: Unified Multi-Engine Voice Abstraction & Smart Browser Ranking (6 Points)

* **NV-1.1 — Define `VoiceProvider` Engine Interface (2 pts)**
  * *As a developer, I want a clean TypeScript interface (`init`, `speakChunk`, `pause`, `resume`, `stop`, `listVoices`) so the UI can switch seamlessly between Browser, Piper Neural, Kokoro, and Google BYOK engines.*
  * **Acceptance Criteria:** `src/tts/types.ts` defines unified `VoiceOption`, `VoiceEngineId`, and `TTSEngine` contracts; existing `ReadAloudBar` consumes the unified `useVoicePlayer` hook without engine-specific branching.
* **NV-1.2 — Smart Natural Voice Ranking for Browser Fallback (2 pts)**
  * *As a user on first visit (before downloading any neural voice), I want the app to automatically pick Chrome's `Google US English` / `Google UK English` or Edge's `Online (Natural)` voice instead of robotic OS voices.*
  * **Acceptance Criteria:** Ranks available `speechSynthesis.getVoices()` using a priority matcher (`Natural` / `Online` / `Google` / `Neural` / `Siri` / `Enhanced` first; legacy OS voices last); displays a quality badge (`Natural` vs `Standard`) in the picker.
* **NV-1.3 — Engine Preference Persistence & Graceful Fallback (2 pts)**
  * *As a user, I want my selected engine and voice saved in `localStorage`, with automatic fallback to Smart Browser Voices if a local neural model is not yet downloaded or WebAssembly fails.*
  * **Acceptance Criteria:** Persists `engineId`, `voiceId`, and `playbackRate`; displays a non-blocking banner if fallback occurs.

---

### NV-2: Downloadable Local Neural Voices — Piper WASM + Web Worker (16 Points)

* **NV-2.1 — Install & Configure `@mintplex-labs/piper-tts-web` with Vite (3 pts)**
  * *As a developer, I want Piper WASM and ONNX Runtime assets bundled or served cleanly on Vite + Vercel without CORS or MIME-type errors.*
  * **Acceptance Criteria:** Installs `@mintplex-labs/piper-tts-web`; configures `vite.config.ts` (`optimizeDeps.exclude` / worker ES format) so `npm run dev` and `npm run build` succeed cleanly on Vercel static hosting.
* **NV-2.2 — Dedicated TTS Web Worker (`piper.worker.ts`) (5 pts)**
  * *As a user, I want neural speech generation to run in a background Web Worker so scrolling, toggling dark mode, or pausing never freezes the page.*
  * **Acceptance Criteria:** Worker handles `DOWNLOAD_VOICE`, `SYNTHESIZE_CHUNK`, `LIST_STORED_VOICES`, and `DELETE_VOICE` messages; streams download progress percentages back to the main thread.
* **NV-2.3 — Curated Natural Voice Catalog (2 pts)**
  * *As a user, I want a curated shortlist of the most natural-sounding English (US/UK/Indian) and multi-language Piper voices instead of an overwhelming raw list of 100+ model IDs.*
  * **Acceptance Criteria:** Curates 6–10 high-quality medium/high Piper voices (e.g., `en_US-lessac-medium`, `en_US-hfc_female-medium`, `en_US-amy-medium`, `en_GB-alba-medium`) with accent tags, gender, and approximate download size.
* **NV-2.4 — OPFS Cache Management & Storage Cleanup (3 pts)**
  * *As a user on desktop or mobile, I want downloaded voices stored persistently offline with an option to delete unused voices to free browser storage.*
  * **Acceptance Criteria:** Checks `tts.stored()` on load to badge already-downloaded voices as **Ready Offline**; includes a **Delete** button per downloaded voice calling `tts.remove(voiceId)` and displays estimated cache usage.
* **NV-2.5 — Mobile Memory & Performance Guardrails (3 pts)**
  * *As a mobile user, I want Piper neural TTS to avoid crashing low-RAM mobile tabs.*
  * **Acceptance Criteria:** Limits synthesis to one active chunk in flight; revokes `URL.createObjectURL(wav)` immediately after each chunk finishes playing; warns users on low-memory devices before downloading large models.

---

### NV-3: Voice Manager UI — Download, Progress, Cache & Preview (8 Points)

* **NV-3.1 — Slide-Over / Modal Voice Picker Drawer (3 pts)**
  * *As a user, I want a clean dark-mode Voice Manager drawer (similar to the Read Aloud extension settings) grouped by **Neural (Offline)** and **Browser Instant** voices.*
  * **Acceptance Criteria:** Accessible directly from the floating `ReadAloudBar`; matches the eye-comfort dark palette (`#161B22` surface, `#38BDF8` accent); mobile-friendly full-height sheet on screens `< 768px`.
* **NV-3.2 — One-Click Voice Download with Live Progress Bar (3 pts)**
  * *As a user, I want to click **Download** next to any neural voice, see a real-time percentage progress bar, and switch to it immediately once ready.*
  * **Acceptance Criteria:** Shows `Download (~X MB)` -> animated progress bar (`0%–100%`) -> `Ready` / `Active` state; prevents duplicate concurrent downloads for the same voice ID.
* **NV-3.3 — 3-Second Voice Sample Preview Button (2 pts)**
  * *As a user, I want a small **Test Voice** button so I can hear how a voice sounds before reading a full document.*
  * **Acceptance Criteria:** Plays a short sample sentence using the selected voice without altering the user's current reading position in the Markdown document.

---

### NV-4: Gapless Prefetch Audio Player & `.wav` Export (9 Points)

* **NV-4.1 — Lookahead Chunk Prefetch Queue (5 pts)**
  * *As a listener, I want zero awkward silence between sentences when using local neural TTS.*
  * **Acceptance Criteria:** While chunk `i` plays via HTML5 `Audio`, the worker automatically synthesizes chunk `i + 1` in the background and caches its Blob URL; cancels queued prefetch jobs immediately on Stop or Seek.
* **NV-4.2 — Instant Pause, Resume, Speed & Click-to-Read-From-Here (2 pts)**
  * *As a reader, I want Pause/Resume to freeze mid-sentence cleanly on both desktop and mobile, and I want to click any paragraph to start reading from that spot.*
  * **Acceptance Criteria:** Uses `audio.pause()` / `audio.play()` and `audio.playbackRate` (`0.75x`–`2.0x`) for instant mid-sentence pause/resume; clicking a paragraph's subtle play icon jumps `currentChunkIndex` to that block.
* **NV-4.3 — Export Narrated Document as `.wav` Audio (2 pts)**
  * *As a user, I want a **Download Audio** button so I can save the narrated Markdown file and listen offline on my phone.*
  * **Acceptance Criteria:** Concatenates synthesized WAV chunks client-side into a single downloadable `.wav` Blob (matching the pattern in [Piper Browser TTS](https://dev.to/linmingren/building-a-browser-based-text-to-speech-system-with-piper-tts-ljh)) with a progress indicator and proper `URL.revokeObjectURL` cleanup.

---

### NV-5: Optional Studio Engine (`kokoro-js`) & Google Cloud BYOK (8 Points)

* **NV-5.1 — Optional Kokoro-82M Studio Neural Mode (5 pts)**
  * *As a desktop user with a fast GPU/CPU, I want an optional "Studio Neural (Kokoro-82M)" mode for ultra-natural audiobook-grade voices.*
  * **Acceptance Criteria:** Lazy-loads [`kokoro-js`](https://huggingface.co/posts/Xenova/503648859052804) only when enabled (zero impact on initial page load); runs in a separate worker using ONNX (`onnx-community/Kokoro-82M-v1.0-ONNX`), cached in browser storage after first download.
* **NV-5.2 — Optional Google Cloud TTS (BYOK — Zero Backend) (3 pts)**
  * *As a user who specifically wants Google WaveNet / Neural2 voices like the Read Aloud extension, I want to paste my own Google Cloud TTS API key locally in Settings.*
  * **Acceptance Criteria:** Calls the [Google Cloud Text-to-Speech](https://cloud.google.com/text-to-speech) `v1/text:synthesize` endpoint directly from the browser using the user's key stored only in `localStorage`; never transmits keys to any third-party server; includes a **Clear Key** button.

---

## 4. Folder Structure Additions (Drop-In Upgrade)

```text
src/
├── tts/
│   ├── types.ts                  # Unified TTSEngine & VoiceOption interfaces
│   ├── voiceCatalog.ts           # Curated Piper & Kokoro voice metadata
│   ├── browserEngine.ts          # Upgraded Web Speech API with Natural voice ranking
│   ├── piperEngine.ts            # Main-thread controller for Piper Web Worker + prefetch
│   ├── piper.worker.ts           # Background ONNX/WASM synthesis & OPFS download worker
│   ├── wavMerger.ts              # Client-side WAV chunk concatenation for audio export
│   └── googleByokEngine.ts       # Optional Google Cloud TTS (WaveNet/Neural2) BYOK
├── hooks/
│   └── useVoicePlayer.ts         # Replaces useReadAloud with unified multi-engine hook
└── components/
    ├── ReadAloudBar.tsx          # Updated with Voice Manager trigger & Download Audio
    └── VoiceManagerDrawer.tsx    # Dark-mode drawer with Download progress & Sample play
```

## 5. `AGENTS.md` Additions for Antigravity in VS Code

Append these rules to your existing `AGENTS.md` so Antigravity maintains zero-backend simplicity and fast load times while upgrading TTS:

```markdown
## Natural Voice Upgrade Rules
- Keep the initial JS bundle lightweight: lazy-load `@mintplex-labs/piper-tts-web` and `kokoro-js` ONLY inside Web Workers or on user interaction.
- Never block the main UI thread during TTS synthesis — always run ONNX/WASM inference inside a dedicated Web Worker.
- Always revoke `URL.createObjectURL(...)` audio blobs after playback or unmount to prevent mobile memory leaks.
- Keep Tier 1 (Smart Ranked Web Speech API) working out of the box with zero downloads, and make Tier 2 (Piper Local Neural Voices) a one-click download cached in OPFS.
- Preserve native right-click (`onContextMenu` untouched) at all times.
```

## 6. Step-by-Step Antigravity Prompts (VS Code)

Run these sequentially in [Google Antigravity in VS Code](https://antigravity.google/docs/ide/extensions/vscode/) after saving this file as `VOICE_UPGRADE_PLAN.md` in your repo root:

1. **Prompt 1 (NV-1 — Clean Abstraction + Instant Improvement):** *"Read `AGENTS.md` and `VOICE_UPGRADE_PLAN.md`. Implement Epic NV-1: refactor our Read Aloud hook into the unified `VoiceProvider` architecture and add Smart Natural Voice ranking so Chrome Google / Edge Natural voices are automatically chosen over robotic OS voices. Verify `npm run build`."*
2. **Prompt 2 (NV-2 — Local Downloadable Piper Neural Voices):** *"Implement Epic NV-2 from `VOICE_UPGRADE_PLAN.md` using `@mintplex-labs/piper-tts-web` inside a dedicated Vite Web Worker (`piper.worker.ts`) with OPFS caching and a curated list of natural English voices. Verify `npm run build` succeeds."*
3. **Prompt 3 (NV-3 & NV-4 — Voice Manager UI, Gapless Playback & Audio Export):** *"Implement Epics NV-3 and NV-4 from `VOICE_UPGRADE_PLAN.md`: build `VoiceManagerDrawer.tsx` with Download/Progress/Delete/Preview controls, add lookahead chunk prefetching with HTML5 `<audio>` for instant mid-sentence pause/resume, and add the client-side `.wav` Download Audio button."*
4. **Prompt 4 (NV-5 — Optional Studio & Google BYOK):** *"Optionally implement Epic NV-5 from `VOICE_UPGRADE_PLAN.md` (lazy-loaded `kokoro-js` Studio mode and optional Google Cloud TTS BYOK setting stored only in `localStorage`). Verify initial bundle size stays lean and `npm run build` passes."*
