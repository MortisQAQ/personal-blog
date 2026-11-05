import { useEffect, useRef, useState } from 'react'
import { loadCoopanion, WHALE_LOAD_TIMEOUT_MS, type WhaleController, type WhaleState } from './loadCoopanion'

const STORAGE_KEY = 'blog-live2d-enabled'
const MOBILE_BREAKPOINT = 768
const initialState: WhaleState = { mode: 'idle', expression: 'neutral', interaction: 'idle', action: 'stand' }

function readEnabled() {
  try { return localStorage.getItem(STORAGE_KEY) === 'true' } catch { return false }
}

export function useWhaleWidget() {
  const stageRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const controllerRef = useRef<WhaleController | null>(null)
  const [enabled, setEnabled] = useState(readEnabled)
  const [isMobile, setIsMobile] = useState(() => !matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px)`).matches)
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'loaded' | 'failed'>(() => enabled ? 'loading' : 'idle')
  const [error, setError] = useState('')
  const [state, setState] = useState(initialState)
  const [attempt, setAttempt] = useState(0)
  const [scale, setScale] = useState(1)
  const scaleRef = useRef(scale)

  useEffect(() => {
    const media = matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px)`)
    const update = () => setIsMobile(!media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const root = stageRef.current
    if (!enabled || isMobile || !root) return
    const abort = new AbortController()
    let active = true
    let controller: WhaleController | null = null
    const fail = (message: string) => {
      if (!active) return
      setError(message)
      setLoadState('failed')
      controllerRef.current = null
      abort.abort()
    }
    const timeout = window.setTimeout(() => fail('鲸鱼资源加载超时，请重试。'), WHALE_LOAD_TIMEOUT_MS)
    void loadCoopanion(root, {
      signal: abort.signal,
      onState: (next) => { if (active && !abort.signal.aborted) setState(next) },
      onError: fail,
    }).then((loaded) => {
      window.clearTimeout(timeout)
      if (!active || abort.signal.aborted) { loaded.dispose(); return }
      controller = loaded
      controllerRef.current = loaded
      loaded.setScale(scaleRef.current)
      setLoadState('loaded')
    }).catch((reason: unknown) => {
      window.clearTimeout(timeout)
      if (!abort.signal.aborted) fail(reason instanceof Error ? reason.message : '鲸鱼加载失败，请重试。')
    })
    return () => {
      active = false
      window.clearTimeout(timeout)
      abort.abort()
      controller?.dispose()
      if (controllerRef.current === controller) controllerRef.current = null
    }
  }, [enabled, isMobile, attempt])

  const toggle = (next: boolean) => {
    setEnabled(next)
    setLoadState(next ? 'loading' : 'idle')
    setScale(1)
    scaleRef.current = 1
    setState(initialState)
    try { localStorage.setItem(STORAGE_KEY, String(next)) } catch { void 0 }
    if (!next) requestAnimationFrame(() => toggleRef.current?.focus())
  }
  const retry = () => {
    setError('')
    setLoadState('loading')
    setState(initialState)
    setScale(1)
    scaleRef.current = 1
    setAttempt((value) => value + 1)
  }
  const changeScale = (value: number) => {
    scaleRef.current = value
    setScale(value)
    controllerRef.current?.setScale(value)
  }
  const act = (word: string) => controllerRef.current?.doWord(word)

  return { stageRef, toggleRef, enabled, isMobile, loadState, error, state, scale, toggle, retry, changeScale, act }
}
