import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import { Activity, FlaskConical, BarChart3, Upload, Info } from 'lucide-react'
import Home from './pages/Home'
import Experiment from './pages/Experiment'
import Results from './pages/Results'
import Analyzer from './pages/Analyzer'
import About from './pages/About'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        {/* Navigation */}
        <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <NavLink to="/" className="flex items-center gap-2">
                <Activity className="w-6 h-6 text-emerald-400" />
                <span className="text-lg font-bold text-white">Z24 Bridge SHM</span>
              </NavLink>
              <div className="flex gap-1">
                {[
                  { to: '/', label: 'Home', icon: Activity },
                  { to: '/experiment', label: 'Experiment', icon: FlaskConical },
                  { to: '/results', label: 'Results', icon: BarChart3 },
                  { to: '/analyzer', label: 'Analyzer', icon: Upload },
                  { to: '/about', label: 'About', icon: Info },
                ].map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {/* Pages */}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/experiment" element={<Experiment />} />
            <Route path="/results" element={<Results />} />
            <Route path="/analyzer" element={<Analyzer />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App