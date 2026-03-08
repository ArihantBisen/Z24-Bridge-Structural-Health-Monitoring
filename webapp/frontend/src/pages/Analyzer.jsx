import { useState, useCallback } from 'react'
import axios from 'axios'
import { Upload, FileUp, AlertCircle, CheckCircle, Clock, Shield, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const SEVERITY_STYLES = {
  Healthy:  { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  Minor:    { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  Moderate: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  Severe:   { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  Critical: { bg: 'bg-red-700/20', text: 'text-red-300', border: 'border-red-700/30' },
  Extreme:  { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
}

export default function Analyzer() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  const analyze = async (file) => {
    setLoading(true); setError(null); setResult(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await axios.post('/api/predict/analyze', form)
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const runDemo = async () => {
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await axios.get('/api/predict/demo')
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Demo failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) analyze(file)
  }, [])

  const handleFileInput = (e) => {
    const file = e.target.files[0]
    if (file) analyze(file)
  }

  const sev = result ? SEVERITY_STYLES[result.severity] || SEVERITY_STYLES.Moderate : null

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">Bridge Analyzer</h1>
      <p className="text-gray-400 text-lg mb-10">
        Upload sensor data to classify damage and estimate remaining lifespan.
      </p>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragActive ? 'border-emerald-400 bg-emerald-500/5' : 'border-gray-700 hover:border-gray-500'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <FileUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <p className="text-lg text-gray-300 mb-2">Drag & drop a .mat or .csv file</p>
        <p className="text-sm text-gray-500 mb-6">Accelerometer time-series data</p>
        <div className="flex gap-4 justify-center">
          <label className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold cursor-pointer transition-colors">
            Browse Files
            <input type="file" className="hidden" accept=".mat,.csv" onChange={handleFileInput} />
          </label>
          <button
            onClick={runDemo}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-colors"
          >
            Run Demo Signal
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-gray-900 rounded-xl">
            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-300">Analyzing signal with 3 models...</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-8 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-300">{error}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-6">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className={`rounded-xl p-6 border ${sev.bg} ${sev.border}`}>
              <Shield className={`w-8 h-8 ${sev.text} mb-2`} />
              <div className={`text-2xl font-bold ${sev.text}`}>{result.severity}</div>
              <div className="text-sm text-gray-400 mt-1">Severity Level</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <Activity className="w-8 h-8 text-emerald-400 mb-2" />
              <div className="text-2xl font-bold text-white">
                Class {String(result.predicted_class).padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-400 mt-1">{result.class_name}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <Clock className="w-8 h-8 text-cyan-400 mb-2" />
              <div className="text-2xl font-bold text-white">{result.rul_years} yrs</div>
              <div className="text-sm text-gray-400 mt-1">
                [{result.rul_ci_low} – {result.rul_ci_high}] 90% CI
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <CheckCircle className="w-8 h-8 text-yellow-400 mb-2" />
              <div className="text-2xl font-bold text-white">
                {(result.confidence * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400 mt-1">Confidence</div>
             
              {/* <div className="text-2xl font-bold text-white">
                {(result.confidence * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Confidence ({(result.confidence / (1/17)).toFixed(1)}× vs random)
              </div> */}
            </div>
          </div>

          {/* Recommended Action */}
          <div className={`p-6 rounded-xl border ${sev.bg} ${sev.border}`}>
            <h3 className="font-bold text-white mb-2">Recommended Action</h3>
            <p className={`${sev.text}`}>{result.recommended_action}</p>
          </div>

          {/* Probability Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Class Probabilities (Ensemble)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={result.all_classes.map(c => ({
                name: String(c.class).padStart(2, '0'),
                prob: (c.probability * 100),
                isPredicted: c.class === result.predicted_class,
              }))}>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(v) => [`${v.toFixed(1)}%`, 'Probability']}
                />
                <Bar dataKey="prob" radius={[4, 4, 0, 0]}>
                  {result.all_classes.map((c, i) => (
                    <Cell key={i} fill={c.class === result.predicted_class ? '#10b981' : '#374151'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* DSI Gauge */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Damage Severity Index</h3>
            <div className="relative h-8 bg-gray-800 rounded-full overflow-hidden">
              <div className="absolute inset-0 flex">
                <div className="flex-1 bg-green-500/30" />
                <div className="flex-1 bg-yellow-500/30" />
                <div className="flex-1 bg-orange-500/30" />
                <div className="flex-1 bg-red-500/30" />
                <div className="flex-1 bg-purple-500/30" />
              </div>
              <div
                className="absolute top-0 bottom-0 w-1 bg-white rounded-full shadow-lg"
                style={{ left: `${result.dsi * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Healthy (0.0)</span>
              <span>Minor</span>
              <span>Moderate</span>
              <span>Severe</span>
              <span>Extreme (1.0)</span>
            </div>
            <div className="text-center mt-4">
              <span className="text-3xl font-bold text-white">{result.dsi}</span>
              <span className="text-gray-400 ml-2">/ 1.0</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}