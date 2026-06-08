type RAFCallback = (delta: number) => void

export class RAFCollection {
  static rafArray: { callback: RAFCallback }[] = []

  /**
   * Add a callback to the RAF loop.
   * Prevents duplicate registration of the same callback.
   * @param callback - Function to call each frame with delta time
   * @returns true if callback was added, false if already registered
   */
  static add(callback: RAFCallback): boolean {
    // Prevent duplicate registration
    if (this.has(callback)) {
      return false
    }
    this.rafArray.push({ callback })
    return true
  }

  /**
   * Remove a callback from the RAF loop.
   * @param callback - Function to remove
   * @returns true if callback was removed, false if not found
   */
  static remove(callback: RAFCallback): boolean {
    const initialLength = this.rafArray.length
    this.rafArray = this.rafArray.filter((v) => v.callback !== callback)
    return this.rafArray.length < initialLength
  }

  /**
   * Check if a callback is already registered.
   * @param callback - Function to check
   */
  static has(callback: RAFCallback): boolean {
    return this.rafArray.some((v) => v.callback === callback)
  }

  /**
   * Remove all callbacks from the RAF loop.
   */
  static clear(): void {
    this.rafArray = []
  }

  /**
   * Get the number of registered callbacks.
   */
  static get length(): number {
    return this.rafArray.length
  }
}
