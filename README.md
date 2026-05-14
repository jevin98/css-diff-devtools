# CSS-Diff

English | [简体中文](./README.zh-CN.md)

CSS-Diff is a DevTools sidebar extension for comparing the computed CSS of two DOM elements. It is built for frontend debugging: select two elements in the Elements panel, then inspect what changed, search for a property, and copy a CSS declaration with one click.

![Screenshot](https://github.com/Jevin0/css-diff-devtools/blob/main/img/screenshot.png?raw=true)

## Why CSS-Diff?

Browser DevTools is excellent at inspecting one element, but finding why two similar elements render differently can still mean switching back and forth between style panes. CSS-Diff puts both computed style results in one table, highlights the differences first, and keeps the workflow inside DevTools.

## Features

- **DevTools Elements sidebar**: adds a `CSS-Diff` pane directly to the Elements panel.
- **Two-element comparison**: select two DOM elements and compare their normalized computed CSS properties.
- **Difference-first table**: changed properties are shown by default, with a `Show all` toggle for the full computed style list.
- **Property search**: filter CSS properties by name while reviewing the comparison.
- **One-click copy**: click a value cell to copy `property: value;`.
- **Cross-window/tab sync**: selected element data is broadcast to other open windows/tabs, which helps compare page states side by side.
- **Localized UI**: includes English and Simplified Chinese browser i18n messages.

## Installation

> [!WARNING]
> CSS-Diff is not currently available in a browser extension store.

Download the packaged zip from [Releases](https://github.com/Jevin0/css-diff-devtools/releases), then install or load it manually from your browser's extensions page.

## Usage

1. Open the page you want to inspect.
2. Open DevTools and switch to the Elements panel.
3. Open the `CSS-Diff` sidebar.
4. Select the first DOM element, then select the second DOM element.
5. Review the highlighted differences, search for a property, or enable `Show all`.
6. Click a left/right value cell to copy the CSS declaration.
7. Click `Clear Selection` to start another comparison.

## Local Development

Install dependencies:

```sh
pnpm install --frozen-lockfile
```

Start a development build:

```sh
pnpm dev
```

Other browser targets:

```sh
pnpm dev:firefox
pnpm dev:edge
```

## Build

Build all supported targets:

```sh
pnpm build
```

Build one target:

```sh
pnpm build:chrome
pnpm build:firefox
pnpm build:edge
```

Package extensions:

```sh
pnpm zip
```

## Tech Stack

- [WXT](https://wxt.dev/) for browser extension development
- [Vue 3](https://vuejs.org/) for the DevTools panel UI
- [Element Plus](https://element-plus.org/) and [Tailwind CSS](https://tailwindcss.com/) for interface components and styling
- TypeScript and `vue-tsc` for type checking
- WXT/browser `i18n` for localized messages

## Inspiration

- https://github.com/kdzwinel/CSS-Diff

## License

[MIT](./LICENSE.md)
