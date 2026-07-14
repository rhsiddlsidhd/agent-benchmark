import { NaverTrendPanel } from './components/naver-trend/NaverTrendPanel'
import { PostsTrendPanel } from './components/posts/PostsTrendPanel'
import { PostsSummaryPanel } from './components/posts/PostsSummaryPanel'
import './App.css'

function App() {
  return (
    <>
      <NaverTrendPanel />
      <PostsTrendPanel />
      <PostsSummaryPanel />
    </>
  )
}

export default App
