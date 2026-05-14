# AGENTS.md

Guidance for coding agents working in this repository.

## Project Summary

`css-diff-devtools` is a WXT browser extension that adds a `CSS-Diff` sidebar to the DevTools Elements panel. Users select two DOM elements, and the extension compares their computed CSS properties across the current tab and synchronized browser windows/tabs.

## Stack

- Package manager: `pnpm` (`packageManager` is `pnpm@9.14.1`).
- Extension framework: WXT.
- UI: Vue 3 single-file components with Element Plus and Tailwind CSS.
- Localization: WXT/browser `i18n` messages under `public/_locales`.
- Language: TypeScript with Vue type checking through `vue-tsc`.
- Formatting and linting: ESLint 9 with `@antfu/eslint-config`; Prettier is intentionally disabled in VS Code.
- Browser target: Chrome by default, with Firefox and Edge build scripts available.

## Repository Layout

- `entrypoints/content.ts`: content script that relays messages from inspected pages to the DevTools page.
- `entrypoints/devtools/main.ts`: registers the DevTools Elements sidebar pane.
- `entrypoints/devtools-panel/`: Vue app rendered inside the DevTools sidebar.
- `entrypoints/devtools-panel/hooks/useDevToolsPanel.ts`: main selection, comparison, filtering, table styling, and copy-to-clipboard logic.
- `entrypoints/devtools-panel/message.ts`: broadcasts selected element data to other browser windows/tabs.
- `entrypoints/devtools-panel/utils/`: shared formatting and array helpers.
- `entrypoints/devtools-panel/lang.ts`: typed wrapper around `browser.i18n.getMessage`.
- `public/_locales/en/messages.json`: English extension and panel messages.
- `public/_locales/zh_CN/messages.json`: Simplified Chinese extension and panel messages.
- `assets/main.css`: Tailwind CSS v4 import and small global Element Plus table overrides.
- `public/icon/`: extension icons.
- `.github/renovate.json5`: dependency update policy.

Do not edit generated build output such as `.wxt`, `.output`, or packaged zip artifacts.

## Common Commands

- Install dependencies: `pnpm install --frozen-lockfile`
- Start Chrome development build: `pnpm dev`
- Start Firefox development build: `pnpm dev:firefox`
- Start Edge development build: `pnpm dev:edge`
- Type-check: `pnpm compile`
- Build all browser targets: `pnpm build`
- Build one target: `pnpm build:chrome`, `pnpm build:firefox`, or `pnpm build:edge`
- Package all targets: `pnpm zip`
- Generate changelog: `pnpm changelog`
- ESLint format/fix: `pnpm exec eslint . --fix`
- Regenerate WXT types: `pnpm exec wxt prepare`

There is no dedicated `lint` or `format` script in `package.json`; use ESLint directly through `pnpm exec`.

## Required Agent Workflow

1. Before changing files, inspect the current git status and avoid overwriting unrelated user changes.
2. Keep changes scoped to the requested behavior or documentation.
3. After every code generation or code-modifying task, run ESLint format/fix:

   ```sh
   pnpm exec eslint . --fix
   ```

4. Run the most relevant verification command before claiming completion. For TypeScript or Vue changes, run `pnpm compile`; for extension packaging, locale, or manifest changes, run `pnpm exec wxt prepare` first and then the appropriate `pnpm build:*` command.
5. Review `git diff` before staging, and stage only files that belong to the requested change.

## Coding Conventions

- Follow the existing Antfu ESLint style and let ESLint handle import ordering, spacing, semicolons, and stylistic fixes.
- Prefer TypeScript types and local domain types from `entrypoints/devtools-panel/types.ts`.
- Keep Vue component state and browser interaction logic in composables such as `useDevToolsPanel`.
- Keep pure data helpers in `entrypoints/devtools-panel/utils/`.
- Preserve the existing i18n structure by updating both `public/_locales/en/messages.json` and `public/_locales/zh_CN/messages.json` when adding user-visible strings.
- Use Element Plus components consistently with the existing DevTools panel UI.
- Use Tailwind utility classes for layout and small style adjustments.
- The existing code relies on WXT/browser extension globals such as `browser`; do not replace them with unrelated APIs without a compatibility reason.

## Extension Behavior Notes

- The DevTools sidebar is created with `browser.devtools.panels.elements.createSidebarPane`.
- Element selection is driven by `browser.devtools.panels.elements.onSelectionChanged` and `browser.devtools.inspectedWindow.eval`.
- Computed styles are normalized by `formatStyle` before comparison.
- Selected elements are compared as `left` and `right`; a third selection is ignored until the current selection is cleared.
- Cross-window/tab synchronization is handled by broadcasting through `browser.tabs.sendMessage`.
- Table rows use color classes to distinguish changed and unchanged CSS properties, and clicking a value cell copies `property: value;`.

## Pull Request Expectations

- Use concise Conventional Commits style for commits and PR titles.
- Include what changed, why it changed, and which verification commands were run.
- Do not include generated output, dependency churn, or unrelated formatting changes unless the request explicitly requires them.
