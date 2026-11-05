import { expect, test, type Page } from '@playwright/test'

async function openPortfolio(page: Page, query = '') {
  await page.goto(`/#/Portfolio${query}`)
  await expect(page.locator('#global-loading')).toHaveCount(0)
  await expect(page.locator('.portfolio-stage')).toHaveAttribute('data-phase', 'idle')
}

async function expectReducedMotion(page: Page) {
  const problems = await page.locator('.portfolio-stage').evaluate(stage => {
    const failures: string[] = []
    for (const element of [stage, ...stage.querySelectorAll('*')]) {
      for (const pseudo of [null, '::before', '::after']) {
        const style = getComputedStyle(element, pseudo)
        for (const property of ['animationDuration', 'transitionDuration'] as const) {
          const durations = style[property].split(',').map(value => parseFloat(value) * (value.trim().endsWith('ms') ? 1 : 1000))
          if (durations.some(duration => duration > 1)) failures.push(`${element.className}${pseudo ?? ''}: ${property}=${style[property]}`)
        }
      }
    }
    for (const animation of stage.getAnimations({ subtree: true })) {
      const duration = animation.effect?.getTiming().duration
      if (animation.playState === 'running' && typeof duration === 'number' && duration > 1) failures.push(`仍在播放 ${duration}ms 动效`)
    }
    return failures
  })
  expect(problems, 'reduce 不得保留可感知的动画或过渡').toEqual([])
}

async function expectVisibleFocus(page: Page, selector: string) {
  const element = page.locator(selector)
  await expect(element).toBeFocused()
  const style = await element.evaluate(node => ({
    outline: getComputedStyle(node).outlineStyle,
    width: parseFloat(getComputedStyle(node).outlineWidth),
  }))
  expect(style.outline).not.toBe('none')
  expect(style.width).toBeGreaterThanOrEqual(2)
}

async function swipe(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  // 使用浏览器原生触摸输入，不以 DOM 派发事件绕过 touch-action 或浏览器滚动。
  const session = await page.context().newCDPSession(page)
  try {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...from, id: 0 }] })
    for (let step = 1; step <= 6; step += 1) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: from.x + (to.x - from.x) * step / 6, y: from.y + (to.y - from.y) * step / 6, id: 0 }],
      })
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  } finally {
    await session.detach()
  }
}

