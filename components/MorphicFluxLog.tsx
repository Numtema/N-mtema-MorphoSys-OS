import React, { useEffect, useRef } from 'react';
import { MorphicTrace } from '../types';

interface Props {
  flux: MorphicTrace[];
}

const MorphicFluxLog: React.FC<Props> = ({ flux }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on new flux items
    if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [flux]);

  return (
    <div className="bg-numtema-panel border border-numtema-border rounded-lg h-full flex flex-col font-mono text-xs overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 border-b border-numtema-border bg-numtema-bg/30">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-numtema-secondary animate-pulse"></div>
            <span className="text-numtema-primary font-bold">MORPHIC_FLUX_LOG</span>
        </div>
        <span className="text-numtema-muted opacity-50 text-[10px]">/var/log/morphosys</span>
      </div>
      
      <div ref={containerRef} className="overflow-y-auto flex-1 p-3 space-y-1 scroll-smooth">
        {flux.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-numtema-muted opacity-30 italic">
            <span>No morphic activity...</span>
          </div>
        )}
        {flux.map((trace, idx) => (
          <div key={idx} className="flex gap-2 p-1.5 rounded hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-numtema-secondary animate-fadeIn">
             <span className="text-numtema-muted font-bold min-w-[24px]">[{String(trace.step).padStart(2, '0')}]</span>
             <div className="flex-1 flex flex-col">
                 <div className="flex justify-between items-baseline">
                    <span className="text-numtema-secondary font-bold uppercase text-[10px] tracking-wider">{trace.morphism}</span>
                    <span className={`font-mono text-[9px] ${trace.epsilon > 0.5 ? 'text-numtema-accent' : 'text-green-500'}`}>
                        ε:{trace.epsilon.toFixed(2)}
                    </span>
                 </div>
                 <span className="text-gray-300 mt-0.5">{trace.description}</span>
             </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default MorphicFluxLog;