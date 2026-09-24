# Clarity - UI/UX Architecture & Micro-Interaction Upgrade Catalog

This document archives the planned micro-interactions, sensory animations, and kinetic interface polish items for Clarity.

---

## 1. Physical Ledger Navigation & Deck Transitions
* **Direction-Aware Stacked Paper Deck Transitions**:
  * Switching between sidebar navigation items (Calendar, Diary, Tasks, Expenses, Projects) moves away from simple opacity cross-fades.
  * Pages animate with a 3D perspective deck glide (`scale: 0.96 -> 1.0`, slight `rotateY` tilt, spring physics `stiffness: 300, damping: 28`).
  * Emulates flipping through a hand-bound luxury executive folio or portfolio ledger.

---

## 2. Dynamic Odometer Number Counters (Expenses)
* **Rolling Mechanical Digit Tickers**:
  * Instead of snapping immediately to new balance values (e.g., `₹14,500`), expense summaries, category breakdowns, and running totals roll up using an odometer-style rolling digit effect.
  * Digits spin into place with ease-out spring curves paired with ultra-subtle mechanical audio clicks.

---

## 3. Fountain Pen Ink Strike Physics (Tasks)
* **Tactile Completion Animation**:
  * Checkbox interaction with elastic spring recoil (`scale: [1, 0.8, 1.15, 1]`).
  * SVG path-length drawing animation that literally draws a fountain-pen ink stroke across the task title from left to right with ink-bleed easing.
  * Micro-particle ink dispersion settling softly into the paper background.

---

## 4. Interactive Magnetic Cursor Spotlights
* **Radial Specular Lighting on Cards**:
  * Expense dockets, project cards, and docket items react to cursor coordinates.
  * A subtle radial specular gradient follows the mouse across card surfaces, mimicking real ambient light reflecting off matte stationery cardstock.

---

## 5. Kanban 3D Inertial Drag & Tilt (Projects)
* **Velocity-Responsive Card Movement**:
  * Project cards elevate on hover with deeper drop shadows.
  * When dragged across stages (Todo -> In Progress -> Done), cards tilt dynamically based on cursor velocity (`rotateZ`, slight `rotateX/Y`), creating a tangible, physical feel.

---

## 6. Genuine 3D Page Curl & Folding Physics (Diary)
* **Physical Spine Turning**:
  * Daily and monthly entries turn along a virtual spine (`transform-origin: left center`, `rotateY: -35deg`).
  * Crease shadow gradient darkens dynamically during the fold angle to mimic heavy book paper.

---

*Catalog created: 2026-09-24*