test.describe('作品目录预览与触摸契约', () => {
  test('精确指针 hover 同步中央卡但不写 URL，独立后图不残留旧身份', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', '后方预览只属于精确指针')
    await openPortfolio(page)
    expect(await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)).toBe(true)
    const initialURL = page.url()
    const items = page.locator('.portfolio-directory__item')
    const preview = page.locator('.portfolio-directory__preview')
    const activeCard = page.locator('.portfolio-card.is-active')
    await expect(preview).toHaveCount(1)
    await expect(preview).toHaveAttribute('aria-hidden', 'true')
    await expect(preview).toHaveCSS('pointer-events', 'none')
    expect(await preview.evaluate(element => element.closest('.portfolio-card'))).toBeNull()
    expect(await preview.evaluate(element => Number(getComputedStyle(element).zIndex) < Number(getComputedStyle(element.parentElement!.querySelector('ol')!).zIndex))).toBe(true)
    await expect(page.locator('.detail-menu__preview-container')).toHaveCount(0)

    for (const project of [
      { id: 'triple-uni', title: 'Triple Uni', orientation: 'landscape', image: /TripleUni/ },
      { id: 'annual-report', title: '2025年度总结', orientation: 'portrait', image: /YearReport/ },
      { id: 'yugong', title: '愚公迁移工具', orientation: 'graphic', image: null },
      { id: 'bytehouse', title: '火山引擎ByteHouse 官网', orientation: 'graphic', image: null },
    ]) {
      await items.filter({ has: page.locator('strong', { hasText: project.title }) }).hover()
      await expect(activeCard.locator('.portfolio-card__cover em')).toHaveText(project.title)
      await expect(preview).toHaveAttribute('data-project', project.id)
      await expect(preview).toHaveAttribute('data-orientation', project.orientation)
      await expect(preview).toHaveClass(/is-visible/)
      await expect(preview).toHaveCSS('opacity', '1')
      expect(page.url()).toBe(initialURL)
      await expect(page.locator('.portfolio-details')).toBeHidden()
      if (project.image) {
        await expect(preview.locator('img')).toHaveCount(1)
        await expect(preview.locator('img')).toHaveAttribute('src', project.image)
        await expect(preview.locator('img')).toHaveAttribute('alt', `${project.title}项目预览`)
        await expect(preview.locator('.project-artwork--graphic')).toHaveCount(0)
      } else {
        await expect(preview.locator('img')).toHaveCount(0)
        await expect(preview.locator('.project-artwork--graphic')).toHaveCount(1)
        await expect(preview.locator('.project-artwork--graphic')).toHaveAttribute('aria-label', `${project.title}原创几何封面，非产品截图`)
      }
      if (project.orientation === 'portrait') {
        const box = await preview.boundingBox()
        expect(box!.height).toBeGreaterThan(box!.width)
      }
    }
    await page.mouse.move(0, 0)
    await expect(preview).not.toHaveClass(/is-visible/)
    await expect(preview).toHaveCSS('opacity', '0')
    await expect(preview).not.toHaveAttribute('data-project', /.+/)
    await expect(preview.locator('.project-artwork')).toHaveCount(0)
    await expect(activeCard.locator('.portfolio-card__cover em')).toHaveText('火山引擎ByteHouse 官网')
    await items.nth(1).click()
    await expect(page).toHaveURL(/project=annual-report$/)
    await expect(page.locator('#portfolio-detail-title')).toHaveText('2025年度总结')
    await expect(preview).toBeHidden()
  })

  test('粗指针无悬停后图，焦点预览和轻点目录均可访问', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'desktop-chromium', '平板和手机覆盖粗指针')
    await openPortfolio(page)
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true)
    const initialURL = page.url()
    const items = page.locator('.portfolio-directory__item')
    const preview = page.locator('.portfolio-directory__preview')
    const activeCard = page.locator('.portfolio-card.is-active')
    await items.nth(1).hover()
    await expect(activeCard.locator('.portfolio-card__cover em')).toHaveText('Triple Uni')
    await expect(preview).toBeHidden()
    await expect(preview).toHaveCSS('display', 'none')
    await items.nth(2).focus()
    await expect(activeCard.locator('.portfolio-card__cover em')).toHaveText('愚公迁移工具')
    expect(page.url()).toBe(initialURL)
    await expect(page.locator('.portfolio-details')).toBeHidden()
    await expect(preview).toBeHidden()
    await items.nth(1).tap()
    await expect(page).toHaveURL(/project=annual-report$/)
    await expect(page.locator('#portfolio-detail-title')).toBeFocused()
    await expect(page.locator('.portfolio-directory')).toBeHidden()
    await expect(page.locator('.portfolio-carousel')).toBeHidden()
    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(initialURL)
    await expect(activeCard.locator('.portfolio-card__cover em')).toHaveText('2025年度总结')
    await expect(activeCard).toBeFocused()
    await expect(preview).toBeHidden()
    await activeCard.tap()
    await expect(page).toHaveURL(/project=annual-report$/)
  })

  test('触摸横滑只切换卡片，纵滑保持自然滚动、不误开详情', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'desktop-chromium', '触摸手势只在平板和手机验证')
    await openPortfolio(page)
    const activeCard = page.locator('.portfolio-card.is-active')
    await activeCard.scrollIntoViewIfNeeded()
    const box = await activeCard.boundingBox()
    const center = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 }
    await swipe(page, { x: center.x + 65, y: center.y }, { x: center.x - 65, y: center.y })
    await expect(activeCard.locator('.portfolio-card__cover em')).toHaveText('2025年度总结')
    await expect(page).toHaveURL(/\/#\/Portfolio$/)
    await expect(page.locator('.portfolio-details')).toBeHidden()
    await activeCard.scrollIntoViewIfNeeded()
    const nextBox = await activeCard.boundingBox()
    const x = nextBox!.x + nextBox!.width / 2
    const y = nextBox!.y + nextBox!.height / 2
    const scrollBefore = await page.evaluate(() => scrollY)
    await swipe(page, { x, y: y + 60 }, { x, y: y - 100 })
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scrollBefore + 20)
    await expect(activeCard.locator('.portfolio-card__cover em')).toHaveText('2025年度总结')
    await expect(page).toHaveURL(/\/#\/Portfolio$/)
    await expect(page.locator('.portfolio-directory__preview')).toBeHidden()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
})

