# UI Bug Report & Enhancement Plan — MarkRead Live

**Date:** November 23, 2026  
**Status:** Resolved ✅  
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
- **Commit:** `4bf2d1e` (current step)

---

## 3. Test & Build Verification Summary

- **Total Test Suites:** 16 files passed
- **Total Unit Tests:** 69 passed (100%)
- **Production Build (`npm run build`):** Succeeded with 0 errors
- **Initial Bundle Size:** 78.4 kB gzipped (Budget: < 120 kB)

- **Total Test Suites:** 16 files passed
- **Total Unit Tests:** 67 passed (100%)
- **Production Build (`npm run build`):** Succeeded with 0 errors
- **Initial Bundle Size:** 77.44 kB gzipped (Budget: < 120 kB)
