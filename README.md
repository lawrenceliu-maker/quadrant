# Quadrant

A minimal, focus-first Eisenhower Matrix task planner.

Quadrant removes the usual productivity-app clutter and keeps the four decisions
that matter in view: do now, schedule, delegate, or eliminate.

## Preview

![Quadrant Focus Board desktop view](docs/screenshots/quadrant-desktop.png?v=2)

<p align="center">
  <img src="docs/screenshots/quadrant-mobile.png?v=2" alt="Quadrant Focus Board mobile view" width="320" />
</p>

## Features

- Open, distraction-free four-quadrant focus board
- Floating toolbar with Today, All, and Completed views
- Smart Import from authorized Obsidian daily notes
- Drag tasks between quadrants
- Add, edit, complete, search, and delete tasks
- Compact progress tracking
- Browser-local persistence
- Responsive desktop and mobile layout

## Smart Import

Select **Smart Import** and authorize your Obsidian daily-note folder. Quadrant
reads today's and tomorrow's `YYYY-MM-DD.md` files, skips completed and duplicate
items, prioritizes actionable leaf tasks, and previews each quadrant assignment
with a short explanation before importing.

Journal analysis runs entirely in the browser. Files are only read after folder
permission is granted, and journal content is never uploaded. Smart Import
requires the app to be served on localhost in Microsoft Edge or Google Chrome.

## Design

- Native system typography
- Generous whitespace and restrained semantic color
- Lightweight dividers instead of stacked cards
- Floating task editor that keeps the matrix in context

## Run locally

Open `index.html` directly, or serve the folder:

```powershell
npx serve .
```

## Privacy

Quadrant has no backend. Tasks remain in your browser's local storage.
