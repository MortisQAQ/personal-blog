import { expect, test, type Page } from '@playwright/test'

// 字体与首屏视频都保持 pending：旧实现会把 Loading 拖到超时才揭开，
// 新实现只等路由页面就绪，资源未返回也应立即进入过渡动画。
const HOLD_FONT = /(?:\/fonts\/SmileySans|cdn\.jsdmirror\.com\/.*(?:SmileySans|oswald))/
const HOLD_HERO_MEDIA = /\/home\/(hls\/|home-vp9\.webm)/

async function holdFontsAndHeroMedia(page: Page) {
  await page.route(HOLD_FONT, () => undefined)
  await page.route(HOLD_HERO_MEDIA, () => undefined)
}

async function measureLoadingRemoval(page: Page) {
  const startedAt = Date.now()
  await expect(page.locator('#global-loading')).toHaveCount(0)
  return Date.now() - startedAt
}

test.describe('首屏 Loading 只等页面就绪', () => {
  test('字体与视频未返回时，首页就绪即揭开并进入入场动画', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await holdFontsAndHeroMedia(page)
    await page.goto('/#/Home', { waitUntil: 'domcontentloaded' })
    await page.locator('.home-panel').waitFor({ state: 'attached' })

    const removalLatency = await measureLoadingRemoval(page)
    expect(removalLatency, '页面已挂载，Loading 不应再等字体或视频超时').toBeLessThan(1500)
    expect(await page.evaluate(() => document.fonts.check('1rem SmileySans'))).toBe(false)
    await expect(page.locator('.home-panel')).toHaveAttribute('data-entrance-ready', 'true')
    await expect(page.locator('.home-title')).toBeVisible()
    await expect(page.locator('.home-bg__video')).toHaveCount(1)
    await expect(page.locator('.home-bg__video')).not.toHaveClass(/is-visible/)
  })

  test('字体未返回时，作品页就绪即揭开', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await holdFontsAndHeroMedia(page)
    await page.goto('/#/Portfolio', { waitUntil: 'domcontentloaded' })
    await page.locator('.portfolio-stage').waitFor({ state: 'attached' })

    const removalLatency = await measureLoadingRemoval(page)
    expect(removalLatency, '页面已挂载，Loading 不应再等字体超时').toBeLessThan(1500)
    expect(await page.evaluate(() => document.fonts.check('1rem SmileySans'))).toBe(false)
    await expect(page.locator('.portfolio-stage')).toHaveAttribute('data-phase', 'idle')
    await expect(page.locator('.portfolio-card.is-active')).toBeVisible()
  })
})
