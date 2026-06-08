import Lenis from "lenis"
import { Properties } from "../utils/properties"
import { RAFCollection } from "../utils/RAFCollection"
import { DomScrollManager } from "./DomScrollManager"
import { PreloaderManager } from "../components/Preloader/PreloaderManager"
import { RouteManager } from "./RouteManager"
import { pageManagerRegistry } from "./PageManager"

class AppManager {
  // components
  preloaderManager: PreloaderManager

  // variables
  size = { width: 0, height: 0 }
  dateTime = performance.now()
  scrollCleanupCounter = 0

  /* ---------------------------------- utils --------------------------------- */
  onPushRoute(url: string) {
    Properties.routeManager.navigateTo(url)
    Properties.routeManager.completeTransition()
  }

  onInitialAssetsLoaded() {}

  animateInContent() {
    Properties.routeManager.completeTransition()
  }

  onProgress(percent: number) {
    this.preloaderManager.animatePreloader(percent)
  }

  /* --------------------------------- public --------------------------------- */
  resize() {
    const sizerEl = document.getElementById("sizer")
    if (!sizerEl) {
      return
    }

    const sizerBounds = sizerEl.getBoundingClientRect()
    const newWidth = sizerBounds.width
    const newHeight = sizerBounds.height

    // update
    if (this.size.width !== newWidth || this.size.height !== newHeight) {
      this.size.width = newWidth
      this.size.height = newHeight

      // update viewport size
      Properties.viewportWidth = newWidth
      Properties.viewportHeight = newHeight

      Properties.lenis?.resize()
      Properties.domScrollManager?.resize()
      pageManagerRegistry.resize()
    }
  }

  update() {
    window.requestAnimationFrame(this.boundUpdate)

    // get time
    const currDateTime = performance.now()
    let delta = (currDateTime - this.dateTime) / 1e3
    this.dateTime = currDateTime
    delta = Math.min(delta, 1 / 20)

    // update uniforms
    Properties.deltaTime = delta
    Properties.time += delta
    Properties.lenis?.raf(Properties.time * 1000)
    RAFCollection.rafArray.forEach((v) => v.callback(Properties.deltaTime))
  }

  // Pre-bound methods to avoid creating new functions
  private boundUpdate = this.update.bind(this)
  private boundResize = this.resize.bind(this)

  constructor() {
    // Initialize scroll
    Properties.lenis = new Lenis({
      autoResize: false,
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
    })
    Properties.domScrollManager = new DomScrollManager()
    Properties.lenis.on("scroll", () => {
      // Cleanup every 100 scroll events instead of random
      this.scrollCleanupCounter++
      if (this.scrollCleanupCounter >= 100) {
        this.scrollCleanupCounter = 0
        Properties.domScrollManager.cleanup()
      }
    })

    // Initialize routing
    Properties.routeManager = new RouteManager()
    Properties.routeManager.onNewRoute.add(this.onPushRoute.bind(this))

    // Register page managers
    // pageManagerRegistry.register("", () => new TicTacToeManager())
    pageManagerRegistry.init()

    // Initialize preloader
    this.preloaderManager = new PreloaderManager()
    Properties.loader.onBeforeResolve.addOnce(this.onInitialAssetsLoaded.bind(this))
    Properties.loader.onLoadAnimationComplete.addOnce(this.animateInContent.bind(this))
    Properties.loader.onProgress.add(this.onProgress.bind(this))
    Properties.loader.load()

    // Start update loop and resize handling
    this.update()
    this.resize()
    window.addEventListener("resize", this.boundResize)
  }

  /**
   * Clean up all resources and event listeners.
   * Call this when destroying the application.
   */
  destroy(): void {
    // Remove event listeners
    window.removeEventListener("resize", this.boundResize)

    // Stop RAF loop by not requesting next frame
    // (boundUpdate won't be called after this)

    // Clean up managers
    pageManagerRegistry.destroy()
    Properties.routeManager?.destroy()
    Properties.domScrollManager?.destroy()
    Properties.lenis?.destroy()
    Properties.loader?.destroy()

    // Clear RAF collection
    RAFCollection.clear()

    // Reset Properties
    Properties.time = 0
    Properties.deltaTime = 0
    Properties.viewportWidth = 0
    Properties.viewportHeight = 0
  }
}

export const appManager = new AppManager()
