import { MathUtil } from "../utils/math"
import { Properties } from "../utils/properties"

/* -------------------------------------------------------------------------- */
/*                                 components                                 */
/* -------------------------------------------------------------------------- */
/**
 * Rectangle data for DOM element positioning and visibility
 */
export type DomRangeRect = {
  /** Distance from top of document */
  top: number
  /** Distance from top of document */
  bottom: number
  /** Distance from left of document */
  left: number
  /** Distance from right of document */
  right: number
  /** Element height in pixels */
  height: number
  /** Element width in pixels */
  width: number

  /** Normalized position when element top reaches screen bottom (-1) to screen top (0) */
  showScreenOffset: number
  /** Normalized position when element bottom reaches screen bottom (-1) to screen top (0) */
  hideScreenOffset: number
  /** Element position relative to viewport: -1 (below), 0 (inside), 1 (above) */
  screenRatio: number
  /** Visibility ratio: -1 (fully off-screen below), 0 (fully visible), 1 (fully off-screen above) */
  ratio: number
  /** Percentage of element visible in viewport (0-1) */
  visibilityProgress?: number
  /** Distance from element center to viewport center (normalized) */
  centerOffset?: number
}

/**
 * Efficient DOM element tracking with cached positions
 * Reduces performance overhead from repeated getBoundingClientRect calls
 */
class DomRange {
  // html
  domEl: HTMLElement

  // constants
  isVertical: boolean

  // variables
  needsUpdate = true
  lastUpdateFrame = -1

  // output
  top = 0 // from top of screen
  bottom = 0 // from top of screen
  left = 0
  right = 0
  height = 0
  width = 0

  screenTop = 0
  screenLeft = 0

  showScreenOffset = 0 // showScreenOffset: -1 → top at screen bottom, 0 → top at screen top
  hideScreenOffset = 0 // hideScreenOffset: -1 → bottom at screen bottom, 0 → bottom at screen top
  screenRatio = 0 // -1 → below window, 0 → inside window, 1 → above window
  ratio = 0 // -1 → fully off-screen, 0 → fully visible, 1 → fully off-screen (opposite side)

  /* ---------------------------------- utils --------------------------------- */
  updateFromDom(scroll: number) {
    const rect = this.domEl.getBoundingClientRect()

    this.top = rect.top + (this.isVertical ? scroll : 0)
    this.bottom = rect.bottom + (this.isVertical ? scroll : 0)
    this.left = rect.left + (this.isVertical ? 0 : scroll)
    this.right = rect.right + (this.isVertical ? 0 : scroll)

    this.width = rect.width
    this.height = rect.height
  }

  /* --------------------------------- public --------------------------------- */
  constructor(domEl: HTMLElement, isVertical?: boolean) {
    this.domEl = domEl
    // Auto-detect orientation from Lenis if available
    this.isVertical = isVertical ?? Properties.lenis?.options?.orientation !== "horizontal"
  }

  update(scroll: number, viewSize: number, forceUpdate: boolean = false) {
    if (this.needsUpdate || forceUpdate) {
      this.updateFromDom(scroll)
      this.needsUpdate = false
    }

    // get top/left relatively
    this.screenLeft = this.left + (this.isVertical ? 0 : -scroll)
    this.screenTop = this.top + (this.isVertical ? -scroll : 0)

    const position = this.isVertical ? this.screenTop : this.screenLeft
    const size = this.isVertical ? this.height : this.width

    // get ratios
    this.ratio =
      Math.min(0, MathUtil.unClampedFit(position, viewSize, viewSize - size, -1, 0)) +
      Math.max(0, MathUtil.unClampedFit(position, 0, -size, 0, 1))

    this.screenRatio = MathUtil.fit(position, viewSize, -size, -1, 1)
    this.showScreenOffset = -(position - viewSize) / viewSize
    this.hideScreenOffset = -(position + size) / viewSize
  }

  resize() {
    this.needsUpdate = true
  }
}

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
/**
 * Manages DOM element scroll tracking with optimized performance
 * @class DomScrollManager
 */
