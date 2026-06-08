import { describe, it, expect, beforeEach } from "vitest"
import { RAFCollection } from "../../src/utils/RAFCollection"

describe("RAFCollection", () => {
  beforeEach(() => {
    RAFCollection.clear()
  })

  describe("add", () => {
    it("should add a callback to the collection", () => {
      const callback = () => {}
      const result = RAFCollection.add(callback)

      expect(result).toBe(true)
      expect(RAFCollection.length).toBe(1)
    })

    it("should prevent duplicate registration", () => {
      const callback = () => {}

      RAFCollection.add(callback)
      const result = RAFCollection.add(callback)

      expect(result).toBe(false)
      expect(RAFCollection.length).toBe(1)
    })

    it("should allow different callbacks", () => {
      const callback1 = () => {}
      const callback2 = () => {}

      RAFCollection.add(callback1)
      RAFCollection.add(callback2)

      expect(RAFCollection.length).toBe(2)
    })
  })

  describe("remove", () => {
    it("should remove a callback from the collection", () => {
      const callback = () => {}
      RAFCollection.add(callback)

      const result = RAFCollection.remove(callback)

      expect(result).toBe(true)
      expect(RAFCollection.length).toBe(0)
    })

    it("should return false when removing non-existent callback", () => {
      const callback = () => {}
      const result = RAFCollection.remove(callback)

      expect(result).toBe(false)
    })

    it("should only remove the specified callback", () => {
      const callback1 = () => {}
      const callback2 = () => {}

      RAFCollection.add(callback1)
      RAFCollection.add(callback2)
      RAFCollection.remove(callback1)

      expect(RAFCollection.length).toBe(1)
      expect(RAFCollection.has(callback2)).toBe(true)
      expect(RAFCollection.has(callback1)).toBe(false)
    })
  })

  describe("has", () => {
    it("should return true for registered callback", () => {
      const callback = () => {}
      RAFCollection.add(callback)

      expect(RAFCollection.has(callback)).toBe(true)
    })

    it("should return false for unregistered callback", () => {
      const callback = () => {}

      expect(RAFCollection.has(callback)).toBe(false)
    })
  })

  describe("clear", () => {
    it("should remove all callbacks", () => {
      RAFCollection.add(() => {})
      RAFCollection.add(() => {})
      RAFCollection.add(() => {})

      RAFCollection.clear()

      expect(RAFCollection.length).toBe(0)
    })
  })

  describe("length", () => {
    it("should return correct count", () => {
      expect(RAFCollection.length).toBe(0)

      RAFCollection.add(() => {})
      expect(RAFCollection.length).toBe(1)

      RAFCollection.add(() => {})
      expect(RAFCollection.length).toBe(2)
    })
  })

  describe("callback execution", () => {
    it("should store callbacks that can be executed with delta", () => {
      const deltas: number[] = []
      const callback = (delta: number) => deltas.push(delta)

      RAFCollection.add(callback)

      // Simulate RAF loop execution
      RAFCollection.rafArray.forEach((v) => v.callback(0.016))

      expect(deltas).toEqual([0.016])
    })

    it("should execute all callbacks in order", () => {
      const order: number[] = []

      RAFCollection.add(() => order.push(1))
      RAFCollection.add(() => order.push(2))
      RAFCollection.add(() => order.push(3))

      RAFCollection.rafArray.forEach((v) => v.callback(0.016))

      expect(order).toEqual([1, 2, 3])
    })

    it("should handle callback removal during iteration safely", () => {
      const executed: string[] = []
      const callback1 = () => executed.push("a")
      const callback2 = () => {
        executed.push("b")
        // Don't remove during actual iteration - that's what filter fixes
      }
      const callback3 = () => executed.push("c")

      RAFCollection.add(callback1)
      RAFCollection.add(callback2)
      RAFCollection.add(callback3)

      // Execute all
      RAFCollection.rafArray.forEach((v) => v.callback(0.016))

      expect(executed).toEqual(["a", "b", "c"])

      // Now remove and execute again
      executed.length = 0
      RAFCollection.remove(callback2)
      RAFCollection.rafArray.forEach((v) => v.callback(0.016))

      expect(executed).toEqual(["a", "c"])
    })
  })
})
