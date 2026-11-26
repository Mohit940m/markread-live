# UI Bug Report & Enhancement Plan — MarkRead Live

**Date:** November 26, 2026  
**Status:** Issue 8 Open (TTS Nested Block Repetition) 🐛  
**Branch:** `dev`  
**Reference Screenshot:** User report (`media_1795372346986_53a5d6da.jpg`)

---

## 1. Executive Summary & Screenshot Analysis

Based on the screenshot submitted from local testing:
1. **Editor Visibility Mismatch:** The top bar button indicated `</> Show Code Ctrl+E` (meaning `showEditor` state was `false`), yet the raw Markdown editor pane on the left remained rendered and visible on screen.
2. **Missing Draggable Divider:** The divider between the Editor pane and the Preview pane was a static empty gap. Users could not drag to adjust the width of the editor vs. preview.
3. **Improper Viewport Space Scaling:** The layout did not fluidly adapt to the available screen space. The editor text was constrained and the height/width did not maximize the available viewport cleanly.

---

## 2. Issues Breakdown & Resolution Checklist

### [x] Issue 1: "Hide Code" button does not hide the code editor on desktop
- **Severity:** High (Core UI defect)
- **Observed Behavior:** Clicking "Hide Code" toggled the button text to "Show Code", but the editor pane remained visible on desktop viewports.
- **Root Cause:** In `src/App.tsx`, the editor pane wrapper combined two conflicting Tailwind utility strings:
  ```tsx
  className={`flex-1 transition-all duration-300 ${
    showEditor ? 'md:flex' : 'hidden'
  } ${mobileTab === 'editor' ? 'flex' : 'hidden md:flex'}`}
  ```
  When `showEditor === false` and `mobileTab === 'preview'`, the classes evaluated to:
  `flex-1 transition-all duration-300 hidden hidden md:flex`
  Because Tailwind applies breakpoint utilities like `md:flex` (`@media (min-width: 768px) { display: flex; }`), it overrode `hidden` (`display: none;`) at desktop screen widths.
- **Resolution:**
  Refactored responsive visibility logic in `src/App.tsx` so that when `showEditor === false`, the editor container is strictly assigned `hidden` (or `flex md:hidden` on mobile) without any `md:flex` class. Clicking "Hide Code" immediately collapses the editor pane and centers the preview pane.
- **Verification:** Unit tests in `src/App.test.tsx` assert that clicking "Hide Code" removes `md:flex` and applies `hidden`, hiding the editor pane cleanly.
- **Commit:** `67ba407`

---

### [x] Issue 2: Middle bar between Editor and Preview is not draggable
- **Severity:** High (Missing essential split-pane functionality)
- **Observed Behavior:** The middle boundary between Editor and Preview was a static gap with no drag handle, preventing users from resizing the panes.
- **Root Cause:** App previously used a static flex gap (`gap-6`) without a resizable divider component or mouse/touch drag listeners.
- **Resolution:**
  1. Created `src/components/SplitDivider.tsx` with:
     - Global mouse (`mousemove` / `mouseup`) and touch (`touchmove` / `touchend`) event listeners.
     - Clamped ratio boundaries between min 20% and max 80% to protect content readability.
     - Central hairline accent divider with a grip icon grabber pill (`GripVertical`).
     - Cursor styling (`cursor-col-resize`) and selection locking during drag.
     - Double-click shortcut to immediately reset panes to equal 50% split.
     - Keyboard accessibility: `role="separator"`, `tabIndex={0}`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and arrow key increments (+/- 2%).
  2. Persisted custom ratio in `localStorage` under `markread_split_ratio`.
- **Verification:** Dedicated unit test suite in `src/components/SplitDivider.test.tsx` verifying mouse drag, touch drag, boundary clamping, double-click reset, and keyboard controls.
- **Commit:** `a8ee69c`

---

