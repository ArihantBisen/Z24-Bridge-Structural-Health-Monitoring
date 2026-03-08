import { useState, useEffect } from 'react'
import axios from 'axios'
import { MapPin, Calendar, Gauge, AlertTriangle } from 'lucide-react'

const SEVERITY_COLORS = {
  Healthy: 'bg-green-500/20 text-green-400 border-green-500/30',
  Minor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Moderate: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Severe: 'bg-red-500/20 text-red-400 border-red-500/30',
  Critical: 'bg-red-700/20 text-red-300 border-red-700/30',
  Extreme: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

export default function Experiment() {
  const [overview, setOverview] = useState(null)
  const [scenarios, setScenarios] = useState([])

  useEffect(() => {
    axios.get('/api/experiment/overview').then(r => setOverview(r.data))
    axios.get('/api/experiment/damage-scenarios').then(r => setScenarios(r.data.scenarios))
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">The Z24 Bridge Experiment</h1>
      <p className="text-gray-400 text-lg mb-10">
        One of the most comprehensive structural health monitoring datasets ever created.
      </p>

      {/* Overview */}
      {overview && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-10">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-emerald-400 mb-4">Bridge Details</h2>
              <div className="space-y-3">
                {[
                  { icon: MapPin, label: 'Location', value: overview.location },
                  { icon: Calendar, label: 'Built / Demolished', value: `${overview.built} / ${overview.demolished}` },
                  { icon: Gauge, label: 'Span', value: overview.span },
                  { icon: AlertTriangle, label: 'Damage Scenarios', value: overview.damage_scenarios },
                ].map(({ icon: Icon, label, value }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-400">{label}:</span>
                    <span className="text-white font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-emerald-400 mb-4">About</h2>
              <p className="text-gray-300 leading-relaxed">{overview.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Damage Scenarios */}
      <h2 className="text-2xl font-bold mb-6">17 Damage Scenarios</h2>
      <div className="grid gap-3">
        {scenarios.map(s => (
          <div key={s.class} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-lg font-bold text-emerald-400">
              {String(s.class).padStart(2, '0')}
            </div>
            <div className="flex-1">
              <div className="font-medium text-white">{s.name}</div>
              <div className="text-sm text-gray-500">{s.type}</div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${SEVERITY_COLORS[s.severity] || ''}`}>
              {s.severity}
            </span>
            <div className="text-right w-24">
              <div className="text-sm font-medium text-white">{s.rul_years} yrs</div>
              <div className="text-xs text-gray-500">RUL</div>
            </div>
            <div className="w-32">
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(1 - s.dsi) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">DSI: {s.dsi}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}