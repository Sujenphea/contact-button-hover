const _sfc32 =(a: number, b: number, c: number, d: number) => {
  return () => {
    // eslint-disable-next-line no-param-reassign
    a |= 0
    // eslint-disable-next-line no-param-reassign
    b |= 0
    // eslint-disable-next-line no-param-reassign
    c |= 0
    // eslint-disable-next-line no-param-reassign
    d |= 0
    const t = (((a + b) | 0) + d) | 0
    // eslint-disable-next-line no-param-reassign
    d = (d + 1) | 0
    // eslint-disable-next-line no-param-reassign
    a = b ^ (b >>> 9)
    // eslint-disable-next-line no-param-reassign
    b = (c + (c << 3)) | 0
    // eslint-disable-next-line no-param-reassign
    c = (c << 21) | (c >>> 11)
    // eslint-disable-next-line no-param-reassign
    c = (c + t) | 0

    return (t >>> 0) / 4294967296
  }
}

export class MathUtil {
  static PI = Math.PI
  static PI2 = this.PI * 2
  static DEG2RAD = this.PI / 180
  static RAD2DEG = 180 / this.PI

  /* ------------------------------- wrapping ------------------------------- */
  /**
   * Wraps a value within the (min, max) range
   */
  static wrap(value: number, min: number, max: number) {
    const offset = value - min
    const range = max - min

    // value below the min range
    // calculation: minus value from the max value
    if (offset < 0) {
      return ((range - (Math.abs(offset) % range)) % range) + min
    }

    return (offset % range) + min
  }

  /* ------------------------------- fractions ------------------------------- */
  static fract(value: number) {
    return value - Math.floor(value)
  }

  static mod(value: number, divisor: number) {
    return value - divisor * Math.floor(value / divisor)
  }

  /* ------------------------------- clamping ------------------------------- */
  static clamp(value: number, min: number, max: number) {
    if (value < min) {
      return min
    }

    if (value > max) {
      return max
    }

    return value
  }

  /* --------------------------------- steps --------------------------------- */
  /**
   * Calculates the interpolation factor given the boundaries and the current value.
   */
  static linearStep(from: number, to: number, value: number) {
    const result = (value - from) / (to - from)

    return this.clamp(result, 0, 1)
  }

  static step(value: number, edge: number) {
    return value > edge ? 0 : 1
  }

  static smoothstep(value: number, min: number, max: number) {
    const t = this.cInverseMix(min, max, value)

    return t * t * (3 - t * 2)
  }

  /* --------------------------- interpolation (lerp) --------------------------- */
  /**
   * Linear interpolation between two values
   */
  static mix(min: number, max: number, t: number) {
    return min * (1 - t) + max * t
  }

  /**
   * Linear interpolation with clamped interpolation factor
   */
  static cMix(start: number, end: number, t: number) {
    return start + (end - start) * this.clamp(t, 0, 1)
  }

  /* ----------------------- inverse interpolation (lerp) ----------------------- */
  /**
   * Inverse linear interpolation to calculate the interpolation factor
   */
  static inverseMix(from: number, to: number, value: number) {
    return (value - from) / (to - from)
  }

  /**
   * Inverse linear interpolation to calculate the interpolation factor, bounded between 0 and 1
   */
  static cInverseMix(from: number, to: number, value: number) {
    return this.clamp((value - from) / (to - from), 0, 1)
  }

  /* ------------------------------- remapping ------------------------------- */
  /**
   * Remaps a value from one range to another
   */
  static fit(
    value: number,
    fromMin: number,
    fromMax: number,
    toMin: number,
    toMax: number,
    mapFn?: (x: number) => number
  ) {
    let normalisedValue = this.cInverseMix(fromMin, fromMax, value)

    // Optionally apply a custom mapping function
    if (mapFn) {
      normalisedValue = mapFn(normalisedValue)
    }

    // Map the normalized value to the desired output range
    return toMin + normalisedValue * (toMax - toMin)
  }

  static unClampedFit(
    value: number,
    fromMin: number,
    fromMax: number,
    toMin: number,
    toMax: number,
    mapFn?: (x: number) => number
  ) {
    let normalisedValue = this.inverseMix(fromMin, fromMax, value)

    // Optionally apply a custom mapping function
    if (mapFn) {
      normalisedValue = mapFn(normalisedValue)
    }

    // Map the normalized value to the desired output range
    return toMin + normalisedValue * (toMax - toMin)
  }

  /* --------------------------- angle conversion --------------------------- */
  static degToRad(angle: number) {
    return angle * this.DEG2RAD
  }

  static radToDeg(angle: number) {
    return angle * this.RAD2DEG
  }

  /* ----------------------------- random (seeded) ----------------------------- */
  static getSeedRandomFn = (seed: string) => {
    let a = 1779033703
    let b = 3144134277
    let c = 1013904242
    let d = 2773480762
    for (let i = 0, charCode; i < seed.length; i += 1) {
      charCode = seed.charCodeAt(i)
      a = b ^ Math.imul(a ^ charCode, 597399067)
      b = c ^ Math.imul(b ^ charCode, 2869860233)
      c = d ^ Math.imul(c ^ charCode, 951274213)
      d = a ^ Math.imul(d ^ charCode, 2716044179)
    }

    return _sfc32(
      Math.imul(c ^ (a >>> 18), 597399067),
      Math.imul(d ^ (b >>> 22), 2869860233),
      Math.imul(a ^ (c >>> 17), 951274213),
      Math.imul(b ^ (d >>> 19), 2716044179)
    )
  }
}

export function getTextureSizeParticles(count: number = 4, multiplier: number = 1): number {
  return Math.max(Math.ceil(Math.sqrt(count * multiplier) / 4) * 4, 4)
}
