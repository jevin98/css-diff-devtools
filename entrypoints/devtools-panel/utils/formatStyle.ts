export interface FormatStyleValue {
  tag: string
  id?: string
  class?: string
  style?: Record<string, any>
}

export function formatStyle(element: Element): FormatStyleValue | null {
  if (!element) {
    return null
  }

  const styles = (element as Node)?.ownerDocument?.defaultView?.getComputedStyle(element)
  const outValue: Record<string, any> = {}

  if (styles) {
    for (let i = 0; i <= styles.length; i++) {
      const StyleKey = styles[i]
      const StyleValue = styles.getPropertyValue(StyleKey)
      outValue[StyleKey] = StyleValue
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
