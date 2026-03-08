import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Brain, Shield, ArrowRight, Zap, Target, Layers } from 'lucide-react'
import axios from 'axios'

export default function Home() {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    axios.get('/api/health').then(r => setHealth(r.data)).catch(() => {})
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-gray-950 to-cyan-900/20" />
        <div className="relative max-w-7xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-8">
            <Activity className="w-4 h-4" />
            AI-Powered Structural Health Monitoring
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-white">Z24 Bridge</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Health Monitor
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
            Deep learning models classify structural damage from vibration data
            and estimate remaining bridge lifespan with confidence intervals.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/analyzer"
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors"
            >
              Analyze Bridge Data <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/experiment"
              className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-colors"
            >
              Learn About Z24
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: '63.1%', label: 'Best Accuracy', sub: '17-class classification' },
            { value: '83.4%', label: 'Group Accuracy', sub: 'Damage type detection' },
            { value: '3', label: 'Deep Learning Models', sub: 'WaveNet + InceptionTime + MiniRocket' },
            { value: '10.7×', label: 'vs Random', sub: 'Above random baseline' },
          ].map((s, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-emerald-400">{s.value}</div>
              <div className="text-sm font-medium text-white mt-1">{s.label}</div>
              <div className="text-xs text-gray-500 mt-1">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Models */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Three Model Architecture</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10',
              name: 'WaveNet', acc: '52.9%', params: '227K',
              desc: 'Dilated causal convolutions capture long-range temporal patterns in vibration signals.'
            },
            {
              icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/10',
              name: 'MiniRocket', acc: '37.6%', params: '10K features',
              desc: 'Random convolutional kernels extract time-series features for fast classification.'
            },
            {
              icon: Layers, color: 'text-purple-400', bg: 'bg-purple-500/10',
              name: 'InceptionTime', acc: '57.0%', params: '492K',
              desc: 'Multi-scale parallel convolutions capture patterns at different time resolutions.'
            },
          ].map((m, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className={`inline-flex p-3 rounded-lg ${m.bg} mb-4`}>
                <m.icon className={`w-6 h-6 ${m.color}`} />
              </div>
              <h3 className="text-xl font-bold text-white">{m.name}</h3>
              <div className="flex gap-4 mt-2 mb-3">
                <span className="text-sm text-emerald-400">{m.acc} accuracy</span>
                <span className="text-sm text-gray-500">{m.params} params</span>
              </div>
              <p className="text-gray-400 text-sm">{m.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 border border-emerald-500/20 rounded-xl p-6 text-center">
          <div className="text-2xl font-bold text-emerald-400">Ensemble: 63.1% Accuracy</div>
          <p className="text-gray-400 mt-2">Stacking all three models with a LogReg meta-learner achieves the best performance</p>
        </div>
      </section>

      {/* Backend Status */}
      {health && (
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${health.status === 'healthy' ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className="text-sm text-gray-400">
              Backend: {health.status} | Models loaded: {Object.values(health.models || {}).filter(v => v === true).length}/3
            </span>
          </div>
        </section>
      )}
    </div>
  )
}