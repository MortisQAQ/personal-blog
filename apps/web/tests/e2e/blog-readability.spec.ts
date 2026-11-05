import { expect, test, type Page } from '@playwright/test'
import { openReadyBlog } from './blog-test-helpers'

async function expectReadable(page: Page, selectors: [string, number][]) {
  const problems = await page.evaluate((rules) => {
    const failures: string[] = []
    for (const [selector, minimum] of rules) {
      const elements = [...document.querySelectorAll<HTMLElement>(selector)]
      const visible = elements.filter(element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden')
      if (!visible.length) failures.push(`${selector}: 没有可见文字`)
      for (const element of visible) {
        let scale = 1
        let opacity = 1
        for (let parent: HTMLElement | null = element; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent)
          opacity *= Number(style.opacity)
          if (style.transform !== 'none') {
            const matrix = new DOMMatrixReadOnly(style.transform)
            scale *= Math.min(Math.hypot(matrix.m11, matrix.m12), Math.hypot(matrix.m21, matrix.m22))
          }
          if (style.filter !== 'none') failures.push(`${selector}: 文字容器使用 ${style.filter}`)
        }
        const size = parseFloat(getComputedStyle(element).fontSize) * scale
        if (size < minimum - 0.2) failures.push(`${selector}: 有效字号 ${size.toFixed(2)}px < ${minimum}px`)
        if (opacity < 0.95) failures.push(`${selector}: 文字累计不透明度 ${opacity}`)
      }
    }
    return failures
  }, selectors)
  expect(problems, '文字需在实际缩放与衬底下可读').toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
}

async function expectCardContentFits(page: Page) {
  const overflow = await page.locator('.portfolio-card:not([hidden])').evaluateAll(cards => cards.flatMap(card => {
    const cover = card.querySelector<HTMLElement>('.portfolio-card__cover')!
    const bounds = cover.getBoundingClientRect()
    const nodes = [...cover.querySelectorAll<HTMLElement>(':scope > span:not([aria-hidden="true"]), :scope > strong, :scope > em, :scope > small, :scope > b')]
    return nodes.filter((node, index) => {
      const rect = node.getBoundingClientRect()
      const previous = nodes[index - 1]?.getBoundingClientRect()
      const clipsHeight = ['hidden', 'clip'].includes(getComputedStyle(node).overflowY)
      return rect.left < bounds.left - 2 || rect.right > bounds.right + 2
        || rect.top < bounds.top - 2 || rect.bottom > bounds.bottom + 2
        || node.scrollWidth > node.clientWidth + 2 || (clipsHeight && node.scrollHeight > node.clientHeight + 2)
        || Boolean(previous && previous.bottom > rect.top + 2)
    }).map(node => `${card.getAttribute('aria-label')}: ${node.textContent}`)
  }))
  expect(overflow, '卡片扩大字号后不能截断名称、简介或打开提示').toEqual([])
}

const PORTFOLIO_RULES: [string, number][] = [
  ['.portfolio-directory__item strong', 16],
  ['.portfolio-directory__item small', 12],
  ['.portfolio-directory__hint', 16],
  ['.portfolio-directory__hint span', 16],
  ['.portfolio-card:not([hidden]) .portfolio-card__cover strong', 16],
  ['.portfolio-card:not([hidden]) .portfolio-card__cover em', 16],
  ['.portfolio-card:not([hidden]) .portfolio-card__cover small', 16],
  ['.portfolio-card:not([hidden]) .portfolio-card__cover b', 14],
  ['.portfolio-card:not([hidden]) .portfolio-card__cover b span', 14],
  ['.portfolio-card:not([hidden]) .portfolio-card__micro', 10],
  ['.portfolio-carousel__status', 14],
  ['.portfolio-carousel__status span, .portfolio-carousel__status strong', 14],
  ['.panel-page__register', 10],
]

