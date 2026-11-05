import { lazy, Suspense } from 'react'
import { usePageReady } from '../../utils/pageReady'

const MarkdownEditor = lazy(() => import('../../components/MarkdownEditor'))

export default function EditorPage() {
  usePageReady()

  return (
    <Suspense
      fallback={
        <div className="markdown-editor-loading" aria-label="编辑器加载中" />
      }
    >
      <MarkdownEditor />
    </Suspense>
  )
}
