import { BASE_URL } from '../../utils/baseUrl'
import { useWhaleWidget } from './useWhaleWidget'
import './Live2DWidget.css'

export default function Live2DWidget() {
  const { stageRef, toggleRef, enabled, isMobile, loadState, error, state, scale,
    toggle, retry, changeScale, act } = useWhaleWidget()
  if (isMobile) return null
  if (!enabled) {
    return (
      <button ref={toggleRef} className="live2d-toggle" type="button"
        aria-label="开启鲸鱼娘" title="开启鲸鱼娘" onClick={() => toggle(true)}>
        <span aria-hidden="true">✦</span>
      </button>
    )
  }
  const ready = loadState === 'loaded'
  const sleeping = state.mode === 'sleep'
  return (
    <section className={`live2d-widget ${ready ? 'is-loaded' : ''}`}
      aria-label="鲸鱼娘" data-load-state={loadState}
      data-mode={state.mode} data-interaction={state.interaction}
      data-action={state.action} data-scale={scale}
      aria-busy={loadState === 'loading'}>
      <div className="live2d-widget__heading">
        <span>鲸鱼娘</span>
        <button className="live2d-widget__close" type="button" aria-label="关闭鲸鱼娘"
          title="关闭鲸鱼娘" onClick={() => toggle(false)}>×</button>
      </div>
      <div ref={stageRef} className="live2d-widget__stage" role="button"
        tabIndex={ready ? 0 : -1} aria-label="抚摸鲸鱼娘"
        aria-describedby="whale-help" aria-disabled={!ready}
        onKeyDown={(event) => {
          if (ready && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault()
            act(sleeping ? 'stand' : 'love')
          }
        }} />
      {loadState === 'loading' && <p className="live2d-widget__loading" role="status">鲸鱼娘正在赶来…</p>}
      {loadState === 'failed' && (
        <div className="live2d-widget__error" role="alert">
          <strong>鲸鱼娘加载失败</strong><span>{error}</span>
          <button type="button" onClick={retry}>重试</button>
        </div>
      )}
      {ready && <>
        <p id="whale-help" className="live2d-widget__help">轻点互动 · 移动抚摸 · 按住拖拽</p>
        <p className="live2d-widget__status" role="status">
          {sleeping ? '鲸鱼娘睡着了，轻点或唤醒她吧。' : state.mode === 'drag' ? '轻轻放下我哦。' : state.interaction === 'pet' ? '谢谢你的摸摸！' : '今天也陪你一起阅读。'}
        </p>
        <div className="live2d-widget__controls" role="group" aria-label="鲸鱼娘动作">
          <button type="button" onClick={() => act('wave')}>招手</button>
          <button type="button" onClick={() => act('jump')}>跳跃</button>
          <button type="button" onClick={() => act('dance')}>跳舞</button>
          <button type="button" aria-pressed={sleeping}
            onClick={() => act(sleeping ? 'stand' : 'sleep')}>{sleeping ? '唤醒' : '睡眠'}</button>
        </div>
        <label className="live2d-widget__scale">大小
          <input aria-label="鲸鱼娘大小" type="range" min="0.75" max="1.25" step="0.05"
            value={scale} onChange={(event) => changeScale(Number(event.target.value))} />
          <output>{Math.round(scale * 100)}%</output>
        </label>
      </>}
      <a className="live2d-widget__source" href={`${BASE_URL}coopanion/来源说明.md`}
        target="_blank" rel="noreferrer">来源、源码与许可</a>
    </section>
  )
}
