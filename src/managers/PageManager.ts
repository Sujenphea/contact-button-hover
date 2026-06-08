import { Properties } from "../utils/properties"

/**
 * Interface for page-specific managers that need lifecycle management
 */
export type IPageManager = {
  /** Called when the page becomes active */
  init?(): void
  /** Called every frame if registered with RAF */
  update?(delta: number): void
  /** Called on window resize */
  resize?(): void
  /** Called when the page is about to be deactivated - cleanup resources */
  destroy(): void
}

/**
 * Factory function type for creating page managers
 */
type PageManagerFactory = () => IPageManager | IPageManager[] | null

/**
 * Registry entry for a page's managers
 */
type PageEntry = {
  factory: PageManagerFactory
  instances: IPageManager[]
}

/**
 * Manages page-specific managers, creating them on route entry and destroying on route exit
 */
export class PageManagerRegistry {
  private pages = new Map<string, PageEntry>()
  private currentRoute: string | null = null
  private boundOnRouteChange: (route: string) => void

  constructor() {
    this.boundOnRouteChange = this.onRouteChange.bind(this)
  }

  /**
   * Register a factory for a specific route
   * @param route - Route path (e.g., "", "about", "games/tictactoe")
   * @param factory - Function that creates the manager(s) for this route
   */
  register(route: string, factory: PageManagerFactory): void {
    this.pages.set(route, {
      factory,
      instances: [],
    })
  }

  /**
   * Unregister a route
   * @param route - Route path to unregister
   */
  unregister(route: string): void {
    const entry = this.pages.get(route)
    if (entry) {
      this.destroyManagers(entry)
      this.pages.delete(route)
    }
  }

  /**
   * Initialize the registry and start listening to route changes
   */
  init(): void {
    Properties.routeManager.onRouteChange.add(this.boundOnRouteChange)

    // Initialize managers for current route
    const currentRoute = Properties.routeManager.currPath
    this.activateRoute(currentRoute)
  }

  /**
   * Handle route change - destroy old managers, create new ones
   */
  private onRouteChange(route: string): void {
    if (this.currentRoute === route) return

    // Destroy managers for previous route
    if (this.currentRoute !== null) {
      const prevEntry = this.pages.get(this.currentRoute)
      if (prevEntry) {
        this.destroyManagers(prevEntry)
      }
    }

    // Activate new route
    this.activateRoute(route)
  }

  /**
   * Activate managers for a route
   */
  private activateRoute(route: string): void {
    this.currentRoute = route
    const entry = this.pages.get(route)

    if (entry) {
      this.createManagers(entry)
    }
  }

  /**
   * Create and initialize managers from factory
   */
  private createManagers(entry: PageEntry): void {
    const result = entry.factory()

    if (result === null) return

    const managers = Array.isArray(result) ? result : [result]
    entry.instances = managers

    // Initialize all managers
    managers.forEach((manager) => {
      manager.init?.()
    })
  }

  /**
   * Destroy all managers for an entry
   */
  private destroyManagers(entry: PageEntry): void {
    entry.instances.forEach((manager) => {
      manager.destroy()
    })
    entry.instances = []
  }

  /**
   * Call resize on all active managers
   */
  resize(): void {
    if (this.currentRoute === null) return

    const entry = this.pages.get(this.currentRoute)
    entry?.instances.forEach((manager) => {
      manager.resize?.()
    })
  }

  /**
   * Call update on all active managers (for RAF integration)
   */
  update(delta: number): void {
    if (this.currentRoute === null) return

    const entry = this.pages.get(this.currentRoute)
    entry?.instances.forEach((manager) => {
      manager.update?.(delta)
    })
  }

  /**
   * Get current active managers
   */
  getActiveManagers(): IPageManager[] {
    if (this.currentRoute === null) return []
    return this.pages.get(this.currentRoute)?.instances ?? []
  }

  /**
   * Clean up the registry
   */
  destroy(): void {
    Properties.routeManager.onRouteChange.remove(this.boundOnRouteChange)

    // Destroy all active managers
    this.pages.forEach((entry) => {
      this.destroyManagers(entry)
    })
    this.pages.clear()
    this.currentRoute = null
  }
}

/**
 * Singleton instance for global access
 */
export const pageManagerRegistry = new PageManagerRegistry()
