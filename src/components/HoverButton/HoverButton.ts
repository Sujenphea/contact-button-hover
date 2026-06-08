import { gsap } from "gsap"
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin"
import { Properties } from "../../utils/properties"
import { getRandomId, queryOrThrow, queryAllOrThrow } from "../../utils/utils"

gsap.registerPlugin(MorphSVGPlugin)

const BASE_RADIUS = 16 // px — resting circle radius (half of the old w-8)
const HOVER_SCALE = 3 // hover circle = BASE_RADIUS * HOVER_SCALE
const PANEL_RADIUS = 10 // panel corner radius
const HOVER_DURATION = 0.4
const MORPH_DURATION = 0.6
const HOVER_EASE = "power3.out"
const MORPH_EASE = "power2.out"

/**
 * A single hover button instance. Owns one `.js-hover-button` root and every
 * `.js-*` element scoped beneath it, plus its event listeners and tweens.
 */
export class HoverButton {
  // html
  root: HTMLElement
  button: HTMLElement
  text: HTMLElement
  target: HTMLElement
  svg: SVGSVGElement
  shape: SVGPathElement
  clip: SVGPathElement
  mask: HTMLElement
  maskText: HTMLElement
  underlines: HTMLElement[]

  // states
  isOpen = false
  isHovering = false

  restingD = ""
  hoverD = ""
  panelD = ""

  // pre-bound handlers (stored so they can be removed on destroy)
  private boundHoverIn = this.onHoverIn.bind(this)
  private boundHoverOut = this.onHoverOut.bind(this)
  private boundClick = this.onClick.bind(this)

  /* ---------------------------------- shape --------------------------------- */
  // Every state is one rounded-rect path (a circle is just a square with
  // r = side / 2), so the command structure matches and morphs stay clean.
  rrect(x: number, y: number, w: number, h: number, _r: number) {
    const r = Math.min(_r, w / 2, h / 2)
    const x2 = x + w
    const y2 = y + h

    return [
      `M${x + r},${y}`,
      `H${x2 - r}`,
      `A${r},${r} 0 0 1 ${x2},${y + r}`,
      `V${y2 - r}`,
      `A${r},${r} 0 0 1 ${x2 - r},${y2}`,
      `H${x + r}`,
      `A${r},${r} 0 0 1 ${x},${y2 - r}`,
      `V${y + r}`,
      `A${r},${r} 0 0 1 ${x + r},${y}`,
      "Z",
    ].join(" ")
  }

  circleAt(cx: number, cy: number, r: number) {
    return this.rrect(cx - r, cy - r, r * 2, r * 2, r)
  }

  computeShapes() {
    const b = this.button.getBoundingClientRect()
    const cx = b.left + BASE_RADIUS // circle sits in the button's left padding
    const cy = b.top + b.height / 2
    this.restingD = this.circleAt(cx, cy, BASE_RADIUS)
    this.hoverD = this.circleAt(cx, cy, BASE_RADIUS * HOVER_SCALE)

    const t = this.target.getBoundingClientRect()
    this.panelD = this.rrect(t.left, t.top, t.width, t.height, PANEL_RADIUS)
  }

  currentD() {
    return this.isOpen ? this.panelD : this.isHovering ? this.hoverD : this.restingD
  }

  /* -------------------------------- animation ------------------------------- */
  morphTo(d: string, duration: number, ease: string) {
    gsap.to([this.shape, this.clip], { morphSVG: d, duration, ease, overwrite: true })
  }

  showUnderlines(show: boolean) {
    gsap.to(this.underlines, {
      scaleX: show ? 1 : 0,
      duration: HOVER_DURATION,
      ease: HOVER_EASE,
      overwrite: true,
    })
  }

  /* --------------------------------- layout --------------------------------- */
  positionMask() {
    const r = this.text.getBoundingClientRect()
    gsap.set(this.maskText, { left: r.left, top: r.top })
  }

  layout() {
    const w = window.innerWidth
    const h = window.innerHeight
    this.svg.setAttribute("viewBox", `0 0 ${w} ${h}`)
    this.svg.setAttribute("width", `${w}`)
    this.svg.setAttribute("height", `${h}`)
    this.computeShapes()
    this.positionMask()
    gsap.set([this.shape, this.clip], { attr: { d: this.currentD() } }) // snap to current state
  }

