import { useEffect, useRef, useCallback, type RefObject } from 'react'

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ')

export function useFocusTrap<T extends HTMLElement>(
  isActive: boolean
): RefObject<T | null> {
  const containerRef = useRef<T>(null)
  const previousActiveElement = useRef<Element | null>(null)
  // Track if handler is registered to prevent duplicates
  const handlerRef = useRef<((e: KeyboardEvent) => void) | null>(null)

  // Memoize the handler to get fresh focusable elements on each keydown
  const createHandler = useCallback((container: HTMLElement) => {
    return function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return

      // Query fresh focusable elements each time (handles dynamic content)
      const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      if (focusableElements.length === 0) return

      const focusableArray = Array.from(focusableElements)
      const firstElement = focusableArray[0]
      const lastElement = focusableArray[focusableArray.length - 1]

      // Get current focused element with null safety
      const activeElement = document.activeElement
      const currentIndex = activeElement
        ? focusableArray.indexOf(activeElement as HTMLElement)
        : -1

      if (e.shiftKey) {
        // Shift + Tab: move backwards
        if (currentIndex === 0 || currentIndex === -1) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab: move forwards
        if (currentIndex === focusableArray.length - 1) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }
  }, [])

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    // Store the currently focused element
    previousActiveElement.current = document.activeElement

    const container = containerRef.current

    // Focus the first focusable element
    const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    focusableElements[0]?.focus()

    // Create and store handler
    const handler = createHandler(container)
    handlerRef.current = handler
    container.addEventListener('keydown', handler)

    return () => {
      // Clean up handler
      if (handlerRef.current) {
        container.removeEventListener('keydown', handlerRef.current)
        handlerRef.current = null
      }

      // Restore focus to the previously focused element (if still in DOM)
      const prev = previousActiveElement.current
      if (prev instanceof HTMLElement && document.body.contains(prev)) {
        prev.focus()
      }
    }
  }, [isActive, createHandler])

  return containerRef
}
