import type { Page } from '@playwright/test'
import type { AddressInfo } from 'node:net'
import { createReadStream, existsSync } from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import { expect, test } from '@playwright/test'

const outputDir = path.resolve(process.cwd(), '.output/chrome-mv3')
const panelPath = path.join(outputDir, 'devtools-panel.html')

async function serveOutputDir() {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost')
    const relativePath = url.pathname === '/'
      ? 'devtools-panel.html'
      : decodeURIComponent(url.pathname.slice(1))
    const filePath = path.resolve(outputDir, relativePath)

    const relativeToOutput = path.relative(outputDir, filePath)

    if (relativeToOutput.startsWith('..') || path.isAbsolute(relativeToOutput) || !existsSync(filePath)) {
      response.writeHead(404)
      response.end()
      return
    }

    if (filePath.endsWith('.js')) {
      response.setHeader('Content-Type', 'text/javascript')
    }
    else if (filePath.endsWith('.css')) {
      response.setHeader('Content-Type', 'text/css')
    }
    else if (filePath.endsWith('.html')) {
      response.setHeader('Content-Type', 'text/html')
    }

    createReadStream(filePath).pipe(response)
  })

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve)
  })

  const { port } = server.address() as AddressInfo

  return {
    url: `http://127.0.0.1:${port}/devtools-panel.html`,
    close: () => new Promise<void>((resolve, reject) => {
      server.close((error?: Error) => {
        if (error) {
          reject(error)
        }
        else {
          resolve()
        }
      })
    }),
  }
}

async function mockExtensionApi(page: Page) {
  await page.addInitScript(() => {
    const messages: Record<string, string> = {
      allProperties: 'All properties',
      changed: 'Changed',
      changedOnly: 'Changed only',
      className: 'Class',
      diffs: 'Diffs',
      elementDetails: 'Element details',
      emptyElement: 'No element selected',
      filter: 'Filter',
      fullName: 'Full',
      idName: 'ID',
      info: 'Select two elements in the Elements tab of the DevTools panel and the style differences will be shown below.',
      inputPlaceholder: 'Please enter the css property you want to view',
      isAllProperty: 'Show all',
      property: 'property',
      readyToCompare: 'Ready to compare',
      removeSelectedElement: 'Remove $1 selection',
      removeBtn: 'Clear Selection',
      selectedInfo: 'Please select two elements to compare.',
      selection: 'Selection',
      sourceElement: 'Source',
      tableColumnInfo: 'The header name is concatenated from the DOM\'s `TagName`, `Id`, and `Class` attributes using `$$$$`.',
      tagName: 'Tag',
      targetElement: 'Target',
      total: 'Total',
      waitingSelection: 'Waiting for selection',
    }
    const runtimeMessageListeners: Array<(data: unknown) => void> = []

    const extensionApi = {
      i18n: {
        getMessage: (key: string) => messages[key] ?? key,
        getUILanguage: () => 'en',
      },
      runtime: {
        id: 'test-extension',
        getURL: (value = '') => value,
        onMessage: {
          addListener(callback: (data: unknown) => void) {
            runtimeMessageListeners.push(callback)
          },
        },
        sendMessage: async () => undefined,
      },
      tabs: {
        query: async () => [{ id: 1, active: true }],
        sendMessage: async () => undefined,
      },
      windows: {
        getAll: async () => [],
      },
      devtools: {
        panels: {
          elements: {
            onSelectionChanged: {
              addListener() {},
            },
          },
        },
        inspectedWindow: {
          eval(_expression: string, callback: (result: unknown, isException?: boolean) => void) {
            callback(null, false)
          },
        },
      },
    }

    ;(window as any).__cssDiffMessageListeners = runtimeMessageListeners
    ;(window as any).browser = extensionApi
    ;(window as any).chrome = extensionApi
  })
}

async function mockSystemTheme(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((themeValue) => {
    window.matchMedia = (query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' && themeValue === 'dark',
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    })
  }, theme)
}

