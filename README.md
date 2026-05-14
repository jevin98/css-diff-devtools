# CSS-Diff

A browser extension that compares different CSS.

![Screenshot](https://github.com/Jevin0/css-diff-devtools/blob/main/img/screenshot.png?raw=true)

# Support

- Supports comparison of selected elements between different windows/tabs
- Click on different styles to automatically copy

# Usage

> [!WARNING]
> This extension is not available in the extension store.

You need to download the zip file from my release and manually drag it into your browser's extensions folder.

## Specific operations

- Select two elements in the Elements tab of the DevTools panel.

# Inspiration

+ https://github.com/kdzwinel/CSS-Diff

# Testing

This project uses Vitest for unit/component tests and Playwright for a built-panel smoke test.

```bash
pnpm test
pnpm test:coverage
pnpm test:e2e
```

- `pnpm test` runs fast Vitest tests for pure CSS diff utilities, DOM style formatting, and the Vue DevTools panel shell.
- `pnpm test:coverage` generates local coverage output under `coverage/`.
- `pnpm test:e2e` builds the Chrome extension first, then serves `.output/chrome-mv3` locally and verifies that the built DevTools panel renders.
