# shadcn-vue UI Redesign Design

Date: 2026-05-14

## Goal

Replace the current Element Plus based DevTools panel UI with shadcn-vue styled controls while preserving the existing CSS comparison workflow.

The redesigned interface should be compact, clear, monochrome, and suited for repeated use inside Chrome DevTools.

## Approved Direction

Use a compact tool-style layout:

- Top row: title and short status/help copy on the left.
- Top-right actions: language selector, theme icon toggle, clear selection button.
- Filter row: CSS property search input and "show all" checkbox.
- Main area: high-density diff table.

Visual style:

- Black, white, and neutral gray palette.
- No large red/green row blocks.
- Difference rows use monochrome emphasis: subtle row background, left marker, stronger font weight, and cursor affordance.
- Same rows use lower-contrast neutral text.

Theme behavior:

- Theme is switched by an icon-only button in the top-right action area.
- The selected theme is persisted locally.
- Light and dark modes share the same layout and interaction model.

## Functional Requirements

Keep the existing behavior:

- Select two DOM elements in DevTools Elements panel.
- Receive selected element data from other windows/tabs.
- Compare CSS properties from the two selected elements.
- Filter rows by CSS property name.
- Toggle between only differing properties and all properties.
- Clear the selected elements and current diff result.
- Click a non-property table cell to copy `property: value;`.
- Show a copy-success message.
- Support existing English and Simplified Chinese locale switching.

## Component Plan

Use shadcn-vue for controls where it fits the existing UI:

- `Button` for clear selection and theme icon button.
- `Input` for property filtering.
- `Checkbox` for show-all toggle.
- `Select` for locale switching.
- `Tooltip` for column header help.
- `Toast` or `Sonner` for copy-success feedback.

Use a custom native table instead of a heavy data-table abstraction. The current table has dynamic comparison columns, custom row classes, and cell-click behavior; a direct table keeps the behavior smaller and clearer.

## State And Data Flow

Keep the current `useDevToolsPanel` hook as the source of comparison behavior.

Move Element-specific UI concerns out of the hook:

- Replace `ElMessage` with a local toast integration.
- Replace Element table callback shapes with simple row/cell helpers or direct template bindings.
- Keep `renderCssDiffs`, `selectedEl`, `inputValue`, and `isAllProperty` as the public state used by the Vue template.

Add theme state in the panel:

- Read stored theme on mount.
- Apply or remove a `dark` class on the document root.
- Persist changes to local storage.

## Testing And Verification

Verification should include:

- `pnpm install` if dependencies change.
- `pnpm run compile`.
- `pnpm run build:chrome`.
- Local visual check of the WXT panel where feasible.

Manual interaction checks:

- Locale select updates labels.
- Theme icon switches light/dark and persists after reload.
- Filter input narrows rows.
- Show-all checkbox toggles same-property rows.
- Clear selection empties state.
- Clicking comparison cells copies CSS and shows success feedback.
