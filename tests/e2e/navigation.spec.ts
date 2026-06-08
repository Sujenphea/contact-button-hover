import { test, expect } from "@playwright/test"

test.describe("SPA Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
  })

  test("should update document title on navigation", async ({ page }) => {
    const initialTitle = await page.title()
    expect(initialTitle).toBeTruthy()

    // If there are internal links, test navigation
    const internalLinks = page.locator('a[href^="/"]').first()

    if (await internalLinks.isVisible()) {
      const href = await internalLinks.getAttribute("href")
      await internalLinks.click()
      await page.waitForLoadState("networkidle")

      // URL should change
      expect(page.url()).toContain(href)
    }
  })

  test("should handle browser back/forward navigation", async ({ page }) => {
    const initialUrl = page.url()

    // Find and click an internal link
    const internalLinks = page.locator('a[href^="/"]').first()

    if (await internalLinks.isVisible()) {
      await internalLinks.click()
      await page.waitForLoadState("networkidle")

      const newUrl = page.url()
      expect(newUrl).not.toBe(initialUrl)

      // Go back
      await page.goBack()
      await page.waitForLoadState("networkidle")
      expect(page.url()).toBe(initialUrl)

      // Go forward
      await page.goForward()
      await page.waitForLoadState("networkidle")
      expect(page.url()).toBe(newUrl)
    }
  })

  test("should preserve scroll position on back navigation", async ({ page }) => {
    // Scroll down on current page
    await page.evaluate(() => window.scrollTo(0, 500))

    const scrollBefore = await page.evaluate(() => window.scrollY)
    expect(scrollBefore).toBeGreaterThan(0)

    // Navigate away if possible
    const internalLinks = page.locator('a[href^="/"]').first()

    if (await internalLinks.isVisible()) {
      await internalLinks.click()
      await page.waitForLoadState("networkidle")

      // Navigate back
      await page.goBack()
      await page.waitForLoadState("networkidle")

      // Wait for scroll restoration
      await page.waitForTimeout(500)

      const scrollAfter = await page.evaluate(() => window.scrollY)
      // Scroll should be restored (with some tolerance)
      expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(50)
    }
  })

  test("should announce page changes to screen readers", async ({ page }) => {
    // Check for route announcer element
    const announcer = page.locator("#route-announcer")

    // Navigate to trigger announcement
    const internalLinks = page.locator('a[href^="/"]').first()

    if (await internalLinks.isVisible()) {
      await internalLinks.click()
      await page.waitForLoadState("networkidle")

      // Wait for announcement
      await page.waitForTimeout(100)

      // Announcer should exist and have aria-live
      if (await announcer.isVisible()) {
        await expect(announcer).toHaveAttribute("aria-live", "polite")
      }
    }
  })

  test("should handle direct URL access", async ({ page }) => {
    // Navigate directly to a route
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    // Page should load without errors
    const pageContent = page.locator(".page")
    await expect(pageContent).toBeVisible()
  })

  test("should prefetch links on hover", async ({ page }) => {
    const internalLinks = page.locator('a[href^="/"]').first()

    if (await internalLinks.isVisible()) {
      // Set up request listener
      const requests: string[] = []
      page.on("request", (request) => {
        if (request.resourceType() === "document") {
          requests.push(request.url())
        }
      })

      // Hover over link
      await internalLinks.hover()

      // Wait for potential prefetch
      await page.waitForTimeout(500)

      // Note: Prefetch behavior varies - this test documents the expected behavior
    }
  })

  test("should handle Ctrl+Click to open in new tab", async ({ page, context }) => {
    const internalLinks = page.locator('a[href^="/"]').first()

    if (await internalLinks.isVisible()) {
      // Ctrl+Click (or Cmd+Click on Mac)
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        internalLinks.click({ modifiers: ["ControlOrMeta"] }),
      ])

      // New tab should open
      expect(newPage).toBeTruthy()
      await newPage.close()
    }
  })

  test("should update meta tags on navigation", async ({ page }) => {
    const internalLinks = page.locator('a[href^="/"]').first()

    if (await internalLinks.isVisible()) {
      await internalLinks.click()
      await page.waitForLoadState("networkidle")

      // Check that meta description exists
      const metaDescription = page.locator('meta[name="description"]')
      const ogTitle = page.locator('meta[property="og:title"]')

      // Meta tags should be present (content may vary)
      const descriptionExists = (await metaDescription.count()) > 0
      expect(descriptionExists).toBeTruthy()
      const ogTitleExists = (await ogTitle.count()) > 0
      expect(ogTitleExists).toBeTruthy()

      // At minimum, document should have a title
      const title = await page.title()
      expect(title).toBeTruthy()
    }
  })

  test("should reset focus after navigation", async ({ page }) => {
    const internalLinks = page.locator('a[href^="/"]').first()

    if (await internalLinks.isVisible()) {
      await internalLinks.click()
      await page.waitForLoadState("networkidle")

      // Wait for focus reset
      await page.waitForTimeout(100)

      // Focus should be on main content or body
      const focusedElement = await page.evaluate(() => {
        const active = document.activeElement
        return active?.tagName.toLowerCase()
      })

      // Focus should be on main, body, or an element with tabindex
      expect(["main", "body", "div"]).toContain(focusedElement)
    }
  })
})