test('renders the built DevTools panel shell', async ({ page }) => {
  test.skip(!existsSync(panelPath), 'Run `pnpm build:chrome` before this E2E test.')
  const server = await serveOutputDir()

  try {
    await mockExtensionApi(page)
    await page.goto(server.url)

    await expect(page.getByRole('img', { name: 'CSS-Diff logo' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'DOM Diff' })).toBeVisible()
    await expect(page.getByText('Waiting for selection')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Selection' })).toBeVisible()
    await expect(page.getByText('Please select two elements to compare.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Back to top' })).toHaveCount(0)

    const tableContainer = page.locator('.css-diff-scrollbar')
    const tableHeader = tableContainer.locator('thead')
    const emptyState = page.getByTestId('diff-empty-state')
    const [containerBox, headerBox, emptyBox] = await Promise.all([
      tableContainer.boundingBox(),
      tableHeader.boundingBox(),
      emptyState.boundingBox(),
    ])

    if (!containerBox || !headerBox || !emptyBox) {
      throw new Error('Expected table empty state layout boxes to be available.')
    }

    const bodyTop = headerBox.y + headerBox.height
    const bodyCenterY = bodyTop + ((containerBox.y + containerBox.height - bodyTop) / 2)
    const bodyCenterX = containerBox.x + (containerBox.width / 2)
    const emptyCenterY = emptyBox.y + (emptyBox.height / 2)
    const emptyCenterX = emptyBox.x + (emptyBox.width / 2)

    expect(Math.abs(emptyCenterY - bodyCenterY)).toBeLessThanOrEqual(2)
    expect(Math.abs(emptyCenterX - bodyCenterX)).toBeLessThanOrEqual(2)

    const headerStats = page.getByTestId('header-stats')
    const languageTrigger = page.getByRole('combobox', { name: 'Switch language' })
    const themeToggle = page.getByTestId('theme-toggle')
    await expect(languageTrigger.locator('svg.lucide-globe')).toBeVisible()
    await expect(languageTrigger.locator('svg.lucide-languages')).toHaveCount(0)
    const [statsBox, languageBox, themeBox] = await Promise.all([
      headerStats.boundingBox(),
      languageTrigger.boundingBox(),
      themeToggle.boundingBox(),
    ])

    if (!statsBox || !languageBox || !themeBox) {
      throw new Error('Expected header control layout boxes to be available.')
    }

    expect(statsBox.height).toBe(languageBox.height)
    expect(themeBox.height).toBe(languageBox.height)
    expect(languageBox.height).toBe(32)

    const clearSelectionButton = page.getByRole('button', { name: 'Clear Selection' })
    const filterModeButton = page.getByRole('button', { name: 'Changed only' })
    const [clearSelectionBox, filterModeBox] = await Promise.all([
      clearSelectionButton.boundingBox(),
      filterModeButton.boundingBox(),
    ])

    if (!clearSelectionBox || !filterModeBox) {
      throw new Error('Expected page action control layout boxes to be available.')
    }

    expect(clearSelectionBox.height).toBe(languageBox.height)
    expect(filterModeBox.height).toBe(languageBox.height)
  }
  finally {
    await server.close()
  }
})

test('follows the system theme until the user toggles manually', async ({ page }) => {
  test.skip(!existsSync(panelPath), 'Run `pnpm build:chrome` before this E2E test.')
  const server = await serveOutputDir()

  try {
    await mockSystemTheme(page, 'dark')
    await mockExtensionApi(page)
    await page.goto(server.url)

    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('css-diff-theme'))).toBeNull()

    await page.getByTestId('theme-toggle').click()

    await expect(page.locator('html')).not.toHaveClass(/dark/)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('css-diff-theme'))).toBe('light')
  }
  finally {
    await server.close()
  }
})

test('opens the selected element header info popover on click', async ({ page }) => {
  test.skip(!existsSync(panelPath), 'Run `pnpm build:chrome` before this E2E test.')
  const server = await serveOutputDir()

  try {
    await mockExtensionApi(page)
    await page.goto(server.url)

    await page.evaluate(() => {
      const selected = [
        {
          valueType: 'left',
          tag: 'a',
          id: '',
          class: 'nav-link',
          style: { color: 'rgb(34, 34, 34)' },
        },
        {
          valueType: 'right',
          tag: 'img',
          id: '',
          class: 'avatar',
          style: { color: 'rgb(0, 0, 238)' },
        },
      ]

      ;((window as any).__cssDiffMessageListeners as Array<(data: unknown) => void>)
        .forEach(callback => callback(selected))
    })

    const infoTriggers = page.getByRole('button', { name: 'Element details' })

    await expect(infoTriggers).toHaveCount(2)
    await infoTriggers.nth(0).click()

    const detailsDialog = page.getByRole('dialog')

    await expect(detailsDialog.getByText('Element details')).toBeVisible()
    await expect(detailsDialog.getByText('nav-link', { exact: true })).toBeVisible()
  }
  finally {
    await server.close()
  }
})

