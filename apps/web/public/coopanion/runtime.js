import { createPet } from './kit/body.js'
import { createWhaleFigure } from './whale/figure.js'

export async function mountWhale(root, { signal, onState, onError }) {
  signal.throwIfAborted()
  const modelResponse = await fetch(new URL('./whale/model.json', import.meta.url), { signal })
  if (!modelResponse.ok) throw new Error('鲸鱼模型加载失败')
  const model = await modelResponse.json()
  const loadImage = (url) => new Promise((resolve, reject) => {
    const image = new Image()
    const cleanup = () => {
      image.onload = null
      image.onerror = null
      signal.removeEventListener('abort', abort)
    }
    const abort = () => {
      cleanup()
      image.src = ''
      reject(signal.reason ?? new DOMException('已取消', 'AbortError'))
    }
    image.onload = () => { cleanup(); resolve(image) }
    image.onerror = () => { cleanup(); reject(new Error('鲸鱼贴图加载失败')) }
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) abort()
    else image.src = url
  })
  const figure = await createWhaleFigure(undefined, { model, loadImage, scheme: 'deepseek-maid' })
  if (signal.aborted) { figure.dispose(); signal.throwIfAborted() }
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.classList.add('live2d-widget__svg')
  svg.setAttribute('aria-hidden', 'true')
  svg.innerHTML = '<ellipse class="shadow"/><g></g><g></g>'
  root.appendChild(svg)
  let scale = 1
  let frame = 0
  let last = 0
  let disposed = false
  let pointerId = null
  let interaction = 'idle'
  let action = 'stand'
  let previousState = ''
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const publish = () => {
    const state = { mode: ctl.pet.mode, expression: ctl.pet.expr ?? 'neutral', interaction, action }
    const serialized = JSON.stringify(state)
    if (serialized !== previousState) { previousState = serialized; onState(state) }
  }
  const [shadowEl, petG, fxG] = svg.children
  const ctl = createPet({ shadowEl, petG, fxG }, {
    figure, sfx: {}, roam: 'off',
    bounds: () => ({ W: root.clientWidth, H: root.clientHeight, floorY: root.clientHeight - 12, S: Math.min(.72, (root.clientHeight - 36) / 320) * scale }),
    onEvent: (type, detail) => {
      if (type === 'touch') interaction = detail.kind
    },
  })
  const point = (event) => {
    const rect = root.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top, t: event.timeStamp }
  }
  const release = () => {
    if (pointerId === null) return
    ctl.pointerUp()
    if (root.hasPointerCapture(pointerId)) root.releasePointerCapture(pointerId)
    pointerId = null
    root.style.cursor = ''
    publish()
  }
  const down = (event) => {
    if (pointerId !== null || !event.isPrimary || event.button !== 0) return
    if (!ctl.pointerDown(point(event))) return
    pointerId = event.pointerId
    root.setPointerCapture(pointerId)
    root.focus({ preventScroll: true })
    event.preventDefault()
  }
  const move = (event) => {
    if (pointerId !== null && pointerId !== event.pointerId) return
    root.style.cursor = ctl.pointerMove(point(event)) || ''
    publish()
  }
  const up = (event) => { if (pointerId === event.pointerId) release() }
  const leave = () => { ctl.pointerLeave(); root.style.cursor = '' }
  const fail = (error) => { dispose(); onError(error instanceof Error ? error.message : '鲸鱼渲染失败') }
  const tick = (now) => {
    if (disposed || document.hidden) return
    if (!last || now - last >= (reduced.matches ? 1000 / 12 : 1000 / 60)) {
      const dt = last ? Math.min(.1, (now - last) / 1000) : 1 / 60
      last = now
      try {
        for (let elapsed = 0; elapsed < dt; elapsed += 1 / 60) ctl.step(Math.min(1 / 60, dt - elapsed))
        ctl.render()
        publish()
      } catch (error) { fail(error); return }
    }
    frame = requestAnimationFrame(tick)
  }
  const visibility = () => {
    cancelAnimationFrame(frame)
    release()
    last = 0
    if (!document.hidden && !disposed) frame = requestAnimationFrame(tick)
  }
  const observer = new ResizeObserver(() => {
    if (disposed) return
    try { ctl.resize(); ctl.render() } catch (error) { fail(error) }
  })
  function dispose() {
    if (disposed) return
    disposed = true
    cancelAnimationFrame(frame)
    observer.disconnect()
    release()
    root.removeEventListener('pointerdown', down)
    root.removeEventListener('pointermove', move)
    root.removeEventListener('pointerup', up)
    root.removeEventListener('pointercancel', up)
    root.removeEventListener('lostpointercapture', up)
    root.removeEventListener('pointerleave', leave)
    window.removeEventListener('blur', release)
    document.removeEventListener('visibilitychange', visibility)
    signal.removeEventListener('abort', dispose)
    figure.dispose()
    svg.remove()
  }
  try {
    ctl.step(1 / 60)
    ctl.render()
    publish()
    observer.observe(root)
    root.addEventListener('pointerdown', down)
    root.addEventListener('pointermove', move)
    root.addEventListener('pointerup', up)
    root.addEventListener('pointercancel', up)
    root.addEventListener('lostpointercapture', up)
    root.addEventListener('pointerleave', leave)
    window.addEventListener('blur', release)
    document.addEventListener('visibilitychange', visibility)
    signal.addEventListener('abort', dispose, { once: true })
    if (!document.hidden) frame = requestAnimationFrame(tick)
  } catch (error) { dispose(); throw error }
  return {
    dispose,
    doWord(word) {
      if (disposed) return false
      const accepted = ctl.doWord(word)
      if (accepted) { action = word; if (word === 'love') interaction = 'pet'; publish() }
      return accepted
    },
    setScale(value) {
      if (disposed) return
      scale = Math.max(.75, Math.min(1.25, value))
      ctl.resize()
      ctl.render()
    },
  }
}
