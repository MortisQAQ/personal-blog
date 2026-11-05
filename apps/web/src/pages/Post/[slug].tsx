import ArticleReader from '../../components/Blog/ArticleReader'
import { usePageReady } from '../../utils/pageReady'

export default function PostPage() {
  usePageReady()

  return <ArticleReader />
}