### [x] Issue 3: Layout does not scale fluidly to available viewport space
- **Severity:** Medium (Ergonomics & responsive design)
- **Observed Behavior:** The workspace was constrained inside a fixed `max-w-[1600px]` with static margins and fixed min-heights (`min-h-[calc(100vh-170px)]`), resulting in awkward whitespace and poor utilization of ultra-wide or laptop displays.
- **Root Cause:** Outermost layout lacked a fluid full-height column layout (`h-[calc(100vh-56px)] flex-1 overflow-hidden`) with dynamic proportional percentage widths (`style={{ width: `${ratio}%` }}`).
- **Resolution:**
  1. Updated the main workspace container to fill 100% of available viewport width and height:
     `h-[calc(100vh-56px)] w-full flex flex-col p-2 md:p-3 pb-20 md:pb-24 overflow-hidden relative`
  2. Applied dynamic proportional widths:
     - Editor: `style={{ width: showEditor ? `${splitRatio}%` : undefined }}`
     - Preview: `style={{ width: showEditor ? `${100 - splitRatio}%` : undefined }}`
  3. When editor is hidden, preview centers cleanly at `max-w-3xl mx-auto w-full`.
  4. Both Editor and Preview panes have independent vertical scrollbars (`overflow-y-auto`) with no double page-level scrollbars.
- **Verification:** Integration tests in `src/App.test.tsx` assert dynamic style width percentages and proper divider mounting.
- **Commit:** `0062133`

### [x] Issue 4: Full-width reading mode option when editor is hidden
- **Severity:** Medium (Ergonomics & user layout preference)
- **Observed Behavior:** When the editor was hidden, the preview was locked into a fixed centered measure (`max-w-3xl mx-auto`), leaving wide empty margins on widescreen monitors with no option to use the full width of the screen.
- **Root Cause:** Hardcoded `max-w-3xl` constraint without a user-facing toggle between centered reading mode and edge-to-edge full-width layout.
- **Resolution:**
  1. Added `fullWidth` state persisted in `localStorage` under `markread_full_width`.
  2. Added a dedicated `Full Width / Centered Reading Mode` button in `TopBar` with `Maximize2` / `Minimize2` icons and touch-friendly `>= 44x44px` area.
  3. When `fullWidth === true`, preview expands to `w-full max-w-none` so wide tables, code snippets, and checklists use the full display.
  4. When `fullWidth === false`, retains the eye-comfort centered measure (`max-w-3xl mx-auto`).
  5. Added toast notification confirmations and keyboard accessibility.
- **Verification:** Unit tests in `src/components/TopBar.test.tsx` and integration tests in `src/App.test.tsx` assert class transitions between `max-w-none` and `max-w-3xl`.
- **Commit:** `b6052c9`

---

### [x] Issue 5: Markdown editor renders as a small box and does not fill available vertical space
- **Severity:** High (Editor ergonomics defect)
- **Observed Behavior:** When the editor was showing, it appeared as a small collapsed box with only 4–5 lines of visible text instead of expanding to fill 100% of the available vertical viewport height alongside the preview pane.
- **Root Cause:**
  1. In `src/App.tsx`, `editor-pane-container` had `hidden md:flex` without `md:flex-col`. In default horizontal flex row layout, children do not stretch vertically unless explicitly styled.
  2. In `src/components/MarkdownEditor.tsx`, the root container had `h-full` but lacked `flex-1 w-full min-h-0`, causing flex shrink collapse inside flexbox.
  3. The editor sub-toolbar lacked `shrink-0`, and the `<textarea>` needed explicit flexbox growth parameters (`flex-1 h-full min-h-0`) to claim the entire available vertical space.
- **Resolution:**
  1. Added `md:flex-col` to `editor-pane-container` in `App.tsx`.
  2. Added `w-full h-full flex-1 min-h-0 flex flex-col` to `MarkdownEditor.tsx`.
  3. Added `shrink-0` to the editor sub-toolbar and `flex-1 h-full min-h-0 w-full overflow-y-auto` to the `<textarea>`.
