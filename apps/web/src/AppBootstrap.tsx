import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { fetchHealth } from './utils/apiClient'
import { waitForPageReady } from './utils/pageReady'

type AppBootstrapProps = {
  children: ReactNode
}

// 页面就绪兜底：正常情况下路由页面挂载后立刻广播，这里只防止页面漏发信号时 Loading 永久停留
const PAGE_READY_TIMEOUT = 10_000

function AppBootstrap({ children }: AppBootstrapProps) {
  useEffect(() => {
    if (import.meta.env.VITE_HEALTHCHECK_URL) {
      void fetchHealth()
    }
  }, [])

  useEffect(() => {
    const loadingEl = document.getElementById('global-loading')
    if (!loadingEl) {
      return
    }

    let isCancelled = false
    let removalTimer = 0

    // 只等当前路由页面自己就绪：字体与首屏视频已提权并行加载，
    // 不再阻塞 Loading；页面渲染完成即淡出，资源在页面内继续渐显。
    void waitForPageReady(PAGE_READY_TIMEOUT).then(() => {
      if (isCancelled) {
        return
      }
      loadingEl.classList.add('is-hidden')
      removalTimer = window.setTimeout(() => {
        loadingEl.remove()
      }, 500)
    })

    return () => {
      isCancelled = true
      window.clearTimeout(removalTimer)
    }
  }, [])

  return <>{children}</>
}

export default AppBootstrap
