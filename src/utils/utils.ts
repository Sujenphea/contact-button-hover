import clsx, { ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getRandomId = () => {
  return Math.random().toString(36).slice(2, 10) // e.g. "k3z4q1n8"
}

/**
 * Query a single element with type safety and runtime validation.
 * Throws an error if the element is not found.
 * @param selector - CSS selector string
 * @param context - Parent node to search within (defaults to document)
 * @returns The found element cast to type T
 * @throws Error if element is not found
 */
export function queryOrThrow<T extends Element = HTMLElement>(
  selector: string,
  context: ParentNode = document
): T {
  const element = context.querySelector<T>(selector)
  if (!element) {
    throw new Error(`Element not found: "${selector}"`)
  }
  return element
}

/**
 * Query all elements matching a selector with type safety and runtime validation.
 * Throws an error if no elements are found.
 * @param selector - CSS selector string
 * @param context - Parent node to search within (defaults to document)
 * @returns NodeList of found elements
 * @throws Error if no elements are found
 */
export function queryAllOrThrow<T extends Element = HTMLElement>(
  selector: string,
  context: ParentNode = document
): NodeListOf<T> {
  const elements = context.querySelectorAll<T>(selector)
  if (elements.length === 0) {
    throw new Error(`No elements found: "${selector}"`)
  }
  return elements
}

/**
 * Query a single element, returning null if not found (no throw).
 * Useful when element is optional.
 * @param selector - CSS selector string
 * @param context - Parent node to search within (defaults to document)
 * @returns The found element or null
 */
export function queryOrNull<T extends Element = HTMLElement>(
  selector: string,
  context: ParentNode = document
): T | null {
  return context.querySelector<T>(selector)
}