  /* --------------------------------- events --------------------------------- */
  onHoverIn() {
    this.isHovering = true
    if (this.isOpen) return

    this.morphTo(this.hoverD, HOVER_DURATION - 0.1, HOVER_EASE)
    this.showUnderlines(true)
  }

  onHoverOut() {
    this.isHovering = false
    if (this.isOpen) return

    this.morphTo(this.restingD, HOVER_DURATION, HOVER_EASE)
    this.showUnderlines(false)
  }

  onClick() {
    this.isOpen = !this.isOpen
    if (this.isOpen) {
      this.morphTo(this.panelD, MORPH_DURATION, MORPH_EASE)
      this.showUnderlines(true) // retain the text's hover state while open
    } else {
      this.morphTo(this.isHovering ? this.hoverD : this.restingD, MORPH_DURATION, MORPH_EASE)
      this.showUnderlines(this.isHovering)
    }
  }

  /* ---------------------------------- main ---------------------------------- */
  constructor(root: HTMLElement) {
    this.root = root
    this.button = queryOrThrow(".js-button", root)
    this.text = queryOrThrow(".js-text", root)
    this.target = queryOrThrow(".js-target", root)
    this.svg = queryOrThrow<SVGSVGElement>(".js-svg", root)
    this.shape = queryOrThrow<SVGPathElement>(".js-shape", root)
    this.clip = queryOrThrow<SVGPathElement>(".js-clip", root)
    this.mask = queryOrThrow(".js-mask", root)
    this.maskText = queryOrThrow(".js-mask-text", root)
    this.underlines = Array.from(queryAllOrThrow(".js-underline", root))

    // give this instance a unique clip id so multiple buttons don't collide
    const clipId = `shapeClip-${getRandomId()}`
    const clipPath = this.clip.parentElement as unknown as SVGClipPathElement
    clipPath.id = clipId
    this.mask.style.clipPath = `url(#${clipId})`

    // setup events
    this.button.addEventListener("mouseenter", this.boundHoverIn)
    this.button.addEventListener("mouseleave", this.boundHoverOut)
    this.button.addEventListener("click", this.boundClick)

    // post update
    gsap.set(this.underlines, { scaleX: 0, transformOrigin: "left center" })
    this.layout()
  }

  resize() {
    this.layout()
  }

  /**
   * Tear down listeners and tweens. Called when this button's root leaves the DOM.
   */
  destroy() {
    this.button.removeEventListener("mouseenter", this.boundHoverIn)
    this.button.removeEventListener("mouseleave", this.boundHoverOut)
    this.button.removeEventListener("click", this.boundClick)

    gsap.killTweensOf([this.shape, this.clip, this.maskText, ...this.underlines])
  }
}

/**
 * Tracks every {@link HoverButton} on the page. On each route transition it
 * reconciles its set against the live `.js-hover-button` roots — destroying
 * instances whose root disappeared and initialising instances for new roots.
 */
export class HoverButtonManager {
  private instances = new Map<HTMLElement, HoverButton>()
  private boundReconcile = this.reconcile.bind(this)

  constructor() {
    Properties.routeManager.onRouteChange.add(this.boundReconcile)

    // pick up whatever is on the page for the initial route
    this.reconcile()
  }

  /**
   * Diff the tracked instances against the roots currently in the DOM.
   */
  private reconcile() {
    const roots = Array.from(document.querySelectorAll<HTMLElement>(".js-hover-button"))
    const rootSet = new Set(roots)

    // destroy instances whose root has left the DOM
    this.instances.forEach((instance, root) => {
      if (!rootSet.has(root)) {
        instance.destroy()
        this.instances.delete(root)
      }
    })

    // init instances for newly appeared roots
    roots.forEach((root) => {
      if (!this.instances.has(root)) {
        this.instances.set(root, new HoverButton(root))
      }
    })
  }

  resize() {
    this.instances.forEach((instance) => instance.resize())
  }

  destroy() {
    Properties.routeManager.onRouteChange.remove(this.boundReconcile)

    this.instances.forEach((instance) => instance.destroy())
    this.instances.clear()
  }
}
