import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getProjectIndex, normalizeProjectIndex, PROJECTS } from '../utils/projects'
import { getProjectStep, hasKeyModifier } from '../utils/portfolioNavigation'
import type { UnsealMode } from '../components/ProjectUnseal'

/**
 * 开档 / 归档的分段时长，必须与 ProjectUnseal.css 的四段动画一致：
 * arm   封面从下方推到全覆盖 → 此时才切 DOM
 * reveal 封面继续上移离场，露出内页
 * seal  封面自上而下压回，盖住内页 → 此时才切 DOM
 * release 封面继续下沉离场，露出档案架
 */
const OPEN_ARM = 260
const OPEN_REVEAL = 440
const CLOSE_SEAL = 220
const CLOSE_RELEASE = 340

export default function usePortfolioController() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedIndex = getProjectIndex(searchParams.get('project'))
  const [selection, setSelection] = useState({
    localIndex: requestedIndex >= 0 ? requestedIndex : 0,
    requestedIndex,
  })
  const [phase, setPhase] = useState<'idle' | 'opening' | 'closing'>('idle')
  const [unseal, setUnseal] = useState<UnsealMode | null>(null)
  if (selection.requestedIndex !== requestedIndex) {
    setSelection({
      localIndex: requestedIndex >= 0 ? requestedIndex : selection.localIndex,
      requestedIndex,
    })
  }
  const activeIndex = requestedIndex >= 0 ? requestedIndex : selection.localIndex
  const isDetailOpen = requestedIndex >= 0
  const stageRef = useRef<HTMLElement>(null)
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const phaseRef = useRef(phase)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const suppressClick = useRef(false)
  const wheelState = useRef({ total: 0, lastEvent: 0, lastSwitch: -Infinity })
  const wasDetailOpen = useRef(false)

  const updatePhase = useCallback((next: typeof phase) => {
    phaseRef.current = next
    setPhase(next)
  }, [])

  const rememberSelection = useCallback((index: number) => {
    setSelection(previous => ({ ...previous, localIndex: normalizeProjectIndex(index) }))
  }, [])

  const navigate = useCallback((index: number, detail: boolean) => {
    const next = normalizeProjectIndex(index)
    rememberSelection(next)
    setSearchParams(previous => {
      const params = new URLSearchParams(previous)
      if (detail) params.set('project', PROJECTS[next].id)
      else params.delete('project')
      return params
    })
  }, [rememberSelection, setSearchParams])

  const selectProject = useCallback((index: number) => {
    if (phaseRef.current !== 'idle') return
    if (isDetailOpen) navigate(index, true)
    else rememberSelection(index)
  }, [isDetailOpen, navigate, rememberSelection])

  const clearTimers = useCallback(() => {
    if (swapTimer.current) {
      clearTimeout(swapTimer.current)
      swapTimer.current = null
    }
    if (releaseTimer.current) {
      clearTimeout(releaseTimer.current)
      releaseTimer.current = null
    }
  }, [])

  const transition = useCallback((index: number, detail: boolean) => {
    if (phaseRef.current !== 'idle') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigate(index, detail)
      return
    }
    updatePhase(detail ? 'opening' : 'closing')
    setUnseal(detail ? 'arm' : 'seal')
    swapTimer.current = setTimeout(() => {
      swapTimer.current = null
      // 封套已完整覆盖舞台：此刻切换场景，用户看不到 DOM 替换
      navigate(index, detail)
      setUnseal(detail ? 'reveal' : 'release')
      releaseTimer.current = setTimeout(() => {
        releaseTimer.current = null
        updatePhase('idle')
        setUnseal(null)
      }, detail ? OPEN_REVEAL : CLOSE_RELEASE)
    }, detail ? OPEN_ARM : CLOSE_SEAL)
  }, [navigate, updatePhase])

  const openDetails = (index = activeIndex) => {
    if (phaseRef.current !== 'idle') return
    rememberSelection(index)
    transition(index, true)
  }
  const closeDetails = () => transition(activeIndex, false)
  const goNext = (direction: 1 | -1) => selectProject(activeIndex + direction)

  useEffect(() => clearTimers, [clearTimers])

  useEffect(() => {
    if (isDetailOpen) {
      stageRef.current?.querySelector<HTMLElement>('#portfolio-detail-title')?.focus({ preventScroll: true })
      stageRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' })
    } else if (wasDetailOpen.current) {
      stageRef.current?.querySelector<HTMLButtonElement>('.portfolio-card.is-active')?.focus({ preventScroll: true })
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
    wasDetailOpen.current = isDetailOpen
  }, [isDetailOpen, requestedIndex])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage || isDetailOpen) return
    const wheel = wheelState.current
    const handleWheel = (event: WheelEvent) => {
      if (phaseRef.current !== 'idle' || event.ctrlKey || event.metaKey || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
      const now = performance.now()
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1
      const delta = event.deltaY * unit
      if (Math.abs(delta) < 2) return
      event.preventDefault()
      if (now - wheel.lastSwitch < 360) return
      if (now - wheel.lastEvent > 140 || Math.sign(wheel.total) !== Math.sign(delta)) wheel.total = 0
      wheel.lastEvent = now
      wheel.total += delta
      if (Math.abs(wheel.total) >= 45) {
        selectProject(activeIndex + (wheel.total > 0 ? 1 : -1))
        wheel.total = 0
        wheel.lastSwitch = now
      }
    }
    stage.addEventListener('wheel', handleWheel, { passive: false })
    return () => stage.removeEventListener('wheel', handleWheel)
  }, [activeIndex, isDetailOpen, selectProject])

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    suppressClick.current = false
    touchStart.current = null
    if (event.pointerType === 'touch' && event.isPrimary) {
      touchStart.current = { x: event.clientX, y: event.clientY }
    }
  }
  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'touch' || !event.isPrimary) return
    const start = touchStart.current
    touchStart.current = null
    if (!start || isDetailOpen) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      suppressClick.current = true
      goNext(dx < 0 ? 1 : -1)
    }
  }
  const handleCardClick = (index: number, event: MouseEvent<HTMLButtonElement>) => {
    const shouldSuppress = suppressClick.current && event.detail > 0
    suppressClick.current = false
    if (shouldSuppress) return
    if (index === activeIndex) openDetails()
    else selectProject(index)
  }
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.defaultPrevented || hasKeyModifier(event)) return
    if (event.key === 'Escape' && isDetailOpen) {
      event.preventDefault()
      closeDetails()
      return
    }
    const step = getProjectStep(event)
    if (step && !isDetailOpen && event.target === event.currentTarget) {
      event.preventDefault()
      goNext(step)
    }
  }

  return {
    activeIndex, isDetailOpen, phase, unseal, stageRef, selectProject, openDetails, closeDetails,
    goNext, handleCardClick, handleKeyDown, handlePointerDown, handlePointerUp,
    cancelSwipe: () => { touchStart.current = null },
  }
}

export type PortfolioController = ReturnType<typeof usePortfolioController>
