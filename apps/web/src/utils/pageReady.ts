import { useEffect } from 'react'

// 页面就绪信号：当前路由页面完成首帧渲染后广播，AppBootstrap 收到即撤除全局 Loading。
// 这里刻意不等待字体与首屏视频——两者已在 index.html / HeroPanel 中提权并行加载，
// 页面本身渲染完成就进入过渡，资源就绪后各自在页面内渐显接管。
const PAGE_READY_EVENT = 'app:page-ready'

type WindowWithPageReadyFlag = Window & { __pageReady?: boolean }

export function markPageReady() {
  const win = window as WindowWithPageReadyFlag
  if (win.__pageReady) {
    return
  }
  win.__pageReady = true
  window.dispatchEvent(new CustomEvent(PAGE_READY_EVENT))
}

/**
 * 等待当前路由页面就绪；已就绪时立即返回。
 * timeoutMs 只作兜底：新页面漏发就绪信号时，避免 Loading 永久停留。
 */
export function waitForPageReady(timeoutMs: number): Promise<void> {
  const win = window as WindowWithPageReadyFlag
  if (win.__pageReady) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    let isSettled = false
    const finish = () => {
      if (isSettled) {
        return
      }
      isSettled = true
      window.removeEventListener(PAGE_READY_EVENT, finish)
      window.clearTimeout(timeoutId)
      resolve()
    }

    const timeoutId = window.setTimeout(finish, timeoutMs)
    window.addEventListener(PAGE_READY_EVENT, finish, { once: true })
  })
}

/**
 * 路由页面首帧就绪：由页面根组件调用，每个页面只播报一次。
 * 放进 rAF 是为了让本次提交先进入渲染帧，避免 Loading 早于页面内容消失。
 */
export function usePageReady() {
  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      markPageReady()
    })
    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [])
}
