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

test('renders the built DevTools panel shell', async ({ page }) => {
  test.skip(!existsSync(panelPath), 'Run `pnpm build:chrome` before this E2E test.')
  const server = await serveOutputDir()

  try {
    await page.addInitScript(() => {
      const messages: Record<string, string> = {
        info: 'Select two elements in the Elements tab of the DevTools panel and the style differences will be shown below.',
        inputPlaceholder: 'Please enter the css property you want to view',
        isAllProperty: 'Show all',
        property: 'property',
        removeBtn: 'Clear Selection',
        selectedInfo: 'Please select two elements to compare.',
        tableColumnInfo: 'The header name is concatenated from the DOM\'s `TagName`, `Id`, and `Class` attributes using `$$$$`.',
      }

      const extensionApi = {
        i18n: {
          getMessage: (key: string) => messages[key] ?? key,
        },
        runtime: {
          id: 'test-extension',
          getURL: (value = '') => value,
          onMessage: {
            addListener() {},
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

      ;(window as any).browser = extensionApi
      ;(window as any).chrome = extensionApi
    })

    await page.goto(server.url)

    await expect(page.getByRole('heading', { name: 'DOM Diff' })).toBeVisible()
    await expect(page.getByText('Select two elements in the Elements tab')).toBeVisible()
    await expect(page.getByText('Please select two elements to compare.')).toBeVisible()
  }
  finally {
    await server.close()
  }
})
