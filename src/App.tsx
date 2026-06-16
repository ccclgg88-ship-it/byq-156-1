import { Routes, Route, Navigate } from 'react-router-dom'
import MapPage from './pages/MapPage'
import GamePage from './pages/GamePage'

function App() {
  return (
    <div className="w-full h-full bg-cream">
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/game/:levelId" element={<GamePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