- **Verification:** Unit tests in `src/components/MarkdownEditor.test.tsx` and `src/App.test.tsx` assert `md:flex-col` on editor-pane-container and `w-full h-full flex-1 min-h-0` on editor container and textarea.
- **Commit:** `8047da5`

---

### [x] Issue 6: Non-English browser voice defaulting at start instead of English UK Male
- **Severity:** High (TTS default quality & localization defect)
- **Observed Behavior:** As shown in screenshot `media_1795459459006_886e425f.jpg`, the Voice Manager listed `Google português do Brasil [Natural]` at the very top of Instant Browser Voices, causing non-English speech to play by default at start.
- **Root Cause:** In `src/tts/browserEngine.ts`, `classifyVoiceQuality` gave all Google voices a flat score of 90 regardless of language. The array was then sorted alphabetically, causing `Google português do Brasil` to precede `Google UK English` and `Google US English`.
- **Resolution:**
  1. Updated `classifyVoiceQuality` with language & accent awareness:
     - Priority 1 (Score 1000): **English UK Male Natural** (`Google UK English Male` / `en-GB` male natural)
     - Priority 2 (Score 900): Other English UK Natural voices (`Google UK English Female`)
     - Priority 3 (Score 800): English US Natural voices (`Google US English`)
     - Priority 4 (Score 700): Other English Natural voices (`en-IN`, `en-AU`, etc.)
     - Priority 5 (Score 500): English Enhanced / Siri voices
     - Priority 6 (Score 300): English Standard voices
     - Priority 7 (Score 100): Non-English Natural/Google voices
     - Priority 8 (Score 20): Non-English Standard voices
  2. In `src/hooks/useVoicePlayer.ts`, explicitly prioritized English UK Male natural voice as the default active voice selection on start.
- **Verification:** Unit tests in `src/tts/browserEngine.test.ts` verify `Google UK English Male` ranks at position #1 ahead of `Google UK English Female`, `Google US English`, and non-English Google voices.
- **Commit:** `7b4116f`

---

### [x] Issue 7: Editor vertical height collapsed with large empty space below on desktop
- **Severity:** High (Layout & responsiveness defect)
- **Observed Behavior:** As shown in screenshot `media_1795459622882_051da0f2.jpg`, the Markdown editor container stopped after 3 lines of text, leaving an enormous empty black space below it while the preview pane correctly stretched to the bottom.
- **Root Cause:** In flex row layouts without an explicit pixel height on ancestors, percentage `height: 100%` on child flex items resolved to `height: auto` in Chromium. The editor container lacked `self-stretch`, and the inner textarea lacked explicit inline `height: 100%` / `minHeight: 100%`.
- **Resolution:**
  1. Applied `items-stretch` and `style={{ height: '100%' }}` on `workspaceContainerRef`.
  2. Applied `self-stretch`, `flex flex-col`, and `style={{ height: '100%' }}` on `editor-pane-container`.
  3. Applied `self-stretch`, `style={{ height: '100%' }}` on `markdown-editor-container`.
  4. Applied `style={{ height: '100%', minHeight: '100%' }}` on `<textarea>`.
  5. Ensured `html`, `body`, and `#root` have `h-full flex flex-col`.
  6. Verified clicking "Hide Code" strictly hides the editor pane via `hidden` (`display: none`).
- **Verification:** Unit tests in `src/components/MarkdownEditor.test.tsx` and `src/App.test.tsx` assert `height: 100%` styles and clean hide/show toggles.
- **Commit:** `7b4116f`

---

