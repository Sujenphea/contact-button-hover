import MinSignal from "min-signal"

/** Default timeout for asset loading (10 seconds) */
const DEFAULT_TIMEOUT_MS = 10000

export class Loader {
  // loaded
  videos: { [key: string]: Promise<HTMLVideoElement> } = {}

  // functionality
  promisesToLoad: Promise<unknown>[] = []
  loaded: Promise<boolean> | boolean = false

  // props
  el?: HTMLElement

  // configuration
  private timeoutMs: number = DEFAULT_TIMEOUT_MS

  // emitters
  onProgress = new MinSignal()
  onBeforeResolve = new MinSignal()
  onAfterResolve = new MinSignal()
  onLoadAnimationComplete = new MinSignal()
  onTimeout = new MinSignal() // Fired when an asset times out

  // browser detection
  private isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

  /* --------------------------------- timeout -------------------------------- */
  /**
   * Set the timeout duration for asset loading
   * @param ms - Timeout in milliseconds (default: 10000)
   */
  setTimeout(ms: number): void {
    this.timeoutMs = ms
  }

  /**
   * Wrap a promise with a timeout
   * @param promise - Promise to wrap
   * @param context - Optional context for logging (e.g., element src)
   * @returns Promise that resolves with the original value or rejects on timeout
   */
  private withTimeout<T>(promise: Promise<T>, context?: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const message = context ? `Asset load timeout: ${context}` : "Asset load timeout"
        console.warn(`[Loader] ${message}`)
        this.onTimeout.dispatch({ context, timeoutMs: this.timeoutMs })
        // Resolve instead of reject to not block other assets
        resolve(undefined as T)
      }, this.timeoutMs)

      promise
        .then((value) => {
          clearTimeout(timeoutId)
          resolve(value)
        })
        .catch((err) => {
          clearTimeout(timeoutId)
          reject(err)
        })
    })
  }

  /* --------------------------------- private -------------------------------- */
  private add(promise: Promise<unknown>) {
    this.promisesToLoad.push(promise)
    return promise
  }

  private createVideoLoadPromise<T>(el: HTMLVideoElement, resolveValue: T | (() => T)): Promise<T> {
    return new Promise<T>((resolve) => {
      const prevIsMuted = el.muted
      const getValue = () => (typeof resolveValue === "function" ? (resolveValue as () => T)() : resolveValue)

      // set initial properties
      el.muted = true
      el.crossOrigin = ""

      el.addEventListener(
        "loadeddata",
        () => {
          if (el.currentTime < 0.01) {
            el.currentTime = 0.05
          }

          el.addEventListener(
            "timeupdate",
            () => {
              resolve(getValue())
              el.currentTime = 0.05
              el.muted = prevIsMuted
            },
            { once: true }
          )
        },
        { once: true }
      )
      el.addEventListener("error", () => resolve(getValue()))

      // load second time to get thumbnail for ios
      el.addEventListener(
        "loadedmetadata",
        () => {
          if (this.isSafari) {
            el.load()
          }
        },
        { once: true }
      )

      // handle safari
      if (this.isSafari) {
        el.addEventListener("suspend", () => {
          window.addEventListener(
            "click",
            () => {
              if (el.currentTime < 0.01) {
                el.currentTime = 0.05
              }
              el.play()
            },
            { once: true }
          )
          resolve(getValue())
        })
      }

      // add data
      if (el.src === "" && el.dataset.src) {
        el.src = el.dataset.src
      }

      // start load
      el.load()
      el.play().catch((e) => {
        console.error(e)
        resolve(getValue())
      })
    })
  }

  /* --------------------------------- public --------------------------------- */
  addImage(el: HTMLImageElement) {
    const imagePromise = new Promise((resolve) => {
      if (el.complete && el.naturalWidth !== 0) {
        resolve(el)
      } else {
        el.addEventListener("load", () => resolve(el))
        el.addEventListener("error", () => resolve(el))
      }
    })

    return this.add(this.withTimeout(imagePromise, el.src || el.dataset.src))
  }

  addVideo(el: HTMLVideoElement) {
    el.muted = true
    el.loop = true
    el.playsInline = true
    el.autoplay = true

    const videoPromise = this.createVideoLoadPromise(el, undefined as void)
    this.add(this.withTimeout(videoPromise, el.src || el.dataset.src))
  }

  // uses addImage + addVideo
  addMedia() {
    const imgs = this.el?.querySelectorAll('img:not([lazy="full"])') ?? []
    for (let i = 0; i < imgs.length; i += 1) {
      this.addImage(imgs[i] as HTMLImageElement)
    }

    const videos = this.el?.querySelectorAll("video") ?? []
    for (let i = 0; i < videos.length; i += 1) {
      this.addVideo(videos[i] as HTMLVideoElement)
    }
  }

  addFonts() {
    if (document.fonts) {
      this.add(document.fonts.ready)
    }
  }

  progressCallback(progress: number) {
    this.onProgress.dispatch(progress)
  }

  reset() {
    this.promisesToLoad = []
  }

  /* --------------------------------- public --------------------------------- */
  load(el: HTMLElement | null = document.body) {
    this.el = el ?? document.body
    this.addMedia()
    this.addFonts()

    let completed = 0
    for (let i = 0; i < this.promisesToLoad.length; i += 1) {
      this.promisesToLoad[i].then(() => {
        completed += 1
        this.progressCallback((100 * completed) / this.promisesToLoad.length)
      })
    }

    this.loaded = new Promise<boolean>((resolve) => {
      Promise.all(this.promisesToLoad).then(() => {
        this.reset()

        this.onBeforeResolve.dispatch()
        resolve(true)
        this.onAfterResolve.dispatch()
      })
    })

    return this.loaded
  }

  loadVideo(el: HTMLVideoElement) {
    if (this.videos[el.src] !== undefined) {
      return this.videos[el.src]
    }

    el.muted = true
    el.loop = true
    el.playsInline = true
    el.autoplay = true

    const videoPromise = this.createVideoLoadPromise(el, () => el)
    this.videos[el.src] = this.add(
      this.withTimeout(videoPromise, el.src || el.dataset.src)
    ) as Promise<HTMLVideoElement>

    return this.videos[el.src]
  }

  /**
   * Clean up and reset the loader
   */
  destroy(): void {
    this.reset()
    this.videos = {}
    this.onProgress = new MinSignal()
    this.onBeforeResolve = new MinSignal()
    this.onAfterResolve = new MinSignal()
    this.onLoadAnimationComplete = new MinSignal()
    this.onTimeout = new MinSignal()
  }
}