const HOME_ARCHIVE_RULES: [string, number][] = [
  ['.home-archive-heading__code', 12],
  ['.home-archive-heading__title', 32],
  ['.home-archive-heading__caption', 16],
  ['.home-archive-heading__rule', 12],
  ['.home-page__articles .blog-main__toolbar h2', 20],
  ['.home-page__articles .category-btn', 14],
  ['.home-page__articles .blog-search input', 16],
  ['.home-page__articles .blog-tag-filters button', 14],
  ['.home-page__articles .featured-article__title', 16],
  ['.home-page__articles .featured-article__summary', 16],
]

async function expectUnscaledDeck(page: Page) {
  const scales = await page.locator('.portfolio-card:not([hidden])').evaluateAll(cards => cards.map(card => {
    let scale = 1
    for (let element: Element | null = card; element; element = element.parentElement) {
      const transform = getComputedStyle(element).transform
      if (transform === 'none') continue
      const matrix = new DOMMatrixReadOnly(transform)
      scale *= Math.min(
        Math.hypot(matrix.m11, matrix.m12, matrix.m13),
        Math.hypot(matrix.m21, matrix.m22, matrix.m23),
      )
    }
    return { name: card.getAttribute('aria-label'), scale }
  }))
  expect(scales).toHaveLength(3)
  for (const { name, scale } of scales) {
    expect(scale, `${name}: 卡组文字不能依赖缩小邻卡制造层次`).toBeCloseTo(1, 2)
  }
}

async function expectDirectoryTextFits(page: Page) {
  const clipped = await page.locator('.portfolio-directory__item strong, .portfolio-directory__item small').evaluateAll(elements => elements.filter(element => {
    const node = element as HTMLElement
    const bounds = element.closest('button')!.getBoundingClientRect()
    const rect = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    return node.scrollWidth > node.clientWidth + 2 || node.scrollHeight > node.clientHeight + 2
      || rect.left < bounds.left - 2 || rect.right > bounds.right + 2
      || rect.top < bounds.top - 2 || rect.bottom > bounds.bottom + 2
      || style.textOverflow === 'ellipsis' || !['none', ''].includes(style.webkitLineClamp)
  }).map(element => element.textContent))
  expect(clipped, '目录完整中英文名称必须能自然换行，不能省略或截断').toEqual([])
}