test.describe('作品开合动效与焦点契约', () => {
  test('正常动效先 opening 再改 URL，closing 完成才返回档案', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await openPortfolio(page)
    const stage = page.locator('.portfolio-stage')
    const activeCard = page.locator('.portfolio-card.is-active')
    // 点击前订阅中间态，避免 Playwright 点击返回时短暂阶段已结束。
    const opening = page.waitForFunction(() => {
      const stage = document.querySelector('.portfolio-stage')
      if (stage?.getAttribute('data-phase') !== 'opening') return null
      const card = stage.querySelector('.portfolio-card.is-active') as HTMLButtonElement
      const unseal = stage.querySelector('.portfolio-unseal') as HTMLElement | null
      return {
        hash: location.hash,
        cardVisible: card.getClientRects().length > 0,
        expanded: card.dataset.expanded,
        disabled: card.disabled,
        detailCount: stage.querySelectorAll('.portfolio-details').length,
        animation: getComputedStyle(card.querySelector('.portfolio-card__cover')!).animationName,
        duration: parseFloat(getComputedStyle(card.querySelector('.portfolio-card__cover')!).animationDuration),
        unseal: unseal
          ? {
              hidden: unseal.getAttribute('aria-hidden'),
              pointerEvents: getComputedStyle(unseal).pointerEvents,
              mode: unseal.getAttribute('data-mode'),
              layerAnimation: getComputedStyle(unseal.querySelector('.portfolio-unseal__leaf')!).animationName,
            }
          : null,
        pageFits: document.documentElement.scrollWidth <= innerWidth,
        focusable: [...stage.querySelectorAll<HTMLElement>('.portfolio-unseal button, .portfolio-unseal a, .portfolio-unseal [tabindex]')].length,
      }
    })
    await activeCard.click()
    const openingState = await (await opening).jsonValue()
    if (!openingState) throw new Error('未捕获作品 opening 阶段')
    expect(openingState).toMatchObject({ hash: '#/Portfolio', cardVisible: true, expanded: 'true', disabled: true, detailCount: 0 })
    expect(openingState.animation).not.toBe('none')
    expect(openingState.duration).toBeGreaterThan(0)
    // 封套是纯装饰层：不可聚焦、不吃指针、不撑横滚，动画必须真的在跑
    expect(openingState.unseal).toMatchObject({ hidden: 'true', pointerEvents: 'none', mode: 'arm' })
    expect(openingState.unseal.layerAnimation).toBe('unseal-rise')
    expect(openingState.focusable).toBe(0)
    expect(openingState.pageFits).toBe(true)
    await expect(page).toHaveURL(/project=triple-uni$/)
    await expect(stage).toHaveAttribute('data-phase', 'idle')
    await expect(stage).toHaveClass(/portfolio-stage--detail/)
    await expect(page.locator('.portfolio-directory')).toBeHidden()
    await expect(page.locator('.portfolio-carousel')).toBeHidden()
    await expect(page.locator('#portfolio-detail-title')).toBeFocused()
    const details = page.locator('.portfolio-details')
    await expect(details).toBeVisible()
    const entrance = await details.evaluate(element => ({ name: getComputedStyle(element).animationName, duration: parseFloat(getComputedStyle(element).animationDuration) }))
    expect(entrance.name).not.toBe('none')
    expect(entrance.duration).toBeGreaterThan(0)
    await expect.poll(() => details.evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0)

    const closing = page.waitForFunction(() => {
      const stage = document.querySelector('.portfolio-stage')
      if (stage?.getAttribute('data-phase') !== 'closing') return null
      const details = stage.querySelector('.portfolio-details')!
      return {
        hash: location.hash,
        detailVisible: details.getClientRects().length > 0,
        cardCount: stage.querySelectorAll('.portfolio-card').length,
        animation: getComputedStyle(details).animationName,
        duration: parseFloat(getComputedStyle(details).animationDuration),
      }
    })
    await page.getByRole('button', { name: '返回档案', exact: true }).click()
    const closingState = await (await closing).jsonValue()
    if (!closingState) throw new Error('未捕获作品 closing 阶段')
    expect(closingState).toMatchObject({ hash: '#/Portfolio?project=triple-uni', detailVisible: true, cardCount: 0 })
    expect(closingState.animation).not.toBe('none')
    expect(closingState.duration).toBeGreaterThan(0)
    await expect(page).toHaveURL(/\/#\/Portfolio$/)
    await expect(stage).toHaveAttribute('data-phase', 'idle')
    await expect(stage).not.toHaveClass(/portfolio-stage--detail/)
    await expect(page.locator('.portfolio-details')).toBeHidden()
    await expect(activeCard).toBeFocused()
    await expect(activeCard).toHaveAttribute('data-expanded', 'true')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })

  test('正常 hover 仅抽出后层磁带，文字封面不旋转或缩放', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'hover 展开仅在精确指针验证')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await openPortfolio(page)
    const card = page.locator('.portfolio-card.is-active')
    const cover = card.locator('.portfolio-card__cover')
    const tape = card.locator('.portfolio-card__tape')
    await expect(card).toHaveAttribute('data-expanded', 'false')
    await expect(tape).toHaveAttribute('aria-hidden', 'true')
    const coverTransform = await cover.evaluate(element => getComputedStyle(element).transform)
    const tapeX = await tape.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41)
    await card.hover()
    await expect(card).toHaveAttribute('data-expanded', 'true')
    await expect.poll(() => tape.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41)).toBeGreaterThan(tapeX + 80)
    await expect(cover).toHaveCSS('transform', coverTransform)
    const expanded = await card.evaluate(element => {
      const cover = element.querySelector('.portfolio-card__cover')!.getBoundingClientRect()
      const tape = element.querySelector('.portfolio-card__tape')!.getBoundingClientRect()
      return { exposed: tape.right > cover.right + 40, fits: tape.left >= 0 && tape.right <= innerWidth, pageFits: document.documentElement.scrollWidth <= innerWidth }
    })
    expect(expanded).toEqual({ exposed: true, fits: true, pageFits: true })
    await page.mouse.move(0, 0)
    await expect(card).toHaveAttribute('data-expanded', 'false')
    await expect.poll(() => tape.evaluate(element => Math.abs(new DOMMatrixReadOnly(getComputedStyle(element).transform).m41))).toBeLessThan(1)
    await page.keyboard.press('Tab')
    await card.focus()
    await expect(card).toHaveAttribute('data-expanded', 'true')
    await expectVisibleFocus(page, '.portfolio-card.is-active')
    await expect(cover).toHaveCSS('transform', coverTransform)
    await page.locator('.portfolio-stage').focus()
    await expect(card).toHaveAttribute('data-expanded', 'false')
  })

  test('reduce 焦点预览不写 URL，直接打开、Escape 返回且焦点可见', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openPortfolio(page)
    const initialURL = page.url()
    const stage = page.locator('.portfolio-stage')
    const activeCard = page.locator('.portfolio-card.is-active')
    const item = page.locator('.portfolio-directory__item').nth(2)
    await page.keyboard.press('Tab')
    await item.focus()
    await expectVisibleFocus(page, '.portfolio-directory__item.is-active')
    await expect(activeCard.locator('.portfolio-card__cover em')).toHaveText('愚公迁移工具')
    expect(page.url()).toBe(initialURL)
    await expect(page.locator('.portfolio-details')).toBeHidden()
    await activeCard.focus()
    await expect(activeCard).toHaveAttribute('data-expanded', 'true')
    await expectVisibleFocus(page, '.portfolio-card.is-active')
    const geometry = await activeCard.evaluate(element => {
      const tape = element.querySelector('.portfolio-card__tape')!.getBoundingClientRect()
      const cover = element.querySelector('.portfolio-card__cover')!.getBoundingClientRect()
      return { exposed: tape.right > cover.right + 20, fits: tape.left >= 0 && tape.right <= innerWidth, pageFits: document.documentElement.scrollWidth <= innerWidth }
    })
    expect(geometry).toEqual({ exposed: true, fits: true, pageFits: true })
    await expectReducedMotion(page)
    await page.keyboard.press('Enter')
    expect(await stage.getAttribute('data-phase')).toBe('idle')
    expect(page.url()).toBe(`${initialURL}?project=yugong`)
    await expect(page).toHaveURL(/project=yugong$/)
    await expectVisibleFocus(page, '#portfolio-detail-title')
    await expect(page.locator('.portfolio-directory')).toBeHidden()
    await expect(page.locator('.portfolio-carousel')).toBeHidden()
    await expectReducedMotion(page)
    for (let index = 0; index < 6; index += 1) {
      await page.keyboard.press('Tab')
      expect(await page.evaluate(() => Boolean(document.activeElement?.closest('.portfolio-directory, .portfolio-carousel')))).toBe(false)
    }
    await page.locator('#portfolio-detail-title').focus()
    await page.keyboard.press('Escape')
    expect(await stage.getAttribute('data-phase')).toBe('idle')
    expect(page.url()).toBe(initialURL)
    await expect(page).toHaveURL(initialURL)
    await expectVisibleFocus(page, '.portfolio-card.is-active')
    await expect(activeCard.locator('.portfolio-card__cover em')).toHaveText('愚公迁移工具')
    await expectReducedMotion(page)
  })
})

