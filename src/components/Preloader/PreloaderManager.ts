import gsap from "gsap"
import { preloaderContainerId, preloaderLoaderProgressId } from "./Preloader.astro"
import { Properties } from "../../utils/properties"
import { RAFCollection } from "../../utils/RAFCollection"

export class PreloaderManager {
  // html
  preloaderContainerEl: HTMLElement
  preloaderLoaderProgressEl: HTMLElement

  // variables
  preloaderHidden = false
  percent = { value: 0, smoothValue: 0 }

  /* --------------------------------- animate -------------------------------- */
  animatePreloader(percent: number) {
    this.percent.value = percent
  }

  hidePreloader() {
    RAFCollection.remove(this.update)

    gsap
      .timeline({
        onComplete: () => {
          Properties.loader.onLoadAnimationComplete.dispatch()
        },
      })
      .to(this.preloaderContainerEl, {
        autoAlpha: 0,
        duration: 0.5,
        delay: 0.2,
      })
  }

  update() {
    this.percent.smoothValue += (this.percent.value - this.percent.smoothValue) * 0.1
    this.preloaderLoaderProgressEl.style.transform = `scaleX(${this.percent.smoothValue / 100})`

    // exit
    if (!this.preloaderHidden && this.percent.smoothValue >= 99) {
      this.preloaderHidden = true

      this.hidePreloader()
    }
  }

  /* --------------------------------- public --------------------------------- */
  constructor() {
    this.preloaderContainerEl = document.getElementById(preloaderContainerId) as HTMLElement
    this.preloaderLoaderProgressEl = document.getElementById(preloaderLoaderProgressId) as HTMLElement

    this.update = this.update.bind(this)
    RAFCollection.add(this.update)
  }
}
