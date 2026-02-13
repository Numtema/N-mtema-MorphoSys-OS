import React from 'react';
import { CognitiveState, CognitiveMode } from '../types';

interface Props {
  state: CognitiveState;
}

const MetricsPanel: React.FC<Props> = ({ state }) => {
  const { metrics, mode } = state;

  // Safe color mapping
  const modeColor = {
    [CognitiveMode.EXPLORATION]: 'text-yellow-400',
    [CognitiveMode.STABILIZATION]: 'text-blue-400',
    [CognitiveMode.OPTIMIZATION]: 'text-green-400',
    [CognitiveMode.REVISION]: 'text-red-400',
  }[mode as string] || 'text-white';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-numtema-panel border border-numtema-border p-4 rounded-lg shadow-sm hover:border-numtema-primary/50 transition-colors">
        <div className="text-[10px] text-numtema-muted font-mono uppercase tracking-widest mb-1">System Mode</div>
        <div className={`text-xl font-bold font-mono ${modeColor} uppercase tracking-tighter`}>{mode}</div>
      </div>

      <div className="bg-numtema-panel border border-numtema-border p-4 rounded-lg relative overflow-hidden group">
        <div className="text-[10px] text-numtema-muted font-mono uppercase tracking-widest mb-1 flex justify-between">
            <span>Entropy (H)</span>
            <span className="text-white/20">MAX:5.0</span>
        </div>
        <div className="text-xl font-bold font-mono text-numtema-text">{metrics.entropy.toFixed(3)}</div>
        <div className="absolute bottom-0 left-0 h-1 bg-numtema-border w-full">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700 ease-out" style={{ width: `${Math.min((metrics.entropy / 5) * 100, 100)}%` }}></div>
        </div>
      </div>

      <div className="bg-numtema-panel border border-numtema-border p-4 rounded-lg relative overflow-hidden group">
        <div className="text-[10px] text-numtema-muted font-mono uppercase tracking-widest mb-1 flex justify-between">
             <span>Potential (U)</span>
             <span className="text-white/20">MAX:1.0</span>
        </div>
        <div className="text-xl font-bold font-mono text-numtema-text">{metrics.potential.toFixed(3)}</div>
        <div className="absolute bottom-0 left-0 h-1 bg-numtema-border w-full">
             <div className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all duration-700 ease-out" style={{ width: `${Math.min(metrics.potential * 100, 100)}%` }}></div>
        </div>
      </div>

      <div className="bg-numtema-panel border border-numtema-border p-4 rounded-lg relative overflow-hidden group">
         <div className="flex justify-between items-center mb-1">
            <div className="text-[10px] text-numtema-muted font-mono uppercase tracking-widest">Pred. Error (ε)</div>
            <div className={`text-[9px] font-mono px-1 rounded ${metrics.prediction_error > 0.5 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                {metrics.prediction_error > 0.5 ? 'HIGH' : 'NOMINAL'}
            </div>
         </div>
        <div className="text-xl font-bold font-mono text-numtema-text">{metrics.prediction_error.toFixed(3)}</div>
        <div className="absolute bottom-0 left-0 h-1 bg-numtema-border w-full">
            <div className="h-full bg-gradient-to-r from-numtema-accent to-red-800 transition-all duration-700 ease-out" style={{ width: `${Math.min(metrics.prediction_error * 100, 100)}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export default MetricsPanel;