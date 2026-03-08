import { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart,
         PolarGrid, PolarAngleAxis, Radar, PieChart, Pie } from 'recharts'

const MODEL_COLORS = { 'WaveNet v4': '#facc15', 'MiniRocket': '#3b82f6', 'InceptionTime': '#a855f7' }

export default function Results() {
  const [data, setData] = useState(null)

  useEffect(() => {
    axios.get('/api/models/results').then(r => setData(r.data))
  }, [])

  if (!data) return <div className="text-center py-20 text-gray-500">Loading...</div>

  const modelData = Object.entries(data.models).map(([name, info]) => ({
    name, accuracy: info.test_accuracy, params: info.parameters, color: MODEL_COLORS[name]
  }))

  const ensembleData = Object.entries(data.ensembles).map(([name, acc]) => ({
    name: name.length > 25 ? name.slice(0, 25) + '...' : name, accuracy: acc
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">Model Results</h1>
      <p className="text-gray-400 text-lg mb-10">
        Comprehensive performance analysis across all models and ensemble methods.
      </p>

      {/* Individual Models */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {modelData.map(m => (
          <div key={m.name} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-1">{m.name}</h3>
            <div className="text-4xl font-bold mt-3" style={{ color: m.color }}>
              {m.accuracy}%
            </div>
            <div className="text-sm text-gray-500 mt-1">Test Accuracy (17-class)</div>
            <div className="mt-4 h-3 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${m.accuracy}%`, backgroundColor: m.color }} />
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Parameters: {typeof m.params === 'number' ? m.params.toLocaleString() : m.params}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {/* Model Comparison Bar Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Individual Model Accuracy</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={modelData}>
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis domain={[0, 70]} tick={{ fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
              <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                {modelData.map((m, i) => <Cell key={i} fill={m.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ensemble Comparison */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Ensemble Methods</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ensembleData} layout="vertical">
              <XAxis type="number" domain={[0, 70]} tick={{ fill: '#9ca3af' }} />
              <YAxis type="category" dataKey="name" width={180} tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
              <Bar dataKey="accuracy" fill="#10b981" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hierarchical Results */}
      <div className="bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 border border-emerald-500/20 rounded-xl p-8">
        <h3 className="text-2xl font-bold text-white mb-2">Novel: Hierarchical Classification</h3>
        <p className="text-gray-400 mb-6">Two-stage approach: first identify damage type, then classify severity within group.</p>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-400">{data.hierarchical.group_accuracy}%</div>
            <div className="text-sm text-gray-400 mt-1">Stage 1: Damage Type (5 groups)</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-cyan-400">{data.hierarchical.final_accuracy}%</div>
            <div className="text-sm text-gray-400 mt-1">Stage 2: Exact Class (17 classes)</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-400">{data.best_result}%</div>
            <div className="text-sm text-gray-400 mt-1">Best Overall (3-Model Ensemble)</div>
          </div>
        </div>
      </div>
    </div>
  )
}