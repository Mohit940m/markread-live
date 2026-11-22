# Copy of Docs/natural_voice_upgrade_plan.md at root per Section 6
# MarkRead Live — Natural Neural Voice Upgrade Plan

An upgrade blueprint to replace robotic default browser TTS with **natural, downloadable neural voices** — inspired by the [Read Aloud Chrome Extension](https://chromewebstore.google.com/detail/read-aloud-a-text-to-spee/hdhinadidafjejdhmfkjgnolgimiaplp?hl=en) — while keeping your React + Vite app **100% frontend (zero backend)** on Vercel and ready to build with [Google Antigravity in VS Code](https://antigravity.google/docs/ide/extensions/vscode/).

## 1. Why the Current Voice Sounds Robotic (and How the Read Aloud Extension Does It)

When `window.speechSynthesis` runs without voice ranking, browsers often default to legacy OS synthesizers (such as Windows SAPI David/Zira or Linux eSpeak). The [Read Aloud extension (`Read-Aloud/read-aloud`)](https://github.com/Read-Aloud/read-aloud) sounds dramatically more natural because it combines multiple voice engines:

1. **Higher-Quality Browser/OS Voices:** Prioritizes Chrome's remote `Google US English` / `Google UK English` voices and Edge's `Microsoft ... Online (Natural)` voices over legacy OS defaults.
2. **Downloadable Local Neural Voices (Piper):** The same Read Aloud GitHub organization maintains `piper-browser-extension`, which runs open-source Piper neural ONNX voice models locally in the browser.
3. **Cloud Neural Voices (Optional Paid / API Key):** Supports Google Cloud Text-to-Speech (WaveNet/Neural2), Amazon Polly, and Microsoft Neural voices.

## 2. Recommended Zero-Backend Natural Voice Architecture

| Tier | Engine / Library | Voice Quality | Download Size | Offline & Privacy | Audio Download (`.wav`) | Best For |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 1 (Instant Default)** | **Smart Web Speech API** (ranked filter) | Good (Chrome Google / Edge Natural voices) | `0 MB` | Online for Google/Edge remote voices | No | Instant zero-wait playback on first visit |
| **Tier 2 (Recommended Primary)** | **`@mintplex-labs/piper-tts-web`** (ONNX + WASM) | Very Natural (Neural VITS) | ~15–60 MB per voice (cached in OPFS) | 100% Local & Offline after download | Yes (`.wav`) | Best balance of speed, mobile compatibility, and downloadable voices |
| **Tier 3 (Studio Optional)** | **`kokoro-js`** (Kokoro-82M, Apache 2.0) | Near-Human (24 kHz Neural) | ~80–300 MB one-time cache | 100% Local & Offline after download | Yes (`.wav` / `.mp3`) | Desktop users wanting top-tier audiobook quality |
| **Tier 4 (Optional BYOK)** | **Google Cloud Text-to-Speech** REST API | Studio / Neural2 / WaveNet | `0 MB` (streams MP3) | Requires user's own API key in `localStorage` | Yes (`.mp3`) | Users who want Google's official cloud voices without a backend |
