import { expect, test } from '@playwright/test'

test.describe('鲸鱼组件', () => {
  test('桌面端真实加载鲸鱼资源并完成互动', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-chromium', '手机端不加载鲸鱼组件')
    await page.goto('/#/Home')

    await page.getByRole('button', { name: '开启鲸鱼娘' }).click()

    const widget = page.getByRole('region', { name: '鲸鱼娘' })
    await expect(widget).toHaveAttribute('data-load-state', 'loaded')
    await expect(widget.locator('.live2d-widget__svg')).toBeVisible()
    await expect(widget.getByRole('button', { name: '睡眠' })).toBeVisible()
    await expect(widget.getByRole('status')).toContainText('今天也陪你一起阅读。')

    await widget.locator('.live2d-widget__stage').click()
    await expect(widget).toHaveAttribute('data-interaction', 'pet')
    await expect(widget.getByRole('status')).toContainText('谢谢你的摸摸！')
  })

  test('睡醒、缩放与关闭状态可被用户操作并持久化关闭选择', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-chromium', '手机端不加载鲸鱼组件')
    await page.goto('/#/Home')
    await page.getByRole('button', { name: '开启鲸鱼娘' }).click()

    const widget = page.getByRole('region', { name: '鲸鱼娘' })
    await expect(widget).toHaveAttribute('data-load-state', 'loaded')

    await widget.getByRole('button', { name: '睡眠' }).click()
    await expect(widget).toHaveAttribute('data-mode', 'sleep')
    await expect(widget.getByRole('button', { name: '唤醒' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(widget.getByRole('status')).toContainText('睡着了')

    await widget.getByRole('button', { name: '唤醒' }).click()
    await expect(widget).toHaveAttribute('data-mode', 'stand')
    await expect(widget.getByRole('button', { name: '睡眠' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )

    await widget.getByRole('slider', { name: '鲸鱼娘大小' }).fill('1.25')
    await expect(widget).toHaveAttribute('data-scale', '1.25')
    await expect(widget.locator('output')).toHaveText('125%')

    await widget.getByRole('button', { name: '关闭鲸鱼娘' }).click()
    await expect(page.getByRole('button', { name: '开启鲸鱼娘' })).toBeVisible()
    await expect(page.getByRole('region', { name: '鲸鱼娘' })).toHaveCount(0)

    await page.reload()
    await expect(page.getByRole('button', { name: '开启鲸鱼娘' })).toBeVisible()
    await expect(page.getByRole('region', { name: '鲸鱼娘' })).toHaveCount(0)
  })

  test('首次加载失败后可以通过真实重试恢复', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-chromium', '手机端不加载鲸鱼组件')
    let runtimeRequests = 0
    await page.route('**/coopanion/runtime.js', async (route) => {
      runtimeRequests += 1
      if (runtimeRequests === 1) {
        await route.abort('failed')
        return
      }
      await route.continue()
    })
    await page.goto('/#/Home')
    await page.getByRole('button', { name: '开启鲸鱼娘' }).click()

    const widget = page.getByRole('region', { name: '鲸鱼娘' })
    await expect(widget).toHaveAttribute('data-load-state', 'failed')
    await expect(widget.getByRole('alert')).toContainText('鲸鱼娘加载失败')
    await expect(widget.getByRole('button', { name: '重试' })).toBeVisible()
    await expect(widget.locator('.live2d-widget__svg')).toHaveCount(0)

    await widget.getByRole('button', { name: '重试' }).click()
    await expect(widget).toHaveAttribute('data-load-state', 'loaded')
    await expect(widget.locator('.live2d-widget__svg')).toBeVisible()
    expect(runtimeRequests).toBe(2)
  })

  test('手机端不渲染鲸鱼入口且不请求鲸鱼资源', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', '仅在手机端校验不请求契约')
    const whaleRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/coopanion/')) whaleRequests.push(request.url())
    })

    await page.goto('/#/Home')

    await expect(page.getByRole('button', { name: '开启鲸鱼娘' })).toHaveCount(0)
    await expect(page.getByRole('region', { name: '鲸鱼娘' })).toHaveCount(0)
    expect(whaleRequests).toEqual([])
  })
})
