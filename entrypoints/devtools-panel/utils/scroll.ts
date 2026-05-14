export interface ScrollableTarget {
  scrollTo: (options: ScrollToOptions) => void
}

export function scrollToTop(target: ScrollableTarget | null) {
  target?.scrollTo({ top: 0, behavior: 'smooth' })
}
