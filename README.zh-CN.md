<div align="center">
  <img src="./img/logo.png" alt="CSS-Diff logo" width="160">

  <h1>CSS-Diff</h1>

  <p><a href="./README.md">English</a> | 简体中文</p>

  <p>CSS-Diff 是一个用于比较两个 DOM 元素计算后 CSS 的 DevTools 侧边栏扩展。它面向前端调试场景：在 Elements 面板中选择两个元素，即可查看哪些样式发生了变化、搜索指定属性，并一键复制 CSS 声明。</p>
</div>

![Screenshot](https://github.com/jevin98/css-diff-devtools/blob/main/img/screenshot.png?raw=true)

## 为什么使用 CSS-Diff？

浏览器 DevTools 很适合检查单个元素，但当两个相似元素渲染结果不一致时，仍然经常需要在样式面板之间来回切换。CSS-Diff 会把两个元素的 computed style 放在同一张表中，优先展示差异，并让整个排查流程停留在 DevTools 内完成。

## 功能特点

- **DevTools Elements 侧边栏**：在 Elements 面板中直接添加 `CSS-Diff` 面板。
- **双元素比较**：选择两个 DOM 元素后，比较它们标准化后的计算 CSS 属性。
- **差异优先展示**：默认只展示有差异的属性，也可以通过 `显示全部` 查看完整 computed style 列表。
- **属性搜索**：按 CSS 属性名过滤对比结果。
- **一键复制**：点击任意左右侧样式值单元格，即可复制 `property: value;`。
- **跨窗口/标签页同步**：选中的元素数据会同步广播到其他已打开的窗口/标签页，便于并排比较不同页面状态。
- **本地化界面**：内置英文和简体中文浏览器 i18n 文案。

## 安装

> [!WARNING]
> CSS-Diff 目前暂未上架浏览器扩展商店。

从 [Releases](https://github.com/jevin98/css-diff-devtools/releases) 下载打包后的 zip 文件，然后在浏览器扩展程序页面中手动安装或加载。

## 使用方法

1. 打开需要检查的页面。
2. 打开 DevTools，并切换到 Elements 面板。
3. 打开 `CSS-Diff` 侧边栏。
4. 先选择第一个 DOM 元素，再选择第二个 DOM 元素。
5. 查看高亮的样式差异、搜索属性，或启用 `显示全部`。
6. 点击左侧或右侧的样式值单元格，复制对应 CSS 声明。
7. 点击 `清除选择` 开始新的比较。

## 本地开发

安装依赖：

```sh
pnpm install --frozen-lockfile
```

启动开发构建：

```sh
pnpm dev
```

其他浏览器目标：

```sh
pnpm dev:firefox
pnpm dev:edge
```

## 构建

构建全部支持目标：

```sh
pnpm build
```

构建单个目标：

```sh
pnpm build:chrome
pnpm build:firefox
pnpm build:edge
```

打包扩展：

```sh
pnpm zip
```

## 测试

本项目使用 Vitest 进行单元/组件测试，并使用 Playwright 对构建后的面板做冒烟测试。

```sh
pnpm test
pnpm test:coverage
pnpm test:e2e
```

- `pnpm test` 会运行快速 Vitest 测试，覆盖 CSS diff 纯工具、DOM 样式格式化和 Vue DevTools 面板外壳。
- `pnpm test:coverage` 会在本地 `coverage/` 目录下生成覆盖率报告。
- `pnpm test:e2e` 会先构建 Chrome 扩展，然后在本地服务 `.output/chrome-mv3` 并验证构建后的 DevTools 面板可以正常渲染。

## 技术栈

- [WXT](https://wxt.dev/) 用于浏览器扩展开发
- [Vue 3](https://vuejs.org/) 用于 DevTools 面板 UI
- [Element Plus](https://element-plus.org/) 和 [Tailwind CSS](https://tailwindcss.com/) 用于界面组件与样式
- TypeScript 和 `vue-tsc` 用于类型检查
- WXT/browser `i18n` 用于本地化文案

## 灵感来源

- https://github.com/kdzwinel/CSS-Diff

## 许可证

[MIT](./LICENSE.md)
