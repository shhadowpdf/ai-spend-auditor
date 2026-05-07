import {Routes, Route} from 'react-router-dom'
import {Home, Audit, Results} from './pages/export'
import { useEffect } from 'react'
import { axiosInstance } from './lib/axios'

function App() {

  const fetchData = async () => {
    try {
      const res = await axiosInstance.get('/health');
      console.log('Response:', res.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);


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
