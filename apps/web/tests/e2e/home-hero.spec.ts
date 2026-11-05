import { expect, test } from '@playwright/test'

const QUOTE = '爱自己，是终身浪漫的开始。'

test.describe('首页打字机', () => {
  test('正常动效的信标与箭头启用，点击离开首屏后暂停', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.route(/\/home\/(hls\/|home-vp9\.webm)/, (route) => route.abort())
    await page.goto('/#/Home')
    await expect(page.locator('#global-loading')).toHaveCount(0)
    const prompt = page.getByRole('button', { name: '滑动查看文章' })
    await expect(page.locator('.scroll-chevron__first')).toHaveCSS('animation-name', 'scroll-chevron-flow')
    const beacon = await page.locator('.scroll-beacon').evaluate((element) => getComputedStyle(element, '::after').animationName)
    expect(beacon).toBe('scroll-beacon-pulse')
    await prompt.click()
    await expect(page.locator('.home-archive-heading__title')).toBeInViewport()
    await expect(page.locator('.scroll-indicator')).toBeDisabled()
    await expect(page.locator('.scroll-chevron__first')).toHaveCSS('animation-play-state', 'paused')
  })

  test('滚动信标居中，键盘激活到阅读区，隐藏后不再接收焦点', async ({ page }) => {
    await page.goto('/#/Home')
    await expect(page.locator('#global-loading')).toHaveCount(0)
    const prompt = page.getByRole('button', { name: '滑动查看文章' })
    await prompt.focus()
    await expect(prompt).toBeFocused()
    const focus = await prompt.evaluate((element) => ({
      outline: getComputedStyle(element).outlineStyle,
      width: getComputedStyle(element).outlineWidth,
    }))
    expect(focus.outline).toBe('solid')
    expect(focus.width).toBe('2px')
    await page.keyboard.press('Enter')
    await expect(page.locator('.home-archive-heading__title')).toBeInViewport()
    await expect(page.locator('.scroll-indicator')).toBeDisabled()
    await expect(page.locator('.scroll-indicator')).toHaveAttribute('aria-hidden', 'true')
    const state = await page.locator('.scroll-indicator').evaluate((element) => ({
      animation: getComputedStyle(element.querySelector('.scroll-chevron__first')!).animationName,
      transform: getComputedStyle(element.querySelector('.scroll-chevron__first')!).transform,
    }))
    expect(state).toEqual({ animation: 'none', transform: 'none' })
  })

  test('Loading 揭开后逐字输出，完成前后布局稳定', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.route(/\/home\/(hls\/|home-vp9\.webm)/, (route) => route.abort())
    await page.goto('/#/Home', { waitUntil: 'domcontentloaded' })

    const hero = page.locator('.home-panel')
    const quote = page.locator('.home-quote')
    const output = page.locator('.home-quote-text')
    await expect(page.locator('#global-loading')).toHaveCount(0)
    await expect(hero).toHaveAttribute('data-entrance-ready', 'true')
    await expect(output).toHaveText('')
    await expect(quote).toHaveAttribute('aria-label', QUOTE)
    const initialBox = await quote.boundingBox()
    expect(initialBox).not.toBeNull()

    await expect.poll(async () => (await output.textContent())?.length ?? 0).toBeGreaterThan(0)
    const partial = await output.textContent()
    expect(QUOTE.startsWith(partial ?? '')).toBe(true)
    expect(partial!.length).toBeLessThan(QUOTE.length)
    await expect(output).toHaveText(QUOTE)
    await expect(quote).toHaveAttribute('data-complete', 'true')
    const finalBox = await quote.boundingBox()
    expect(finalBox).not.toBeNull()
    expect(Math.abs(finalBox!.height - initialBox!.height)).toBeLessThan(1)
    expect(Math.abs(finalBox!.y - initialBox!.y)).toBeLessThan(1)
    expect(finalBox!.x + finalBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
    const caret = await output.evaluate((element) => {
      const style = getComputedStyle(element, '::after')
      return { animation: style.animationName, opacity: style.opacity }
    })
    expect(caret).toEqual({ animation: 'none', opacity: '0' })
  })

  test('减弱动效直接显示全文，且没有光标闪烁或视频', async ({ page }) => {
    await page.goto('/#/Home')
    await expect(page.locator('#global-loading')).toHaveCount(0)
    await expect(page.locator('.home-quote-text')).toHaveText(QUOTE)
    await expect(page.locator('.home-quote')).toHaveAttribute('data-complete', 'true')
    await expect(page.locator('.home-bg__video')).toHaveCount(0)
    const style = await page.locator('.home-quote-text').evaluate((element) => ({
      animation: getComputedStyle(element, '::after').animationName,
      opacity: getComputedStyle(element, '::after').opacity,
    }))
    expect(style).toEqual({ animation: 'none', opacity: '0' })
  })

  test('播放期间切换减弱动效会立即显示全文，返回首页无 Loading 时仍可起播', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.route(/\/home\/(hls\/|home-vp9\.webm)/, (route) => route.abort())
    await page.goto('/#/Home')
    await expect(page.locator('#global-loading')).toHaveCount(0)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(page.locator('.home-quote-text')).toHaveText(QUOTE)
    await expect(page.locator('.home-quote')).toHaveAttribute('data-complete', 'true')

    const informationLink = page.getByRole('link', { name: 'INFORMATION 介绍' })
    if (!await informationLink.isVisible()) {
      await page.getByRole('button', { name: '打开导航菜单' }).click()
    }
    await informationLink.click()
    await expect(page).toHaveURL(/#\/Information$/)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.getByRole('link', { name: '娄宿三', exact: true }).click()
    await expect(page.locator('.home-panel')).toHaveAttribute('data-entrance-ready', 'true')
    await expect(page.locator('#global-loading')).toHaveCount(0)
    await expect(page.locator('.home-quote-text')).toHaveText(QUOTE)
  })
})
