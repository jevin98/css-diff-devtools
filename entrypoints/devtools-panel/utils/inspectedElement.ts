import type { FormatStyleValue } from './formatStyle'
import { formatStyle } from './formatStyle'

export type SelectedElementValueType = 'left' | 'right'

export interface CaptureSelectedElementResult {
  inspectPath?: string
  readyState: Document['readyState']
  result: FormatStyleValue | null
  inspectId?: string
}

export const SELECTED_ELEMENT_STORE_KEY = '__CSS_DIFF_DEVTOOLS_SELECTED_ELEMENTS__'

function getElementCssPath(element: Element | null) {
  if (!(element instanceof Element)) {
    return undefined
  }

  const segments: string[] = []
  let currentElement: Element | null = element

  while (currentElement) {
    const tagName = currentElement.tagName.toLowerCase()
    const parentElement: Element | null = currentElement.parentElement

    if (!tagName) {
      return undefined
    }

    if (!parentElement) {
      segments.unshift(tagName)
      break
    }

    let index = 1
    let sibling: Element | null = currentElement.previousElementSibling

    while (sibling) {
      if (sibling.tagName === currentElement.tagName) {
        index += 1
      }

      sibling = sibling.previousElementSibling
    }

    segments.unshift(`${tagName}:nth-of-type(${index})`)
    currentElement = parentElement
  }

  return segments.join(' > ')
}

export function createCaptureSelectedElementScript(valueType: SelectedElementValueType) {
  return `(() => {
    const element = $0;
    const result = (${formatStyle.toString()})(element);
    const readyState = document.readyState;
    const inspectPath = (${getElementCssPath.toString()})(element);

    if (result != null && readyState === 'complete') {
      const storeKey = ${JSON.stringify(SELECTED_ELEMENT_STORE_KEY)};
      const store = globalThis[storeKey] = globalThis[storeKey] || {};

      store.elements = store.elements || {};
      store.valueTypeIds = store.valueTypeIds || {};

      const previousInspectId = store.valueTypeIds[${JSON.stringify(valueType)}];

      if (previousInspectId) {
        delete store.elements[previousInspectId];
      }

      const inspectId = [
        ${JSON.stringify(valueType)},
        Date.now().toString(36),
        Math.random().toString(36).slice(2),
      ].join('-');

      store.elements[inspectId] = element;
      store.valueTypeIds[${JSON.stringify(valueType)}] = inspectId;

      return { readyState, result, inspectId, inspectPath };
    }

    return { readyState, result };
  })()`
}

export function createResolveSelectedElementExpression(inspectId: string, inspectPath?: string) {
  const cachedElementExpression = `globalThis[${JSON.stringify(SELECTED_ELEMENT_STORE_KEY)}]?.elements?.[${JSON.stringify(inspectId)}] ?? null`

  if (!inspectPath) {
    return cachedElementExpression
  }

  return `(() => {
    const cachedElement = ${cachedElementExpression};

    if (cachedElement) {
      return cachedElement;
    }

    return document.querySelector(${JSON.stringify(inspectPath)});
  })()`
}