test.describe('文字可读性契约', () => {
  test('首页二屏完整标题与目录文字保持可读', async ({ page }) => {
    await openReadyBlog(page)
    await expect(page.locator('#global-loading')).toHaveCount(0)
    await page.getByRole('button', { name: '滑动查看文章' }).click()
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('.home-archive-heading__title')).toHaveText(/NOTES\s*&\s*THOUGHTS\./)
    await expect(page.locator('.home-archive-heading__caption')).toContainText('把好奇写成记录。')
    const clipped = await page.locator('.home-archive-heading__title, .featured-article__title').evaluateAll(elements => elements.filter(element => {
      const node = element as HTMLElement
      const style = getComputedStyle(node)
      const range = document.createRange()
      range.selectNodeContents(node)
      const text = range.getBoundingClientRect()
      const bounds = node.getBoundingClientRect()
      return node.scrollWidth > node.clientWidth + 2 || node.scrollHeight > node.clientHeight + 2
        || text.left < bounds.left - 2 || text.right > bounds.right + 2
        || style.textOverflow === 'ellipsis' || !['none', ''].includes(style.webkitLineClamp)
    }).map(element => {
      const node = element as HTMLElement
      const style = getComputedStyle(node)
      const range = document.createRange()
      range.selectNodeContents(node)
      return { text: node.textContent, width: [node.scrollWidth, node.clientWidth], height: [node.scrollHeight, node.clientHeight], bounds: node.getBoundingClientRect().toJSON(), textBounds: range.getBoundingClientRect().toJSON(), clamp: style.webkitLineClamp }
    }))
    expect(clipped, '首页归档标题及文章完整标题不能省略或裁切').toEqual([])
    await expectReadable(page, HOME_ARCHIVE_RULES)
  })

  test('作品中央卡与未缩放邻卡字号达标，所有作品内容完整', async ({ page }) => {
    await page.goto('/#/Portfolio')
    await expect(page.locator('#global-loading')).toHaveCount(0)
    await expect(page.locator('.portfolio-card.is-active')).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    for (let index = 0; index < 4; index += 1) {
      await expectReadable(page, PORTFOLIO_RULES)
      await expectUnscaledDeck(page)
      await expectCardContentFits(page)
      await expectDirectoryTextFits(page)
      await page.getByRole('button', { name: '下一个作品', exact: true }).click()
    }
    const activeCard = page.locator('.portfolio-card.is-active')
    await activeCard.focus()
    await expect(activeCard).toHaveAttribute('data-expanded', 'true')
    await expectReadable(page, PORTFOLIO_RULES)
    await expectCardContentFits(page)
    await page.keyboard.press('Enter')
    await expect(page.locator('.portfolio-details')).toBeVisible()
    for (let index = 0; index < 4; index += 1) {
      await expectReadable(page, [
        ['#portfolio-detail-title', 16],
        ['.portfolio-details__copy p', 16],
        ['.portfolio-details__copy h3', 14],
        ['.portfolio-details header li', 14],
        ['.portfolio-details__close', 16],
        ['.portfolio-details__link', 16],
      ])
      await expect(page.locator('.portfolio-directory')).toBeHidden()
      await page.getByRole('button', { name: '下一个项目', exact: true }).click()
    }
  })

  test('正常动效 hover 展开不缩小文字、截字或叠字', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'hover 可读性只在精确指针验证')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/#/Portfolio')
    await expect(page.locator('#global-loading')).toHaveCount(0)
    await page.evaluate(() => document.fonts.ready)
    const activeCard = page.locator('.portfolio-card.is-active')
    for (let index = 0; index < 4; index += 1) {
      await activeCard.hover()
      await expect(activeCard).toHaveAttribute('data-expanded', 'true')
      await expect.poll(() => activeCard.evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0)
      await expectReadable(page, PORTFOLIO_RULES)
      await expectUnscaledDeck(page)
      await expectCardContentFits(page)
      await expectDirectoryTextFits(page)
      await page.getByRole('button', { name: '下一个作品', exact: true }).click()
    }
  })

  test('介绍与阅读页正文、元数据和目录保持可读', async ({ page }) => {
    await page.goto('/#/Information')
    await expect(page.locator('#global-loading')).toHaveCount(0)
    await expect(page.locator('.intro-panel__text').first()).toBeVisible()
    await expectReadable(page, [
      ['.intro-panel__text', 16],
      ['.intro-panel__section-title h3', 16],
      ['.intro-panel__social', 16],
      ['.intro-panel__label', 14],
      ['.intro-panel__status', 16],
    ])
    await page.goto('/#/Post/abstraction')
    await expect(page.locator('.markdown-body')).toBeVisible()
    await expectReadable(page, [
      ['.markdown-body p', 16],
      ['.blog-document__header-meta', 14],
      ['.blog-toc__link', 14],
      ['.article-reader__back', 14],
    ])
  })

  test('写作入口与错误页不使用不可读微字', async ({ page }) => {
    await page.goto('/#/Editor')
    await expect(page.locator('.md-launcher')).toBeVisible()
    await expectReadable(page, [
      ['.md-launcher__subtitle', 16],
      ['.md-source-card__title', 16],
      ['.md-source-card__meta', 14],
      ['.md-launcher__footer', 14],
    ])
    await page.goto('/#/missing-page')
    await expect(page.locator('.not-found-file')).toBeVisible()
    await expectReadable(page, [
      ['.not-found-file__description', 16],
      ['.not-found-file__return', 16],
      ['.not-found-file__header', 14],
    ])
  })
})
