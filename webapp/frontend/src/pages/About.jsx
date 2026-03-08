export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">About This Project</h1>
      <p className="text-gray-400 text-lg mb-10">
        Engineering capstone project: AI-powered structural health monitoring.
      </p>

      <div className="space-y-8">
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-emerald-400 mb-4">Project Overview</h2>
          <p className="text-gray-300 leading-relaxed">
            This project applies deep learning to structural health monitoring (SHM) using the Z24 Bridge
            Progressive Damage Test dataset. Three models — WaveNet, MiniRocket, and InceptionTime —
            classify 17 damage scenarios from raw accelerometer vibration data. An ensemble method
            combines all three models for optimal accuracy, and a novel hierarchical classification
            approach first identifies damage type before classifying severity.
          </p>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-emerald-400 mb-4">Technical Stack</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-white mb-2">Machine Learning</h3>
              <ul className="space-y-1 text-gray-400 text-sm">
                <li>PyTorch — WaveNet & InceptionTime training</li>
                <li>scikit-learn / sktime — MiniRocket pipeline</li>
                <li>NumPy, SciPy — Signal processing & analysis</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">Web Application</h3>
              <ul className="space-y-1 text-gray-400 text-sm">
                <li>FastAPI — Backend REST API</li>
                <li>React + Vite — Frontend SPA</li>
                <li>Tailwind CSS — Styling</li>
                <li>Recharts — Data visualization</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-emerald-400 mb-4">Key Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '63.1%', label: 'Best Ensemble Accuracy' },
              { value: '83.4%', label: 'Damage Type Detection' },
              { value: '97.7%', label: 'Settlement Severity' },
              { value: '10.7×', label: 'Above Random Baseline' },
            ].map((s, i) => (
              <div key={i} className="text-center p-4 bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-emerald-400">{s.value}</div>
                <div className="text-xs text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-emerald-400 mb-4">References</h2>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>Maeck, J. & De Roeck, G. (2003). "Description of Z24 Benchmark." Mechanical Systems and Signal Processing.</li>
            <li>Oord, A. van den et al. (2016). "WaveNet: A Generative Model for Raw Audio." DeepMind.</li>
            <li>Dempster, A. et al. (2021). "MiniRocket: A Very Fast (Almost) Deterministic Transform for Time Series Classification."</li>
            <li>Fawaz, H. I. et al. (2020). "InceptionTime: Finding AlexNet for Time Series Classification."</li>
          </ul>
        </section>
      </div>
    </div>
  )
}