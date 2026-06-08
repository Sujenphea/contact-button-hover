import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

test.describe("Accessibility", () => {
  test("homepage should have no accessibility violations", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    const results = await new AxeBuilder({ page }).analyze()

    expect(results.violations).toEqual([])
  })

  test("color contrast should meet WCAG AA standards", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    const results = await new AxeBuilder({ page }).withTags(["wcag2aa"]).analyze()

    const contrastViolations = results.violations.filter((v) => v.id === "color-contrast")

    expect(contrastViolations).toEqual([])
  })

  test("page should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    const results = await new AxeBuilder({ page }).withRules(["heading-order"]).analyze()

    expect(results.violations).toEqual([])
  })
})