export class DomScrollManager {
  /** WeakMap for automatic garbage collection of unused elements */
  private domRanges = new WeakMap<HTMLElement, DomRange>()
  /** Set to track active elements for iteration */
  private activeElements = new Set<HTMLElement>()
  /** Intersection Observer for visibility detection */
  private intersectionObserver?: IntersectionObserver
  /** Visibility callbacks */
  private visibilityCallbacks = new WeakMap<HTMLElement, (isVisible: boolean, ratio: number) => void>()
  /** RAF batch queue */
  private updateQueue = new Set<HTMLElement>()
  private rafId?: number

  /**
   * Initialize Intersection Observer for visibility detection
   */
  private initIntersectionObserver() {
    if (this.intersectionObserver) return

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const callback = this.visibilityCallbacks.get(entry.target as HTMLElement)
          if (callback) {
            callback(entry.isIntersecting, entry.intersectionRatio)
          }
        })
      },
      {
        rootMargin: "10% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    )
  }

  /**
   * Process batched updates in RAF
   */
  private processBatchedUpdates = () => {
    this.updateQueue.forEach((el) => {
      const domRange = this.domRanges.get(el)
      if (domRange) {
        domRange.needsUpdate = true
      }
    })
    this.updateQueue.clear()
    this.rafId = undefined
  }

  /* --------------------------------- public --------------------------------- */
  /**
   * Get DOM range data for an element
   * @param el - HTML element to track
   * @param needsUpdate - Force update of cached values
   * @returns DomRangeRect with position and visibility data
   */
  getDomRange(el?: HTMLElement, needsUpdate: boolean = false): DomRangeRect {
    if (!el) {
      return {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        height: 0,
        width: 0,

        showScreenOffset: 0,
        hideScreenOffset: 0,
        screenRatio: 0,
        ratio: 0,
      }
    }

    let domRange = this.domRanges.get(el)
    if (!domRange) {
      const isVertical = Properties.lenis?.options?.orientation !== "horizontal"
      domRange = new DomRange(el, isVertical)
      this.domRanges.set(el, domRange)
      this.activeElements.add(el)
    }

    // update
    const viewSize = domRange.isVertical ? Properties.viewportHeight : Properties.viewportWidth
    domRange.update(Properties.lenis.scroll, viewSize, needsUpdate)

    // Calculate additional metrics
    const rect: DomRangeRect = {
      ...domRange,
      visibilityProgress: Math.max(0, Math.min(1, 1 - Math.abs(domRange.ratio))),
      centerOffset: domRange.screenRatio,
    }

    return rect
  }

  /**
   * Track element with visibility callback
   * @param el - Element to track
   * @param callback - Called when visibility changes
   */
  observeElement(el: HTMLElement, callback: (isVisible: boolean, ratio: number) => void) {
    this.initIntersectionObserver()
    this.visibilityCallbacks.set(el, callback)
    this.intersectionObserver?.observe(el)
    this.getDomRange(el) // Initialize tracking
  }

  /**
   * Stop tracking an element
   * @param el - Element to stop tracking
   */
  unobserveElement(el: HTMLElement) {
    this.intersectionObserver?.unobserve(el)
    this.visibilityCallbacks.delete(el)
    this.domRanges.delete(el)
    this.activeElements.delete(el)
  }

  /**
   * Batch update request for next RAF
   * @param el - Element to update
   */
  requestUpdate(el: HTMLElement) {
    this.updateQueue.add(el)
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(this.processBatchedUpdates)
    }
  }

  /**
   * Get multiple DOM ranges at once (batched read)
   * @param elements - Array of elements to get ranges for
   * @returns Array of DomRangeRect data
   */
  getDomRanges(elements: HTMLElement[]): DomRangeRect[] {
    return elements.map((el) => this.getDomRange(el))
  }

  /**
   * Clean up elements no longer in DOM
   */
  cleanup() {
    const toRemove: HTMLElement[] = []
    this.activeElements.forEach((el) => {
      if (!document.body.contains(el)) {
        toRemove.push(el)
      }
    })
    toRemove.forEach((el) => this.unobserveElement(el))
  }

  /**
   * Handle resize events
   */
  resize() {
    this.activeElements.forEach((el) => {
      const range = this.domRanges.get(el)
      if (range) {
        range.resize()
      }
    })
  }

  /**
   * Destroy and clean up
   */
  destroy() {
    this.intersectionObserver?.disconnect()
    this.activeElements.clear()
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
    }
  }
}
