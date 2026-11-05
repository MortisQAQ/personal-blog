import { expect, test } from '@playwright/test'
import { siteProfile } from '../../src/config/siteProfile'

test.describe('博客核心体验', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/Home')
    await expect(
      page.getByRole('region', { name: '博客内容', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('searchbox', { name: '搜索文章' }),
    ).toBeVisible()
  })

  test('缺少封面时不渲染文章图片区域', async ({ page }) => {
    await expect(page.locator('.featured-article').first()).toBeVisible()
    await expect(page.locator('.featured-article__cover')).toHaveCount(0)
    await expect(page.locator('.blog-sidebar--right .image-card')).toHaveCount(0)
  })

  test('搜索只展示匹配文章', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: '搜索文章' })
    await search.fill('SSE')

    await expect(
      page.getByRole('button', { name: /Server-Sent Events/ }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /抽象是什么/ }),
    ).toHaveCount(0)
  })

  test('点击卡片进入独立文章页，且文章目录点击不会破坏 Hash Router', async ({
    page,
  }, testInfo) => {
    // 已知问题：ScrollIndicator 在移动端为 position: fixed 居中悬浮（z-index 10），
    // 会盖住文章卡片，点击被信标按钮吃掉导致 URL 不变。修复遮挡后移除本跳过。
    test.fixme(
      testInfo.project.name === 'mobile-chromium',
      'ScrollIndicator 移动端遮挡文章卡片',
    )
    await page.getByRole('button', { name: /抽象是什么/ }).first().click()
    await expect(page).toHaveURL(/\/#\/Post\/abstraction$/)

    const toc = page.getByRole('complementary', { name: '文章目录' })
    await expect(toc).toBeVisible()

    const currentUrl = page.url()
    await toc.getByRole('link', { name: '一、为什么抽象是编程的基石' }).click()

    expect(page.url()).toBe(currentUrl)
    await expect(
      page.getByRole('heading', { name: '一、为什么抽象是编程的基石' }),
    ).toBeInViewport()
  })

  test('文章可以通过 URL 直接恢复', async ({ page }) => {
    await page.goto('/#/Post/server-sent-events')

    await expect(page.locator('#blog-document-title')).toHaveText(
      'Server-Sent Events',
    )
    await expect(
      page.getByRole('button', { name: '复制文章链接' }),
    ).toBeVisible()
  })

  test('不存在的文章会给出明确提示且不显示其他正文', async ({ page }) => {
    await page.goto('/#/Post/missing-article')

    await expect(page).toHaveURL(/\/#\/Post\/missing-article$/)
    await expect(page.getByText('文章不存在，可能已被移动或删除。')).toBeVisible()
    await expect(page.locator('#blog-document-title')).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: '复制文章链接' }),
    ).toHaveCount(0)
  })

  test('从文章页返回列表页可恢复文章网格', async ({ page }) => {
    // 目标卡片在窄视口下位于折叠线以下，且卡片高度由内容（含 content-visibility 占位）决定，
    // 先滚动到位再点击卡片本体，避免自动化点击期间布局微调使指针落到卡片之外。
    const card = page
      .locator('.blog-article-grid')
      .getByRole('button', { name: /Server-Sent Events/ })
    await card.scrollIntoViewIfNeeded()
    await card.click()
    await expect(page).toHaveURL(/\/#\/Post\/server-sent-events$/)

    await page.goBack()

    await expect(page).toHaveURL(/\/#\/Home$/)
    await expect(page.locator('.blog-article-grid')).toBeVisible()
    await expect(page.getByRole('searchbox', { name: '搜索文章' })).toBeVisible()
  })

  test('文章页提供返回文章列表入口', async ({ page }) => {
    await page.goto('/#/Post/server-sent-events')

    await page.getByRole('link', { name: '← 返回文章列表' }).click()

    await expect(page).toHaveURL(/\/#\/Home$/)
    await expect(page.getByRole('searchbox', { name: '搜索文章' })).toBeVisible()
  })

  test('返回顶部按钮仅在滚动后进入页面', async ({ page }) => {
    const backToTop = page.getByRole('button', { name: '返回顶部' })
    await expect(backToTop).toHaveCount(0)

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(backToTop).toBeVisible()

    await backToTop.click()
    await expect(backToTop).toHaveCount(0)
  })

  test('列表页复制邮箱会刷新成功提示计时且失败时不提示', async ({ page }) => {
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: () => Promise.resolve(),
        },
      })
    })

    const copyEmail = page.getByRole('button', { name: '复制邮箱' })
    const emailStatus = page.locator('.profile-card__copy-status')
    if (siteProfile.email) {
      await copyEmail.click()
      await expect(emailStatus).toHaveText('邮箱已复制')
      await page.waitForTimeout(1_000)
      await copyEmail.click()
      await page.waitForTimeout(900)
      await expect(emailStatus).toHaveText('邮箱已复制')
      await expect(emailStatus).toBeEmpty({ timeout: 1_200 })
    }

    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: () => Promise.reject(new Error('clipboard unavailable')),
        },
      })
    })

    if (siteProfile.email) {
      await copyEmail.click()
      await page.waitForTimeout(50)
      await expect(emailStatus).toBeEmpty()
    }
  })

  test('文章页复制链接会刷新成功提示计时且失败时不提示', async ({ page }) => {
    await page.goto('/#/Post/abstraction')

    const copyArticleLink = page.getByRole('button', { name: '复制文章链接' })
    const articleLinkStatus = page.locator(
      '.blog-document__header-meta .sr-only',
    )
    await expect(copyArticleLink).toBeVisible()

    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: () => Promise.resolve(),
        },
      })
    })

    await copyArticleLink.click()
    await expect(articleLinkStatus).toHaveText('文章链接已复制')
    await page.waitForTimeout(1_000)
    await copyArticleLink.click()
    await page.waitForTimeout(900)
    await expect(articleLinkStatus).toHaveText('文章链接已复制')
    await expect(articleLinkStatus).toBeEmpty({ timeout: 1_200 })

    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: () => Promise.reject(new Error('clipboard unavailable')),
        },
      })
    })

    await copyArticleLink.click()
    await page.waitForTimeout(50)
    await expect(page.getByText('文章链接已复制')).toHaveCount(0)
  })

  test('首屏波浪层级与阅读区背景符合契约', async ({ page }) => {
    // playwright.config 全局设了 reducedMotion: 'reduce'，而 HomePage.css 在 reduce 下
    // 会把波浪动画置为 none；本用例断言波浪动画存在，故先显式关闭减弱动效。
    await page.emulateMedia({ reducedMotion: 'no-preference' })

    const wave = page.locator('.home-page__waves')
    await expect(wave).toBeVisible()
    // 等待媒体查询变更生效，避免读到变更前计算出的 none
    await expect
      .poll(() =>
        wave
          .locator('use')
          .first()
          .evaluate((element) => getComputedStyle(element).animationName),
      )
      .toBe('home-wave')

    const waveStyle = await wave.locator('use').first().evaluate((element) => ({
      animationName: getComputedStyle(element).animationName,
      height: element.closest('svg')?.getBoundingClientRect().height ?? 0,
      isInsideHero: Boolean(element.closest('.home-page__hero')),
    }))
    expect(waveStyle.animationName).toBe('home-wave')
    // 波浪高度：基础态 clamp(4.5rem, 8vh, 7rem)，移动端（<768px）固定 4.25rem。
    // 换算为 px 即 68 ~ 112，断言落在该区间内。
    expect(waveStyle.height).toBeGreaterThanOrEqual(68)
    expect(waveStyle.height).toBeLessThanOrEqual(112)
    expect(waveStyle.isInsideHero).toBe(true)
    const scrollIndicator = page.locator('.scroll-indicator')
    await expect(scrollIndicator).toBeVisible()
    const [waveZIndex, scrollZIndex] = await Promise.all([
      wave.evaluate((element) => Number(getComputedStyle(element).zIndex)),
      scrollIndicator.evaluate((element) => Number(getComputedStyle(element).zIndex)),
    ])
    expect(scrollZIndex).toBeGreaterThan(waveZIndex)
    const readerBackground = await page
      .locator('.blog-reader__backdrop')
      .evaluate((element) => {
        const layer = getComputedStyle(element, '::before')
        return {
          backgroundImage: layer.backgroundImage,
          position: layer.position,
        }
      })
    // 阅读区背板由 CSS 程序化生成（蓝图网格 + 斜切几何 + 内联 SVG 水印），
    // 不再引用 information/background.webp 图片。
    expect(readerBackground.backgroundImage).toContain('data:image/svg+xml')
    expect(readerBackground.position).toBe('sticky')
    await expect(
      page.locator('iframe[title="Live2D 看板娘"]'),
    ).toHaveCount(0)
  })

  test('非移动端鲸鱼组件默认按需开启并完成真实加载', async ({ page }, testInfo) => {
    test.setTimeout(30_000)
    test.skip(testInfo.project.name === 'mobile-chromium', '手机端不提供鲸鱼组件')

    await expect(
      page.getByRole('button', { name: '开启鲸鱼娘' }),
    ).toHaveCount(0)
    await page.getByRole('button', { name: '关闭鲸鱼娘' }).click()
    await expect(
      page.getByRole('region', { name: '鲸鱼娘' }),
    ).toHaveAttribute('data-load-state', 'loaded')
    await expect(page.locator('.live2d-widget__svg')).toBeVisible()
  })

  test('支持标签筛选，并在文章页展示相关文章推荐', async ({ page }) => {
    const aiTag = page.getByRole('button', { name: /#\s*AI 2/ })
    await expect(aiTag).toBeVisible()
    await aiTag.click()
    await expect(
      page.getByRole('button', { name: /AI 时代的知识价值/ }).first(),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /抽象是什么/ }),
    ).toHaveCount(0)

    await page.getByRole('button', { name: '全部' }).click()
    await page.getByRole('button', { name: /抽象是什么/ }).first().click()
    await expect(page).toHaveURL(/\/#\/Post\/abstraction$/)
    await expect(
      page.getByRole('region', { name: '继续阅读' }),
    ).toBeVisible()
  })
})