test('keeps the Chinese full name label on one line in element details', async ({ page }) => {
  test.skip(!existsSync(panelPath), 'Run `pnpm build:chrome` before this E2E test.')
  const server = await serveOutputDir()

  try {
    await page.addInitScript(() => {
      localStorage.setItem('css-diff-locale', 'zh_CN')
    })
    await mockExtensionApi(page)
    await page.goto(server.url)

    await page.evaluate(() => {
      const selected = [
        {
          valueType: 'left',
          tag: 'div',
          id: '',
          class: '',
          style: { color: 'rgb(34, 34, 34)' },
        },
        {
          valueType: 'right',
          tag: 'span',
          id: '',
          class: '',
          style: { color: 'rgb(0, 0, 0)' },
        },
      ]

      ;((window as any).__cssDiffMessageListeners as Array<(data: unknown) => void>)
        .forEach(callback => callback(selected))
    })

    await page.getByRole('button', { name: '元素详情' }).first().click()

    const fullNameLabel = page.locator('dt', { hasText: '完整名称' })
    const labelMetrics = await fullNameLabel.evaluate((element) => {
      const style = window.getComputedStyle(element)

      return {
        height: element.getBoundingClientRect().height,
        lineHeight: Number.parseFloat(style.lineHeight),
      }
    })

    expect(labelMetrics.height).toBeLessThanOrEqual(labelMetrics.lineHeight + 1)
  }
  finally {
    await server.close()
  }
})

test('uses compact element names in table headers', async ({ page }) => {
  test.skip(!existsSync(panelPath), 'Run `pnpm build:chrome` before this E2E test.')
  const server = await serveOutputDir()

  try {
    await mockExtensionApi(page)
    await page.goto(server.url)

    await page.evaluate(() => {
      const selected = [
        {
          valueType: 'left',
          tag: 'div',
          id: 'main-header',
          class: 'head_wrapper s-isindex-wrap nologin search-box-new-head-wrapper',
          style: { color: 'rgb(34, 34, 34)' },
        },
        {
          valueType: 'right',
          tag: 'div',
          id: '',
          class: 's_top_container extra-layout-token',
          style: { color: 'rgb(0, 0, 0)' },
        },
      ]

      ;((window as any).__cssDiffMessageListeners as Array<(data: unknown) => void>)
        .forEach(callback => callback(selected))
    })

    const sourceHeader = page.getByRole('columnheader').nth(1)
    const targetHeader = page.getByRole('columnheader').nth(2)

    await expect(sourceHeader).toContainText('Source')
    await expect(sourceHeader).toContainText('DIV')
    await expect(sourceHeader).toContainText('#main-header')
    await expect(sourceHeader).not.toContainText('head_wrapper s-isindex-wrap nologin search-box-new-head-wrapper')

    await expect(targetHeader).toContainText('Target')
    await expect(targetHeader).toContainText('DIV')
    await expect(targetHeader).toContainText('.s_top_container')
    await expect(targetHeader).not.toContainText('extra-layout-token')
  }
  finally {
    await server.close()
  }
})

test('removes a single selected element from its selection card', async ({ page }) => {
  test.skip(!existsSync(panelPath), 'Run `pnpm build:chrome` before this E2E test.')
  const server = await serveOutputDir()

  try {
    await mockExtensionApi(page)
    await page.goto(server.url)

    await page.evaluate(() => {
      const selected = [
        {
          valueType: 'left',
          tag: 'div',
          id: '',
          class: 'chat-input-background',
          style: { color: 'rgb(34, 34, 34)' },
        },
        {
          valueType: 'right',
          tag: 'div',
          id: '',
          class: 'chat-input-anchor',
          style: { color: 'rgb(0, 0, 0)' },
        },
      ]

      ;((window as any).__cssDiffMessageListeners as Array<(data: unknown) => void>)
        .forEach(callback => callback(selected))
    })

    await expect(page.getByText('chat-input-background', { exact: true })).toBeVisible()
    await expect(page.getByText('chat-input-anchor', { exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'color' })).toBeVisible()

    const removeTargetButton = page.getByRole('button', { name: 'Remove Target selection' })
    const removeTargetBox = await removeTargetButton.boundingBox()

    if (!removeTargetBox) {
      throw new Error('Expected remove target button layout box to be available.')
    }

    expect(removeTargetBox.height).toBe(32)

    await removeTargetButton.click()

    await expect(page.getByText('chat-input-background', { exact: true })).toBeVisible()
    await expect(page.getByText('chat-input-anchor', { exact: true })).not.toBeVisible()
    await expect(page.getByText('Please select two elements to compare.')).toBeVisible()
    await expect(page.getByRole('cell', { name: 'color' })).not.toBeVisible()

    await page.evaluate(() => {
      const selected = [
        {
          valueType: 'left',
          tag: 'div',
          id: '',
          class: 'chat-input-background',
          style: { color: 'rgb(34, 34, 34)' },
        },
        {
          valueType: 'right',
          tag: 'div',
          id: '',
          class: 'chat-input-anchor',
          style: { color: 'rgb(0, 0, 0)' },
        },
      ]

      ;((window as any).__cssDiffMessageListeners as Array<(data: unknown) => void>)
        .forEach(callback => callback(selected))
    })

    const removeSourceButton = page.getByRole('button', { name: 'Remove Source selection' })
    const removeSourceBox = await removeSourceButton.boundingBox()

    if (!removeSourceBox) {
      throw new Error('Expected remove source button layout box to be available.')
    }

    expect(removeSourceBox.height).toBe(32)

    await removeSourceButton.click()

    await expect(page.getByText('chat-input-background', { exact: true })).not.toBeVisible()
    await expect(page.getByText('chat-input-anchor', { exact: true })).toBeVisible()
    await expect(page.getByText('Please select two elements to compare.')).toBeVisible()
  }
  finally {
    await server.close()
  }
})

