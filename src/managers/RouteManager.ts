import MinSignal from "min-signal"

const ORIGIN = window.location.origin
const URL_PREFIX_REGEX = new RegExp(`^${ORIGIN.replace(/\//g, "\\/")}`)

/** Metadata extracted from fetched pages */
type PageMeta = {
  title: string
  description: string | null
  ogTitle: string | null
  ogDescription: string | null
  ogImage: string | null
}

/** Route cache entry */
type RouteEntry = {
  title: string
  dom: HTMLElement
  meta: PageMeta
}

export class RouteManager {
  routes: { [url: string]: RouteEntry } = {}

  // html
  domContainer: HTMLElement
  private ariaLiveRegion: HTMLElement | null = null

  // internal
  private _transitioning = false
  private scrollPositions = new Map<string, number>()

  // events
  onNewRoute = new MinSignal()
  onRouteChange = new MinSignal()

  // variables
  currPath: string
  pendingPath: string | null = null

  /* ---------------------------------- aria ---------------------------------- */
  private saveScrollPosition() {
    this.scrollPositions.set(this.currPath, window.scrollY)
  }

  /**
   * Extract metadata from a parsed HTML document
   */
  private extractPageMeta(doc: Document): PageMeta {
    const title = doc.querySelector("title")?.textContent || ""
    const description = doc.querySelector('meta[name="description"]')?.getAttribute("content") || null
    const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute("content") || null
    const ogDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute("content") || null
    const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute("content") || null

    return { title, description, ogTitle, ogDescription, ogImage }
  }

  /**
   * Update document meta tags for SEO
   */
  private updateMetaTags(meta: PageMeta): void {
    // Update title
    if (meta.title) {
      document.title = meta.title
    }

    // Update or create description meta tag
    this.setMetaTag("description", meta.description, "name")

    // Update Open Graph tags
    this.setMetaTag("og:title", meta.ogTitle, "property")
    this.setMetaTag("og:description", meta.ogDescription, "property")
    this.setMetaTag("og:image", meta.ogImage, "property")
  }

  /**
   * Set or create a meta tag
   */
  private setMetaTag(name: string, content: string | null, attributeType: "name" | "property"): void {
    if (!content) return

    const selector = `meta[${attributeType}="${name}"]`
    let metaTag = document.querySelector(selector) as HTMLMetaElement | null

    if (metaTag) {
      metaTag.content = content
    } else {
      metaTag = document.createElement("meta")
      metaTag.setAttribute(attributeType, name)
      metaTag.content = content
      document.head.appendChild(metaTag)
    }
  }