### [ ] Issue 8: Read Aloud repeats nested points and sub-parts when listening or clicking a section
- **Severity:** High (Core TTS playback & click-to-read defect)
- **Observed Behavior:** When listening to (or clicking on) a point/section that contains sub-parts (for example, a main bullet/numbered point with 2 nested sub-points, or a blockquote wrapping `<p>` tags), the TTS engine first reads the **entire parent point including all sub-parts**, and immediately afterwards reads **each sub-part again** one by one, repeating the content (sometimes 2x or 3x in loose Markdown lists).
- **Root Cause:**
  1. **Recursive `el.textContent` on Nested DOM Blocks (`src/utils/textChunker.ts#L91-L120`):**
     `extractSpeechChunksFromElement` queries all block elements with:
     `container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, blockquote')`
     and extracts `el.textContent` for **every** matched element in document order:
     - When a Markdown list item has nested sub-items (e.g. `<li>Point 1<ul><li>Sub 1</li><li>Sub 2</li></ul></li>`), `querySelectorAll` matches the outer `<li>` **and** both inner `<li>` elements.
     - Reading `el.textContent` on the outer `<li>` collects `"Point 1 Sub 1 Sub 2"` (parent + all children). Right after, the loop visits each inner `<li>` and reads `"Sub 1"` and `"Sub 2"` all over again.
     - Similarly, in loose Markdown lists or `<blockquote>` elements (`<blockquote><p>...</p></blockquote>`, `<li><p>...</p></li>`), both the outer container (`<li>`/`<blockquote>`) and inner `<p>` are matched and read separately, causing duplicate narration.
  2. **Double Trigger on Click-to-Read-From-Here (`src/App.tsx#L198-L199` & `src/hooks/useVoicePlayer.ts#L242-L304`):**
     In `handleArticleClick`, clicking a block calls both `seekTTS(targetChunkIdx)` and `playTTS(targetChunkIdx)` back-to-back. When audio is already playing (`statusRef.current === 'playing'`), both calls invoke `speakChunkAtIndex(targetChunkIdx)` twice in the same tick, which can cause double utterance queueing or overlapping async synthesis (especially in Piper neural mode).
- **Proposed Solution / How to Fix:**
  1. **Extract Own Block Text Only (`src/utils/textChunker.ts`):**
     - Replace raw `el.textContent` with a recursive child-node text collector that walks inline children (`<strong>`, `<em>`, `<a>`, inline `<code>`, `<span>`, etc.) while **stopping at nested container/block elements** (`ul, ol, li, p, blockquote, h1, h2, h3, h4, h5, h6, pre, button, svg, [aria-hidden="true"]`).
     - Before assigning `data-block-index`, clear any stale `[data-block-index]` attributes in the container so wrapper-only elements (like loose `<li>` or `<blockquote>` whose own text is empty) do not hold old indices.
  2. **Single Atomic Playback Call on Click (`src/App.tsx` & `src/hooks/useVoicePlayer.ts`):**
     - In `handleArticleClick` (`src/App.tsx`), remove the redundant `seekTTS(targetChunkIdx)` call and call `playTTS(targetChunkIdx)` directly (since `play(startIndex)` already sets `status` to `'playing'` and starts from `startIndex`).
     - In `useVoicePlayer.ts`, ensure `play()` stops any active audio cleanly (and/or uses a monotonic playback token) so back-to-back clicks cannot overlap async chunks.
  3. **Unit Tests (`src/utils/textChunker.test.ts` & `src/App.test.tsx`):**
     - Add tests verifying nested bullet/numbered lists (parent with 2 sub-parts), loose lists (`<li><p>...</p></li>`), and `react-markdown` `<blockquote><p>...</p></blockquote>` emit each text segment **exactly once** with zero repetition, and clicking a parent or sub-part jumps cleanly.
- **Status:** Open (Documented — awaiting fix implementation)

---

## 3. Test & Build Verification Summary

- **Total Test Suites:** 23 files passed
- **Total Unit Tests:** 98 passed (100%)
- **Production Build (`npm run build`):** Succeeded with 0 errors
- **Initial Bundle Size:** 86.72 kB gzipped (Budget: < 120 kB)
