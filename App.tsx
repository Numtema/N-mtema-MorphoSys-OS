import React, { useState, useRef, useEffect } from 'react';
import { CognitiveState, INITIAL_STATE } from './types';
import { processCognitiveInput } from './services/gemini';
import CognitiveVisualizer from './components/CognitiveVisualizer';
import MetricsPanel from './components/MetricsPanel';
import MorphicFluxLog from './components/MorphicFluxLog';

const App: React.FC = () => {
  const [input, setInput] = useState("");
  const [cognitiveState, setCognitiveState] = useState<CognitiveState>(INITIAL_STATE);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-focus input on load
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const currentInput = input;
    setInput(""); // Clear input early for better UX
    setIsProcessing(true);

    // Update history locally first
    const newHistory = [...history, `USER: ${currentInput}`];
    // Optimistically update the log part of the state if we wanted, 
    // but here we just wait for the full state update.

    try {
      const newState = await processCognitiveInput(currentInput, newHistory);
      setCognitiveState(newState);
      setHistory([...newHistory, `SYSTEM: ${newState.final_output}`]);
    } catch (err) {
      console.error(err);
      const errorMsg = String(err);
      setHistory([...newHistory, `SYSTEM_ERROR: ${errorMsg}`]);
      setCognitiveState(prev => ({
          ...prev,
          final_output: `ERROR: ${errorMsg}`
      }));
    } finally {
      setIsProcessing(false);
      // Re-focus after processing
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex h-screen w-full bg-numtema-bg text-numtema-text overflow-hidden selection:bg-numtema-primary selection:text-black">
      {/* Sidebar / Branding */}
      <aside className="w-16 md:w-20 bg-numtema-panel border-r border-numtema-border flex flex-col items-center py-6 gap-6 z-20 shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-numtema-primary to-numtema-secondary flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-pulse-slow">
           <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
           </svg>
        </div>
        <div className="flex-1 w-full flex flex-col items-center gap-4">
            <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${isProcessing ? 'bg-numtema-accent animate-ping' : 'bg-green-500'}`}></div>
            <div className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-mono text-numtema-muted tracking-widest opacity-50 whitespace-nowrap">
                MORPHOSYS V1.0
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden h-full">
        {/* Header */}
        <header className="h-14 shrink-0 border-b border-numtema-border flex items-center px-6 justify-between bg-numtema-bg/80 backdrop-blur-sm z-10">
           <h1 className="font-mono font-bold text-lg tracking-tight flex items-center">
             <span className="text-numtema-primary">Nümtema</span>
             <span className="text-numtema-muted mx-2">/</span>
             <span className="text-white">MorphoSys OS</span>
           </h1>
           <div className="flex items-center gap-4 text-xs font-mono text-numtema-muted">
              <span className={isProcessing ? "text-numtema-accent animate-pulse" : ""}>CPU_COGNITIVE: {isProcessing ? 'BUSY' : 'IDLE'}</span>
              <span>API: GEMINI-3-FLASH</span>
           </div>
        </header>

        {/* Dashboard Grid - Scrollable Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-32">
           
           <MetricsPanel state={cognitiveState} />

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px] lg:h-[500px] mb-6">
              {/* Visualizer */}
              <div className="lg:col-span-2 bg-numtema-panel border border-numtema-border rounded-lg flex flex-col shadow-lg overflow-hidden">
                 <div className="h-10 border-b border-numtema-border flex items-center px-4 justify-between bg-numtema-bg/50 shrink-0">
                    <span className="text-xs font-mono font-bold text-numtema-primary">COGNITIVE_SPACE_VISUALIZER</span>
                    <span className="text-[10px] font-mono text-numtema-muted">{cognitiveState.objects.length} OBJECTS</span>
                 </div>
                 <div className="flex-1 relative w-full h-full min-h-0">
                    <CognitiveVisualizer objects={cognitiveState.objects} />
                    {isProcessing && (
                        <div className="absolute inset-0 bg-numtema-bg/20 backdrop-blur-[1px] flex items-center justify-center z-10 pointer-events-none">
                            <div className="text-numtema-primary font-mono animate-pulse bg-numtema-bg/80 px-4 py-2 rounded border border-numtema-primary/30">
                                GENERATING MORPHISMS...
                            </div>
                        </div>
                    )}
                 </div>
              </div>

              {/* Log */}
              <div className="lg:col-span-1 h-full min-h-0">
                 <MorphicFluxLog flux={cognitiveState.flux} />
              </div>
           </div>

           {/* Output Area */}
           <div className="bg-numtema-panel border border-numtema-border rounded-lg p-6 min-h-[200px] shadow-lg mb-20 animate-fadeIn">
              <div className="text-xs font-mono text-numtema-muted mb-4 border-b border-numtema-border pb-2 flex justify-between items-center">
                  <span>FINAL_OUTPUT</span>
                  {cognitiveState.final_output !== INITIAL_STATE.final_output && (
                      <button 
                        onClick={() => navigator.clipboard.writeText(cognitiveState.final_output)}
                        className="hover:text-numtema-primary transition-colors text-[10px] border border-numtema-border px-2 py-1 rounded hover:border-numtema-primary">
                        COPY
                      </button>
                  )}
              </div>
              <div className="prose prose-invert prose-sm max-w-none font-sans whitespace-pre-wrap leading-relaxed text-gray-300">
                  {cognitiveState.final_output}
              </div>
           </div>
           
           <div ref={logEndRef} />
        </div>

        {/* Command Center (Sticky Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 bg-numtema-bg/90 backdrop-blur-md border-t border-numtema-border p-4 z-30">
           <div className="max-w-5xl mx-auto flex gap-4">
              <div className="flex-1 relative">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter command, objective, or complex query..."
                    className="w-full bg-numtema-panel border border-numtema-border rounded-md px-4 py-3 text-sm font-mono focus:outline-none focus:border-numtema-primary focus:ring-1 focus:ring-numtema-primary resize-none h-14 transition-all placeholder:text-numtema-muted/50"
                    disabled={isProcessing}
                />
                <div className="absolute right-3 bottom-3 text-[10px] text-numtema-muted hidden md:block opacity-60">
                    RETURN to send
                </div>
              </div>
              <button 
                onClick={() => handleSubmit()}
                disabled={isProcessing || !input.trim()}
                className={`px-6 rounded-md font-mono font-bold text-sm transition-all duration-200 flex items-center gap-2 ${
                    isProcessing 
                    ? 'bg-numtema-border cursor-not-allowed opacity-50 text-numtema-muted' 
                    : 'bg-numtema-primary hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                }`}
              >
                {isProcessing ? 'THINKING' : 'EXECUTE'}
                {!isProcessing && <span className="text-lg leading-none">→</span>}
              </button>
           </div>
        </div>

      </main>
    </div>
  );
};

export default App;