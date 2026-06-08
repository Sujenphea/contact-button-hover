import { DetectUA } from "detect-ua"

const detectUA = new DetectUA()
const browserName = (!(typeof detectUA.browser === "boolean") && detectUA.browser.name) || ""
export class Browser {
  static isMobile = detectUA.isMobile || detectUA.isTablet

  static isDesktop = detectUA.isDesktop

  static device = this.isMobile ? "mobile" : "desktop"

  static isAndroid = !!detectUA.isAndroid

  static isIOS = !!detectUA.isiOS

  static isMacOS = !!detectUA.isMacOS

  static isWindows = !(typeof detectUA.isWindows === "boolean") && detectUA.isWindows.version !== null

  static isLinux = () => {
    const userAgent = (navigator.userAgent || navigator.vendor).toLowerCase()
    return userAgent.indexOf("linux") !== -1
  }

  static ua = () => {
    const userAgent = (navigator.userAgent || navigator.vendor).toLowerCase()
    return userAgent
  }

  static isEdge = browserName === "Microsoft Edge"

  static isIE = browserName === "Internet Explorer"

  static isFirefox = browserName === "Firefox"

  static isChrome = browserName === "Chrome"

  static isOpera = browserName === "Opera"

  static isSafari = browserName === "Safari"

  static isSupportMSAA = () => {
    const userAgent = (navigator.userAgent || navigator.vendor).toLowerCase()
    return !userAgent.match("version/15.4 ")
  }

  // static isSupportOgg = !!audioElem.canPlayType("audio/ogg")

  static isRetina = () => window.devicePixelRatio && window.devicePixelRatio >= 1.5

  static getDevicePixelRatio = () => window.devicePixelRatio || 1

  static cpuCoreCount = () => navigator.hardwareConcurrency || 1

  static getBaseUrl = () => document.location.origin

  static isIFrame = () => window.self !== window.top
}