  /**
   * Create aria-live region for screen reader announcements
   */
  private createAriaLiveRegion(): HTMLElement {
    const existing = document.getElementById("route-announcer")
    if (existing) return existing

    const region = document.createElement("div")
    region.id = "route-announcer"
    region.setAttribute("aria-live", "polite")
    region.setAttribute("aria-atomic", "true")
    region.className = "sr-only"
    // Visually hidden but accessible to screen readers
    region.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `
    document.body.appendChild(region)
    return region
  }

  /**
   * Announce page title to screen readers
   */
  private announcePageChange(title: string): void {
    if (!this.ariaLiveRegion) {
      this.ariaLiveRegion = this.createAriaLiveRegion()
    }
    // Clear and set with a small delay to ensure announcement
    this.ariaLiveRegion.textContent = ""
    requestAnimationFrame(() => {
      if (this.ariaLiveRegion) {
        this.ariaLiveRegion.textContent = `Navigated to ${title}`
      }
    })
  }

  /**
   * Reset focus to main content or body for accessibility
   */
  private resetFocus(): void {
    const mainElement = document.querySelector("main") || document.querySelector("[role='main']")
    if (mainElement instanceof HTMLElement) {
      // Make main focusable if not already
      if (!mainElement.hasAttribute("tabindex")) {
        mainElement.setAttribute("tabindex", "-1")
      }
      mainElement.focus({ preventScroll: true })
    } else {
      // Fallback to body
      document.body.focus()
    }
  }

  /* ---------------------------------- utils --------------------------------- */
  // Removes leading/trailing slashes from a path string
  removePathSlashes(path: string): string {
    return path.replace(/^\/+|\/+$/g, "")
  }

  // Extracts a normalized pathname from a full URL (removes domain, query, hash)
  getParsedPath(url: string): string {
    const withoutPrefix = url.replace(URL_PREFIX_REGEX, "")
    const pathOnly = withoutPrefix.split("#")[0].split("?")[0]
    return this.removePathSlashes(pathOnly)
  }

  getInitialRoute(url: string) {
    try {
      const { pathname } = new URL(url, "http://dummy") // Base URL ensures relative paths are handled
      const segments = pathname.replace(/^\/+|\/+$/g, "").split("/")
      return segments.length > 0 && segments[0] ? `${segments[0]}` : ""
    } catch {
      return "/" // Return root if the URL is invalid
    }
  }

  getSlug(path: string): string {
    const segments = path.split("/")
    return segments[1] || ""
  }

  /* ---------------------------------- logic --------------------------------- */
  replaceDom(route: RouteEntry): void {
    this.domContainer.replaceChildren()
    this.domContainer.prepend(route.dom)
    this.attachLinkEvents()
  }

  async prefetchUrl(url: string): Promise<void> {
    if (this.routes[url]) {
      return
    }

    try {
      const response = await fetch(`/${url}`)
      const data = await response.text()

      const parser = new DOMParser()
      const doc = parser.parseFromString(data, "text/html")

      const pageElement = doc.querySelector(".page")

      if (pageElement) {
        // Extract metadata from the fetched document
        const meta = this.extractPageMeta(doc)

        this.routes[url] = {
          title: meta.title || pageElement.id,
          dom: pageElement as HTMLElement,
          meta,
        }

        if (this.pendingPath !== null) {
          this.replaceDom(this.routes[url])
          this.pendingPath = null
        }
      } else {
        console.error("Error fetching or parsing page content:")
      }
    } catch (err) {
      console.error("Error fetching or parsing page content:", err)
    }
  }

  // Sends an event through the emitter but does not handle routing
  push(url: string) {
    if (this._transitioning) {
      return
    }
    this._transitioning = true

    const parsed = this.getParsedPath(url)
    this.onNewRoute.dispatch(parsed)
  }

  /* --------------------------------- events --------------------------------- */
  async onPopState(): Promise<void> {
    const parsedUrl = this.getParsedPath(window.location.pathname)

    if (this.currPath !== parsedUrl) {
      // Restore scroll position if available
      const savedScroll = this.scrollPositions.get(parsedUrl)

      let route = this.routes[parsedUrl]

      // If route not cached, fetch it
      if (!route) {
        await this.prefetchUrl(parsedUrl)
        route = this.routes[parsedUrl]
      }

      if (route) {
        this.replaceDom(route)
        this.updateMetaTags(route.meta)
        this.announcePageChange(route.title)
        this.resetFocus()
      } else {
        // Fallback: hard navigation if fetch failed
        console.warn(`[RouteManager] Failed to load route "${parsedUrl}", falling back to hard navigation`)
        window.location.href = `/${parsedUrl}`
        return
      }

      this.currPath = parsedUrl
      this.onRouteChange.dispatch(parsedUrl)

      // Restore scroll after DOM update
      if (savedScroll !== undefined) {
        requestAnimationFrame(() => window.scrollTo(0, savedScroll))
      }
    }
  }

  onLinkClick(el: HTMLAnchorElement, ev: MouseEvent) {
    const isNewTab =
      ev.ctrlKey || // Ctrl+Click (Windows/Linux)
      ev.metaKey || // Cmd+Click (Mac)
      ev.button === 1 || // Middle mouse click
      el.target === "_blank" // Explicit new tab target

    if (!isNewTab) {
      ev.preventDefault()
      this.push(el.href)
    }
  }

  attachLinkEvents() {
    const linkEls = document.querySelectorAll("a")
    linkEls.forEach((el) => {
      if (el.dataset.hasClickParsed) {
        return
      }
      el.dataset.hasClickParsed = "true"

      // create event listeners
      const isInternallink = el.href.indexOf(window.location.origin) === 0 || el.href.indexOf("/") === 0
      if (isInternallink) {
        // prefetch on mouse enter
        el.addEventListener("mouseenter", () => {
          const parsedUrl = this.getParsedPath(el.href)
          this.prefetchUrl(parsedUrl)
        })

        // click event
        el.addEventListener("click", this.onLinkClick.bind(this, el))
      }
    })
  }

  /* --------------------------------- public --------------------------------- */
  constructor() {
    // setup html
    this.domContainer = document.getElementById("page-container") as HTMLElement

    // setup events
    this.onPopState = this.onPopState.bind(this)
    window.addEventListener("popstate", this.onPopState)

    // setup internal state
    this.currPath = this.getParsedPath(window.location.pathname)
    this._transitioning = true

    // setup links hijacker
    this.attachLinkEvents()
  }

  async navigateTo(url: string): Promise<void> {
    const parsedUrl = this.getParsedPath(url)

    if (this.currPath !== parsedUrl) {
      // Save current scroll position before navigating
      this.saveScrollPosition()

      // update history
      window.history.pushState({ path: parsedUrl }, "", `/${url}`)

      // update dom
      let route = this.routes[parsedUrl]
      if (route) {
        this.replaceDom(route)
        this.pendingPath = null
      } else {
        this.pendingPath = parsedUrl
        await this.prefetchUrl(parsedUrl) // wait for prefetching to finish
        route = this.routes[parsedUrl]
      }

      // Update SEO and accessibility after route is loaded
      if (route) {
        this.updateMetaTags(route.meta)
        this.announcePageChange(route.title)
        this.resetFocus()
      }

      // Scroll to top on new navigation
      window.scrollTo(0, 0)

      // post update
      this.onRouteChange.dispatch(parsedUrl)
      this.currPath = parsedUrl
    }
  }

  completeTransition() {
    this._transitioning = false
  }

  /**
   * Clean up event listeners and resources
   * Call this when destroying the RouteManager instance
   */
  destroy(): void {
    window.removeEventListener("popstate", this.onPopState)

    // Remove aria-live region
    if (this.ariaLiveRegion) {
      this.ariaLiveRegion.remove()
      this.ariaLiveRegion = null
    }

    // Clear cached routes
    this.routes = {}
    this.scrollPositions.clear()

    // Recreate signals to clear all listeners
    this.onNewRoute = new MinSignal()
    this.onRouteChange = new MinSignal()
  }
}