test.describe('作品卡组裁切边界', () => {
  for (const width of [390, 834, 1024, 1440]) {
    test(`${width}px 展开磁带和标签位于实际卡组裁切盒内`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop-chromium', '显式覆盖四个宽度，避免重复运行')
      await page.setViewportSize({ width, height: 1112 })
      await openPortfolio(page)
      await page.evaluate(() => document.fonts.ready)
      const card = page.locator('.portfolio-card.is-active')
      await card.focus()
      await expect(card).toHaveAttribute('data-expanded', 'true')
      const geometry = await card.evaluate(element => {
        const clipper = element.parentElement!.getBoundingClientRect()
        const tape = element.querySelector('.portfolio-card__tape')!.getBoundingClientRect()
        const label = element.querySelector('.portfolio-tape__label')!.getBoundingClientRect()
        const fits = (rect: DOMRect) => rect.left >= clipper.left - 1 && rect.right <= clipper.right + 1
          && rect.top >= clipper.top - 1 && rect.bottom <= clipper.bottom + 1
        return { tapeFits: fits(tape), labelFits: fits(label), pageFits: document.documentElement.scrollWidth <= innerWidth }
      })
      expect(geometry).toEqual({ tapeFits: true, labelFits: true, pageFits: true })
    })
  }
})

