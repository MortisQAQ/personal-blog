import { BASE_URL } from '../../utils/baseUrl'

export type WhaleState = {
  mode: string
  expression: string
  interaction: string
  action: string
}

export type WhaleController = {
  dispose: () => void
  doWord: (word: string) => boolean
  setScale: (scale: number) => void
}

type WhaleOptions = {
  signal: AbortSignal
  onState: (state: WhaleState) => void
  onError: (message: string) => void
}

type WhaleModule = {
  mountWhale: (root: HTMLElement, options: WhaleOptions) => Promise<WhaleController>
}

export const WHALE_LOAD_TIMEOUT_MS = 20_000

export async function loadCoopanion(root: HTMLElement, options: WhaleOptions) {
  const url = `${BASE_URL}coopanion/runtime.js`
  const runtime: WhaleModule = await import(url)
  options.signal.throwIfAborted()
  return runtime.mountWhale(root, options)
}
