export interface FormatStyleValue {
  tag: string
  id?: string
  class?: string
  style?: Record<string, string>
}

export function formatStyle(element: Element | null): FormatStyleValue | null {
  if (!element) {
    return null
  }

  const styles = (element as Node)?.ownerDocument?.defaultView?.getComputedStyle(element)
  const outValue: Record<string, string> = {}

  if (styles) {
    for (let i = 0; i < styles.length; i++) {
      const styleKey = styles[i]

      if (styleKey) {
        outValue[styleKey] = styles.getPropertyValue(styleKey)
      }
    }
  }

  const id = (element.attributes?.getNamedItem('id')) ? element.attributes?.getNamedItem('id')!.value : undefined
  const _class = (element.attributes?.getNamedItem('class')) ? element.attributes?.getNamedItem('class')!.value : undefined

  return {
    tag: element.tagName,
    id,
    class: _class,
    style: outValue,
  }
}