test('clears stale diffs when synced selection has fewer than two elements', async ({ page }) => {
  test.skip(!existsSync(panelPath), 'Run `pnpm build:chrome` before this E2E test.')
  const server = await serveOutputDir()

  try {
    await mockExtensionApi(page)
    await page.goto(server.url)

    await page.evaluate(() => {
      const selected = [
        {
          valueType: 'left',
          tag: 'div',
          id: '',
          class: 'chat-input-background',
          style: { color: 'rgb(34, 34, 34)' },
        },
        {
          valueType: 'right',
          tag: 'div',
          id: '',
          class: 'chat-input-anchor',
          style: { color: 'rgb(0, 0, 0)' },
        },
      ]

      ;((window as any).__cssDiffMessageListeners as Array<(data: unknown) => void>)
        .forEach(callback => callback(selected))
    })

    await expect(page.getByRole('cell', { name: 'color' })).toBeVisible()
    await expect(page.getByText('1 property')).toBeVisible()

    await page.evaluate(() => {
      const selected = [
        {
          valueType: 'left',
          tag: 'div',
          id: '',
          class: 'chat-input-background',
          style: { color: 'rgb(34, 34, 34)' },
        },
      ]

      ;((window as any).__cssDiffMessageListeners as Array<(data: unknown) => void>)
        .forEach(callback => callback(selected))
    })

    await expect(page.getByText('Please select two elements to compare.')).toBeVisible()
    await expect(page.getByText('0 property')).toBeVisible()
    await expect(page.getByRole('cell', { name: 'color' })).not.toBeVisible()
  }
  finally {
    await server.close()
  }
})

test('filters property names without adding visual spacing inside the match', async ({ page }) => {
  test.skip(!existsSync(panelPath), 'Run `pnpm build:chrome` before this E2E test.')
  const server = await serveOutputDir()

  try {
    await mockExtensionApi(page)
    await page.goto(server.url)

    await page.evaluate(() => {
      const selected = [
        {
          valueType: 'left',
          tag: 'div',
          id: '',
          class: 'chat-input-tool',
          style: { 'align-items': 'normal' },
        },
        {
          valueType: 'right',
          tag: 'div',
          id: '',
          class: 'chat-input-tool',
          style: { 'align-items': 'center' },
        },
      ]

      ;((window as any).__cssDiffMessageListeners as Array<(data: unknown) => void>)
        .forEach(callback => callback(selected))
    })

    const filterInput = page.getByPlaceholder('Please enter the css property you want to view')
    const filterInputBox = await filterInput.boundingBox()

    if (!filterInputBox) {
      throw new Error('Expected filter input layout box to be available.')
    }

    expect(filterInputBox.height).toBe(32)

    await filterInput.fill('alig')
    const clearFilterBox = await page.getByRole('button', { name: 'Clear filter' }).boundingBox()

    if (!clearFilterBox) {
      throw new Error('Expected clear filter button layout box to be available.')
    }

    expect(clearFilterBox.height).toBe(32)

    const propertyCell = page.getByRole('cell', { name: 'align-items' })

    await expect(propertyCell).toBeVisible()
    await expect(propertyCell).toHaveText('align-items')

    const highlightPadding = await propertyCell.locator('mark').evaluate((element) => {
      const style = getComputedStyle(element)

      return `${style.paddingLeft} ${style.paddingRight}`
    })

    expect(highlightPadding).toBe('0px 0px')
  }
  finally {
    await server.close()
  }
})
