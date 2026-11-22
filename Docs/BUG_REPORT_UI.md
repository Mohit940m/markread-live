# UI Bug Report & Enhancement Plan — MarkRead Live

**Date:** November 23, 2026  
**Status:** In Progress 🟡  
**Branch:** `dev`  
**Reference Screenshot:** User report (`media_1795372346986_53a5d6da.jpg`)

---

## 1. Executive Summary & Screenshot Analysis

Based on the screenshot submitted from local testing:
1. **Editor Visibility Mismatch:** The top bar button indicates `</> Show Code Ctrl+E` (meaning `showEditor` state is `false`), yet the raw Markdown editor pane on the left remains rendered and visible on screen.
2. **Missing Draggable Divider:** The divider between the Editor pane and the Preview pane is a static empty gap. Users cannot drag to adjust the width of the editor vs. preview.
3. **Improper Viewport Space Scaling:** The layout does not fluidly adapt to the available screen space. The editor text is constrained and the height/width does not maximize the available viewport cleanly.

---

## 2. Issues Breakdown & Resolution Checklist

### [ ] Issue 1: "Hide Code" button does not hide the code editor on desktop
- **Severity:** High (Core UI defect)
- **Observed Behavior:** Clicking "Hide Code" toggles the button text to "Show Code", but the editor pane remains visible on desktop viewports.
- **Root Cause:** In `src/App.tsx`, the editor pane wrapper combined two conflicting Tailwind utility strings:
  ```tsx
  className={`flex-1 transition-all duration-300 ${
    showEditor ? 'md:flex' : 'hidden'
  } ${mobileTab === 'editor' ? 'flex' : 'hidden md:flex'}`}
  ```
  When `showEditor === false` and `mobileTab === 'preview'`, the classes evaluated to:
  `flex-1 transition-all duration-300 hidden hidden md:flex`
  Because Tailwind applies breakpoint utilities like `md:flex` (`@media (min-width: 768px) { display: flex; }`), it overrides `hidden` (`display: none;`) at desktop screen widths.
- **Target Solution:**
  Refactor layout display logic so that on desktop, `showEditor === false` strictly renders `hidden` (or `display: none`), and only displays `md:flex` when `showEditor === true`.
- **Verification Plan:** Unit tests verifying that when `showEditor` is `false`, the editor element is either unmounted or has class `hidden` without `md:flex` collision, and is not visible.

---

### [ ] Issue 2: Middle bar between Editor and Preview is not draggable
- **Severity:** High (Missing essential split-pane functionality)
- **Observed Behavior:** The middle boundary between Editor and Preview is a static gap with no drag handle, preventing users from resizing the panes.
- **Root Cause:** App previously used a static flex gap (`gap-6`) without a resizable divider component or mouse/touch drag listeners.
- **Target Solution:**
  1. Build a reusable `SplitDivider` component with:
     - Mouse down / mouse move / mouse up dragging support.
     - Touch start / touch move / touch end support for touch screens.
     - Visual hover states with `cursor-col-resize`, accent highlight on drag.
     - Double-click to reset width back to default 50%.
     - Keyboard accessibility (Left/Right arrow keys adjust ratio by 2%).
     - Min/max clamp constraints (minimum 20% width, maximum 80% width) to prevent panes from collapsing inappropriately.
  2. Persist the user's custom split ratio in `localStorage` under `markread_pane_ratio`.
- **Verification Plan:** Unit tests for `SplitDivider` component testing drag events, ratio clamping, double-click reset, and keyboard navigation.

---

### [ ] Issue 3: Layout does not scale fluidly to available viewport space
- **Severity:** Medium (Ergonomics & responsive design)
- **Observed Behavior:** The workspace was constrained inside a fixed `max-w-[1600px]` with static margins and fixed min-heights (`min-h-[calc(100vh-170px)]`), resulting in awkward whitespace and poor utilization of ultra-wide or laptop displays.
- **Root Cause:** Outermost layout lacked a fluid full-height column layout (`h-[calc(100vh-56px)] flex-1 overflow-hidden`) with dynamic proportional percentage widths (`style={{ width: `${ratio}%` }}`).
- **Target Solution:**
  1. Make the main workspace container fill 100% of available viewport width and remaining vertical height cleanly:
     - `h-[calc(100vh-56px)] w-full flex flex-col p-2 md:p-3 overflow-hidden`.
  2. Apply dynamic percentage-based width to the editor and preview panes based on `splitRatio`:
     - Editor: `style={{ width: `${splitRatio}%` }}`
     - Preview: `style={{ width: `${100 - splitRatio}%` }}`
  3. When editor is hidden, preview smoothly expands to full width or centered reading measure (`max-w-3xl mx-auto`).
  4. Ensure each pane handles its own internal scrolling independently without viewport-level scrollbar double jumps.
- **Verification Plan:** Unit tests and responsive layout checks verifying container fluid sizing and percentage calculations.

---

## 3. Implementation Steps & Commit Plan

1. **Step 1:** Create `Docs/BUG_REPORT_UI.md` documenting all bugs, root causes, and planned fixes. *(Commit)*
2. **Step 2:** Fix Issue 1 (CSS display collision for Show/Hide Code) + unit tests. *(Commit)*
3. **Step 3:** Implement Issue 2 (`SplitDivider` draggable pane component + ratio persistence) + unit tests. *(Commit)*
4. **Step 4:** Implement Issue 3 (Fluid full-viewport scaling and responsive dimensions) + unit tests. *(Commit)*
5. **Step 5:** Update `Docs/BUG_REPORT_UI.md` with resolved checklist markers `[x]` and final test verification report. *(Commit)*
