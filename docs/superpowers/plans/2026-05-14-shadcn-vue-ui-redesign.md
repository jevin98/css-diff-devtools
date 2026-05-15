# shadcn-vue UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Element Plus with shadcn-vue style controls, rebuild the DevTools panel as a compact black/white interface, and add a top-right icon theme toggle while preserving all existing CSS diff behavior.

**Architecture:** Keep comparison logic in `entrypoints/devtools-panel/hooks/useDevToolsPanel.ts`, move Element-specific toast usage to `vue-sonner`, and rebuild the panel template with shadcn-vue components plus a lightweight native table. Theme state lives in the panel and writes a `dark` class to the document root.

**Tech Stack:** Vue 3, WXT, Tailwind CSS v4, shadcn-vue generated components, reka-ui, lucide-vue-next, vue-sonner, class-variance-authority, clsx, tailwind-merge.

---

## File Structure

- Modify `package.json`: remove `element-plus`; add shadcn-vue runtime dependencies and icons.
- Modify `pnpm-lock.yaml`: refresh after dependency changes.
- Create `components.json`: shadcn-vue CLI config using neutral base color and `@/*` aliases.
- Modify `tsconfig.json`: remove Element Plus global types; add `baseUrl` and `@/*` path alias.
- Modify `assets/main.css`: replace Element overrides with Tailwind v4 CSS-first shadcn theme tokens, dark theme variables, body reset, and table scrollbar polish.
- Create `lib/utils.ts`: `cn()` helper for shadcn-vue components.
- Create `components/ui/*`: generated shadcn-vue component files for button, input, checkbox, select, tooltip, and sonner.
- Modify `entrypoints/devtools-panel/main.ts`: remove Element Plus CSS import; add `vue-sonner/style.css` if sonner requires it.
- Modify `entrypoints/devtools-panel/hooks/useDevToolsPanel.ts`: remove `ElMessage`; call `toast.success()` after copy.
- Modify `entrypoints/devtools-panel/devtools-panel.vue`: rebuild compact layout, native diff table, language select, theme icon button, tooltip, checkbox, input, and toaster.

## Task 1: shadcn-vue Foundation

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `components.json`
- Modify: `tsconfig.json`
- Modify: `assets/main.css`
- Create: `lib/utils.ts`
- Create: `components/ui/**`

- [ ] **Step 1: Install and generate shadcn-vue components**

Run:

```powershell
pnpm add class-variance-authority clsx tailwind-merge lucide-vue-next reka-ui vue-sonner
pnpm remove element-plus
pnpm dlx shadcn-vue@latest add button input checkbox select tooltip sonner
```

Expected:

- `element-plus` is removed from `package.json`.
- shadcn-vue component files are generated under `components/ui`.
- `pnpm-lock.yaml` is updated.

- [ ] **Step 2: Add shadcn project config**

Ensure `components.json` contains:

```json
{
  "$schema": "https://shadcn-vue.com/schema.json",
  "style": "new-york",
  "typescript": true,
  "tailwind": {
    "config": "",
    "css": "assets/main.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "composables": "@/composables",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 3: Update TypeScript alias**

Set `tsconfig.json` to:

```json
{
  "extends": "./.wxt/tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

- [ ] **Step 4: Configure Tailwind theme tokens**

Update `assets/main.css` with Tailwind v4 CSS-first directives: `@source`, `@custom-variant dark`, and `@theme inline` for shadcn color and radius tokens.

- [ ] **Step 5: Configure global CSS variables**

Update `assets/main.css` with Tailwind layers, `:root` tokens, `.dark` tokens, and a neutral DevTools body style. Keep body padding at `16px`.

## Task 2: Remove Element Runtime Coupling

**Files:**
- Modify: `entrypoints/devtools-panel/main.ts`
- Modify: `entrypoints/devtools-panel/hooks/useDevToolsPanel.ts`

- [ ] **Step 1: Remove Element CSS import**

Delete this import from `entrypoints/devtools-panel/main.ts`:

```ts
import 'element-plus/dist/index.css'
```

Add the sonner style import:

```ts
import 'vue-sonner/style.css'
```

- [ ] **Step 2: Replace Element message**

In `entrypoints/devtools-panel/hooks/useDevToolsPanel.ts`, replace:

```ts
import { ElMessage } from 'element-plus'
```

with:

```ts
import { toast } from 'vue-sonner'
```

Replace the success message block with:

```ts
toast.success(`${t('copyInfo')} > ${text.value}`)
```

- [ ] **Step 3: Remove Element table class helpers**

Stop returning `onTableCellClassName` and `onTableRowClassName` from the hook. The native table template will bind row and cell classes directly from `row.isDiff` and column identity.

## Task 3: Rebuild DevTools Panel UI

**Files:**
- Modify: `entrypoints/devtools-panel/devtools-panel.vue`

- [ ] **Step 1: Replace Element imports**

Use these imports:

```ts
import { Check, Copy, Info, Moon, Sun, Trash2 } from 'lucide-vue-next'
import { computed, defineComponent, h, onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Toaster } from '@/components/ui/sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
```

- [ ] **Step 2: Add theme state**

Add state that reads `localStorage.getItem('css-diff-theme')`, toggles between `light` and `dark`, applies `document.documentElement.classList.toggle('dark', isDark.value)`, and persists the selected theme.

- [ ] **Step 3: Build compact header**

Render `DOM Diff`, the existing translated `info`, and a right action group containing locale select, icon-only theme button, and clear button.

- [ ] **Step 4: Build filter toolbar**

Render shadcn `Input` bound to `inputValue` and shadcn `Checkbox` bound to `isAllProperty`.

- [ ] **Step 5: Build native table**

Render:

- First column: property name with highlighted search text.
- Dynamic selected element columns.
- Header tooltip with `Info` icon.
- Click handlers on value cells only.
- Empty state message when there are no rendered diffs.

- [ ] **Step 6: Add toaster**

Add `<Toaster rich-colors position="top-right" />` inside the root panel template.

## Task 4: Verification

**Files:**
- Read/verify all modified files.

- [ ] **Step 1: Type-check**

Run:

```powershell
pnpm run compile
```

Expected: exits with code 0.

- [ ] **Step 2: Build Chrome extension**

Run:

```powershell
pnpm run build:chrome
```

Expected: exits with code 0 and writes WXT output.

- [ ] **Step 3: Inspect dependency removal**

Run:

```powershell
rg "element-plus|El[A-Z]|<el-|\\$message|ElMessage" -n
```

Expected: no source references to Element Plus remain.

- [ ] **Step 4: Visual smoke test**

Start the WXT dev server:

```powershell
pnpm run dev
```

Open the extension panel where feasible and check:

- Theme button is icon-only in the top-right area.
- Theme switches light/dark and survives reload.
- Locale select still changes labels.
- Filter and show-all controls work.
- Diff value cell click copies and shows a success toast.
