declare module "min-signal" {
  /**
   * A lightweight signal/slot (observer) implementation.
   */
  export as namespace MinSignal

  class MinSignal {
    /** Number of times dispatch() has been called. */
    dispatchCount: number

    constructor()

    /**
     * Add a listener.
     * @param fn Callback function invoked on dispatch.
     * @param context `this` binding for the callback.
     * @param priority Higher-priority listeners fire earlier. Defaults to 0.
     * @param args Additional arguments to prepend when dispatching.
     * @returns `false` if fn+context was already registered; otherwise `undefined`.
     */
    add(fn: (...dispatchArgs: any[]) => any, context?: any, priority?: number, ...args: any[]): boolean | undefined

    /**
     * Add a one-time listener (automatically removed after first dispatch).
     */
    addOnce(fn: (...dispatchArgs: any[]) => any, context?: any, priority?: number, ...args: any[]): boolean | undefined

    /**
     * Remove a listener.
     * @param fn Callback function. If omitted, removes all listeners.
     * @param context If provided, only removes listeners matching this context.
     * @returns `true` if at least one listener was removed.
     */
    remove(fn?: (...dispatchArgs: any[]) => any, context?: any): boolean

    /**
     * Dispatch an event to all registered listeners.
     * @param args Arguments to pass as suffix to each listener.
     * @returns The first listener object whose handler returned `false`, if any.
     */
    dispatch(...args: any[]): object | undefined
  }

  export = MinSignal
}