test.describe('作品详情三档几何与直达契约', () => {
  for (const project of [
    { id: 'triple-uni', title: 'Triple Uni', image: /TripleUni/, orientation: 'landscape' },
    { id: 'annual-report', title: '2025年度总结', image: /YearReport/, orientation: 'portrait' },
  ]) {
    test(`${project.title} URL 直达与刷新恢复，完整图片不被巨大宽框压小`, async ({ page }) => {
      await openPortfolio(page, `?project=${project.id}`)
      const stage = page.locator('.portfolio-stage')
      const title = page.locator('#portfolio-detail-title')
      const image = page.locator('.portfolio-details__art img')
      await expect(title).toHaveText(project.title)
      await expect(title).toBeFocused()
      await expect(stage).toHaveClass(/portfolio-stage--detail/)
      await expect(page.locator('.portfolio-directory')).toBeHidden()
      await expect(page.locator('.portfolio-carousel')).toBeHidden()
      await expect(image).toHaveAttribute('src', project.image)
      await page.reload()
      await expect(page.locator('#global-loading')).toHaveCount(0)
      await expect(page).toHaveURL(new RegExp(`project=${project.id}$`))
      await expect(title).toHaveText(project.title)
      await expect(stage).toHaveAttribute('data-phase', 'idle')
      await expect(page.locator('.portfolio-directory')).toBeHidden()
      await expect(page.locator('.portfolio-directory__preview')).toBeHidden()
      await expect(page.locator('.portfolio-carousel')).toBeHidden()
      await expect(image).toHaveAttribute('src', project.image)
      await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBe(true)
      const picture = await image.evaluate(element => {
        const image = element as HTMLImageElement
        const style = getComputedStyle(image)
        const width = image.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
        const height = image.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
        const ratio = image.naturalWidth / image.naturalHeight
        const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight, style.objectFit === 'scale-down' ? 1 : Infinity)
        const paintedWidth = image.naturalWidth * scale
        const paintedHeight = image.naturalHeight * scale
        const details = image.closest('.portfolio-details')!.getBoundingClientRect()
        return { fit: style.objectFit, ratio, boxRatio: width / height, paintedWidth, widthOccupancy: paintedWidth / width, heightOccupancy: paintedHeight / height, detailsWidth: details.width }
      })
      expect(['contain', 'scale-down']).toContain(picture.fit)
      expect(Math.abs(picture.boxRatio / picture.ratio - 1), '图片盒子应跟随真实横竖比例，不能靠巨大空框 contain').toBeLessThan(0.01)
      expect(picture.widthOccupancy).toBeGreaterThanOrEqual(0.98)
      expect(picture.heightOccupancy).toBeGreaterThanOrEqual(0.98)
      if (project.orientation === 'portrait') {
        expect(picture.ratio).toBeLessThan(1)
        expect(picture.paintedWidth, '竖图须保留可阅读的真实画面宽度').toBeGreaterThanOrEqual(Math.min(288, picture.detailsWidth * 0.8))
      } else {
        expect(picture.ratio).toBeGreaterThan(1)
      }
      const geometry = await page.evaluate(() => {
        const stage = document.querySelector('.portfolio-stage')!.getBoundingClientRect()
        const details = document.querySelector('.portfolio-details')!.getBoundingClientRect()
        const header = document.querySelector('.portfolio-details header')!.getBoundingClientRect()
        const art = document.querySelector('.portfolio-details__art')!.getBoundingClientRect()
        const image = document.querySelector('.portfolio-details__art img')!.getBoundingClientRect()
        const copy = document.querySelector('.portfolio-details__copy')!.getBoundingClientRect()
        const rail = document.querySelector('.side-indicator')!.getBoundingClientRect()
        const nodes = [...document.querySelectorAll('.portfolio-details, .portfolio-details > *, .portfolio-details__copy p, #portfolio-detail-title')]
        return {
          pageFits: document.documentElement.scrollWidth <= innerWidth,
          stageFits: stage.left >= 0 && stage.right <= innerWidth,
          contentFits: nodes.every(element => {
            const rect = element.getBoundingClientRect()
            return rect.left >= details.left && rect.right <= details.right && rect.right <= innerWidth
          }),
          imageFits: image.left >= art.left && image.right <= art.right && image.top >= art.top && image.bottom <= art.bottom,
          composition: innerWidth < 1024 ? header.bottom <= art.top && art.bottom <= copy.top : art.right <= header.left && art.right <= copy.left,
          railSeparate: innerWidth < 768 || details.right <= rail.left,
        }
      })
      expect(geometry).toEqual({ pageFits: true, stageFits: true, contentFits: true, imageFits: true, composition: true, railSeparate: true })
      const buttons = [
        page.getByRole('button', { name: '返回档案', exact: true }),
        page.getByRole('button', { name: '上一个项目', exact: true }),
        page.getByRole('button', { name: '下一个项目', exact: true }),
      ]
      for (const button of buttons) {
        await expect(button).toBeVisible()
        const box = await button.boundingBox()
        expect(box!.width).toBeGreaterThanOrEqual(44)
        expect(box!.height).toBeGreaterThanOrEqual(44)
      }
      await buttons[0].click()
      await expect(page).toHaveURL(/\/#\/Portfolio$/)
      await expect(page.locator('.portfolio-card.is-active .portfolio-card__cover em')).toHaveText(project.title)
      await expect(page.locator('.portfolio-card.is-active')).toBeFocused()
    })
  }
})
