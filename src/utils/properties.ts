import Lenis from "lenis"
import { DomScrollManager } from "../managers/DomScrollManager"
import { RouteManager } from "../managers/RouteManager"
import { Loader } from "./loader"

export class Properties {
  static viewportWidth = 0
  static viewportHeight = 0
  static dpr = Math.min(2, window.devicePixelRatio) ?? 1

  // time
  static time = 0
  static deltaTime = 0

  // loader
  static loader = new Loader()
  static initialLoad = true

  // managers
  static domScrollManager: DomScrollManager
  static routeManager: RouteManager
  static lenis: Lenis
}
