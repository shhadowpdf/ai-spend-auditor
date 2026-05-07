import {Routes, Route} from 'react-router-dom'
import {Home, Audit, Results} from './pages/export'

function App() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/audit" element={<Audit />} />
      <Route path="/results" element={<Results />} />
    </Routes>
    </div>
  )
}

export default App
