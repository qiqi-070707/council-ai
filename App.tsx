import React, { useState, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DesignConstraints, DesignResult, DebateMessage, AgentRole, DesignSolution } from './types';
import { runDesignDebate } from './services/geminiService';
import { AgentBubble } from './components/AgentBubble';

const App: React.FC = () => {
  const [step, setStep] = useState<'landing' | 'input' | 'debating' | 'result'>('landing');
  const [prompt, setPrompt] = useState('');
  const [constraints, setConstraints] = useState<DesignConstraints>({
    purpose: '',
    brandTone: '',
    targetAudience: '',
    pricePoint: 'Premium',
    mode: 'quick'
  });
  const [imageInput, setImageInput] = useState<string | null>(null);
  const [result, setResult] = useState<DesignResult | null>(null);
  const [selectedSolutionIndex, setSelectedSolutionIndex] = useState<number>(0);
  const [activeAgent, setActiveAgent] = useState<AgentRole | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentRole | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  
  const [visibleMessages, setVisibleMessages] = useState<DebateMessage[]>([]);
  const [isDebating, setIsDebating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [visibleMessages, step]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageInput(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startDesignProcess = async () => {
    if (!prompt && !imageInput) return;
    setStep('debating');
    setIsFinished(false);
    setVisibleMessages([]);
    setIsDebating(true);
    setSelectedAgent(null);
    
    try {
      const designResult = await runDesignDebate(prompt, imageInput, constraints);
      setResult(designResult);
      setSelectedSolutionIndex(0);
      
      const history = designResult.debateHistory;
      for (let i = 0; i < history.length; i++) {
        const msg = history[i];
        const currentRole = Object.values(AgentRole).find(r => r === msg.role) || msg.role as AgentRole;
        
        setActiveAgent(currentRole);
        await new Promise(resolve => setTimeout(resolve, 600 + msg.content.length * 6));
        setVisibleMessages(prev => [...prev, { ...msg, role: currentRole }]);
        if (i < history.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 400));
        }
      }
      
      setActiveAgent(null);
      setIsDebating(false);
      setIsFinished(true);
    } catch (error) {
      console.error(error);
      alert('Workshop connection interrupted. Retrying is recommended.');
      setStep('input');
    }
  };

  const saveCurrentSolution = () => {
    if (!currentSolution) return;
    const link = document.createElement('a');
    link.href = currentSolution.imageUrl;
    link.download = `council-ai-${currentSolution.title.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const iterateCurrentSolution = () => {
    if (!currentSolution) return;
    setImageInput(currentSolution.imageUrl);
    setPrompt(`Optimize the ${currentSolution.title} further based on the feedback provided in the meeting...`);
    setStep('input');
  };

  const renderAgentIcon = (role: string, isActive: boolean) => {
    const color = isActive ? 'white' : 'currentColor';
    switch (role) {
      case AgentRole.CPO:
        return <svg className="w-5 h-5" fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>;
      case AgentRole.DESIGN:
        return <svg className="w-5 h-5" fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>;
      case AgentRole.TECH:
        return <svg className="w-5 h-5" fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 00-1 1v1a2 2 0 11-4 0v-1a1 1 0 00-1-1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"/></svg>;
      case AgentRole.UX:
        return <svg className="w-5 h-5" fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>;
      case AgentRole.MARKET:
        return <svg className="w-5 h-5" fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
      default: return null;
    }
  };

  const getAgentShortName = (role: AgentRole) => {
    switch (role) {
      case AgentRole.CPO: return 'CPO';
      case AgentRole.DESIGN: return 'DESIGN';
      case AgentRole.TECH: return 'TECH';
      case AgentRole.UX: return 'UX';
      case AgentRole.MARKET: return 'MARKET';
      default: return 'AGENT';
    }
  };

  const currentSolution = result?.solutions[selectedSolutionIndex];
  const scoreData = currentSolution ? [
    { name: 'Feasibility', score: currentSolution.evaluation.technicalFeasibility },
    { name: 'Market', score: currentSolution.evaluation.marketCompetitiveness },
    { name: 'Aesthetics', score: currentSolution.evaluation.aesthetics },
    { name: 'Usability', score: currentSolution.evaluation.usability },
  ] : [];

  const avgScore = currentSolution 
    ? ((Object.values(currentSolution.evaluation) as number[]).reduce((a: number, b: number) => a + b, 0) / Object.keys(currentSolution.evaluation).length).toFixed(1)
    : "0.0";

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden relative">
      {step === 'landing' && (
        <main className="flex-1 w-full relative">
          <div className="pixel-hemisphere-top-left-container fade-up-item delay-0">
            <div className="pixel-hemisphere">
                <div className="pixel-grid reverse-rotate"></div>
                <div className="pixel-shading"></div>
            </div>
          </div>
          <div className="pixel-hemisphere-bottom-right-container fade-up-item delay-1">
            <div className="pixel-hemisphere">
                <div className="pixel-grid"></div>
                <div className="pixel-shading"></div>
            </div>
          </div>
          <div className="pixel-hemisphere-container fade-up-item delay-0">
            <div className="pixel-hemisphere">
                <div className="pixel-grid"></div>
                <div className="pixel-shading"></div>
            </div>
          </div>
          <div className="h-full flex flex-col items-center justify-center text-center p-6 relative z-10">
            <h1 className="text-8xl md:text-9xl font-bold font-display mb-10 tracking-tighter fade-up-item delay-1">
              <span className="gradient-text">Council AI</span>
            </h1>
            <p className="text-slate-400 max-w-lg mb-12 text-lg leading-relaxed font-medium fade-up-item delay-2">
              Transform your initial concepts into perfect market-ready prototypes with an elite board of AI specialists.
            </p>
            <div className="fade-up-item delay-3">
              <button onClick={() => setStep('input')} className="px-14 py-6 primary-gradient text-white font-bold rounded-full text-xl hover-elevate shadow-2xl shadow-indigo-200/40 transition-all focus:outline-none">Launch Workshop</button>
            </div>
          </div>
          <footer className="absolute bottom-10 w-full text-center opacity-30 fade-up-item delay-4 z-20">
            <p className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.8em]">Elite Intelligence Workshop &bull; 2025</p>
          </footer>
        </main>
      )}

      {step !== 'landing' && (
        <>
          <nav className="h-[76px] w-full px-12 flex items-center justify-between z-[100] nav-gradient border-b border-indigo-50/50 shrink-0">
            <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setStep('landing')}>
              <div className="w-10 h-10 primary-gradient rounded-xl rotate-45 flex items-center justify-center shadow-lg shadow-indigo-100 transition-transform duration-700">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tighter text-slate-800 leading-none uppercase">Council AI</span>
                <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mt-1">Design Studio</span>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg><span className="text-[9px] font-bold uppercase tracking-widest">Tools</span></button>
              <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg><span className="text-[9px] font-bold uppercase tracking-widest">User</span></button>
            </div>
          </nav>

          <main className="flex-1 w-full relative overflow-hidden">
            {step === 'input' && (
              <div className="max-w-7xl mx-auto h-full flex flex-col lg:flex-row gap-12 px-12 py-12 items-stretch overflow-y-auto custom-scrollbar">
                <div className="flex-1 space-y-8 fade-up-item flex flex-col justify-between pb-2">
                  <div className="space-y-4">
                    <h2 className="text-5xl font-bold tracking-tighter font-display leading-[1.1]">Transform <br/><span className="gradient-text">Vision to Reality</span></h2>
                    <p className="text-slate-400 text-sm font-medium">Define your concept. The expert board will begin a multi-round debate.</p>
                  </div>
                  <div className="space-y-6 flex-1 flex flex-col">
                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Enter your design idea or product description..." className="w-full h-44 bg-slate-50/40 border border-slate-100 rounded-[2.5rem] p-8 focus:outline-none focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50/50 transition-all text-base resize-none" />
                    <div className="border-2 border-dashed rounded-[2.5rem] p-8 flex flex-col items-center justify-center flex-1 min-h-[180px] border-slate-100 hover:bg-slate-50 hover:border-indigo-100 cursor-pointer transition-all group focus:outline-none" onClick={() => fileInputRef.current?.click()}>
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                      {imageInput ? <img src={imageInput} className="w-32 h-32 rounded-[2rem] object-cover shadow-2xl border-4 border-white transition-transform group-hover:scale-105" /> : (
                        <div className="text-center">
                          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-100 transition-colors">
                            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Upload Prototype</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex-1 glass-dark rounded-[3.5rem] p-12 space-y-8 border border-white flex flex-col self-stretch fade-up-item delay-1">
                  <div className="space-y-6 flex-1">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 ml-2">Workshop Constraints</label>
                      <input placeholder="Design Goal (e.g. Revolutionize Coffee Making)" value={constraints.purpose} onChange={e => setConstraints({...constraints, purpose: e.target.value})} className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 transition-all" />
                      <input placeholder="Target Audience (e.g. Gen Z Professionals)" value={constraints.targetAudience} onChange={e => setConstraints({...constraints, targetAudience: e.target.value})} className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 transition-all" />
                      <input placeholder="Brand Persona (e.g. Minimalist High-Tech)" value={constraints.brandTone} onChange={e => setConstraints({...constraints, brandTone: e.target.value})} className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 transition-all" />
                    </div>
                    <div className="flex gap-4 p-1.5 bg-slate-100/40 rounded-2xl border border-slate-200/40">
                      <button onClick={() => setConstraints({...constraints, mode: 'quick'})} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all focus:outline-none ${constraints.mode === 'quick' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Fast Cycle</button>
                      <button onClick={() => setConstraints({...constraints, mode: 'deep'})} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all focus:outline-none ${constraints.mode === 'deep' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Full Workshop</button>
                    </div>
                  </div>
                  <button onClick={startDesignProcess} disabled={!prompt && !imageInput} className="w-full py-6 primary-gradient text-white font-bold rounded-[2rem] hover-elevate text-lg tracking-widest uppercase shadow-xl shadow-indigo-100 disabled:opacity-30 focus:outline-none shrink-0">Initiate Board Meeting</button>
                </div>
              </div>
            )}

            {step === 'debating' && (
              <div className="max-w-[1400px] mx-auto h-full grid grid-cols-1 lg:grid-cols-12 gap-8 px-12 py-8 overflow-hidden">
                <div className="lg:col-span-5 h-full relative fade-up-item">
                  <div className="absolute inset-0 z-0 synthesis-bg-flow rounded-[6rem] opacity-70"></div>
                  <div className="w-full h-full rounded-[6rem] relative z-10 flex items-center justify-center bg-white/20 backdrop-blur-md border-2 border-indigo-50/40 shadow-inner">
                    <div className="text-center">
                      {!isFinished ? (
                        <div className="space-y-8">
                          <div className="w-28 h-28 primary-gradient rounded-full animate-pulse mx-auto flex items-center justify-center shadow-xl shadow-indigo-200">
                            <div className="w-12 h-12 border-[3.5px] border-white/20 border-t-white rounded-full animate-spin"></div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[12px] font-bold uppercase tracking-[0.5em] text-indigo-700">Synthesizing Product Form</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Live Generative Processing...</p>
                          </div>
                        </div>
                      ) : (
                        <div className="fade-up-item">
                          <div className="relative w-44 h-44 mx-auto mb-10">
                            <div className="absolute inset-0 primary-gradient rounded-full blur-2xl opacity-20 scale-125"></div>
                            <div className="relative w-full h-full bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-indigo-50">
                              <div className="w-32 h-32 primary-gradient rounded-full flex items-center justify-center shadow-lg"><svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg></div>
                            </div>
                          </div>
                          <h3 className="text-[20px] font-bold uppercase tracking-[0.6em] text-slate-800">Workshop Synthesized</h3>
                          <div className="mt-4 w-24 h-1.5 bg-indigo-500/20 mx-auto rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 flex flex-col h-full space-y-4 overflow-hidden">
                  <div className="flex items-center justify-between px-6 fade-up-item delay-1 shrink-0 bg-white/40 py-4 rounded-full border border-indigo-50/50 shadow-sm backdrop-blur-sm mx-4">
                    {Object.values(AgentRole).map(role => {
                      const isActive = activeAgent === role;
                      const isSelected = selectedAgent === role;
                      return (
                        <button key={role} onClick={() => setSelectedAgent(isSelected ? null : role)} className="flex flex-col items-center gap-1.5 group transition-all border-none bg-none p-0 cursor-pointer focus:outline-none">
                          <div className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-500 ${isActive || isSelected ? 'ring-2 ring-indigo-400/20 border-indigo-400 bg-indigo-50 shadow-inner' : 'border-slate-200/60 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'}`}>
                            <div className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${isActive || isSelected ? 'primary-gradient text-white shadow-lg scale-110' : 'text-slate-400 hover:text-indigo-400'}`}>
                              {renderAgentIcon(role, isActive || isSelected)}
                            </div>
                          </div>
                          <span className={`text-[7px] font-bold uppercase tracking-[0.2em] text-center transition-colors ${isActive || isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>{getAgentShortName(role)}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex-1 relative glass-dark rounded-[3.5rem] border-white/50 overflow-hidden fade-up-item delay-2 flex flex-col">
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-10 pb-32">
                      <div className="space-y-4">
                        {visibleMessages
                          .filter(msg => !selectedAgent || msg.role === selectedAgent)
                          .map((msg, i) => (
                            <AgentBubble key={i} message={msg} isLast={i === visibleMessages.length - 1 && !isFinished} isHighlighted={selectedAgent === msg.role} />
                          ))}
                        {!visibleMessages.length && (
                          <div className="h-full py-40 flex flex-col items-center justify-center opacity-30 space-y-4">
                             <div className="w-10 h-10 border-[2px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                             <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-900">Synchronizing...</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {isFinished && (
                      <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center bg-gradient-to-t from-white via-white/80 to-transparent fade-up-item">
                        <button onClick={() => setStep('result')} className="px-16 py-5 primary-gradient text-white font-bold rounded-[1.8rem] shadow-xl hover-elevate transition-all text-[12px] tracking-[0.3em] uppercase flex items-center gap-4 focus:outline-none">View Optimized Designs <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 'result' && result && (
              <div className="max-w-[1400px] mx-auto h-full grid grid-cols-1 lg:grid-cols-12 gap-10 px-12 py-6 overflow-hidden">
                <div className="lg:col-span-6 h-full flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 pb-6 fade-up-item">
                  {result.solutions.map((solution, idx) => (
                    <div key={idx} onClick={() => setSelectedSolutionIndex(idx)} className={`relative flex-1 min-h-[220px] max-h-[280px] rounded-[2.5rem] border-[3px] overflow-hidden cursor-pointer transition-all duration-500 hover-elevate focus:outline-none ${selectedSolutionIndex === idx ? 'border-indigo-400 shadow-xl' : 'border-white opacity-80'}`}>
                      <img src={solution.imageUrl} className="w-full h-full object-cover" alt={`Solution ${idx + 1}`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8">
                         <div className="bg-white/10 backdrop-blur px-3 py-1.5 rounded-full inline-flex items-center gap-2 self-start mb-2 border border-white/20"><span className={`w-1.5 h-1.5 rounded-full ${selectedSolutionIndex === idx ? 'bg-indigo-400' : 'bg-white'}`}></span><span className="text-[8px] font-bold uppercase tracking-widest text-white">Path {idx + 1}</span></div>
                         <h3 className="text-xl font-bold text-white tracking-tight">{solution.title}</h3>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="lg:col-span-6 flex flex-col h-full space-y-4 overflow-hidden fade-up-item delay-1">
                  <div className="rounded-[2.5rem] p-5 border border-white flex flex-col gap-3 shrink-0 shadow-sm bg-gradient-to-br from-purple-50/80 to-indigo-50/80 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-0.5">Synthesis Score</h3>
                          <div className="flex items-baseline gap-1"><p className="text-5xl font-bold font-display tracking-tighter gradient-text leading-none">{avgScore}</p><p className="text-xs font-bold text-slate-400">/ 100</p></div>
                        </div>
                        <div className="w-14 h-14 primary-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100"><svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
                    </div>
                    <div className="flex flex-wrap gap-2">{currentSolution?.highlights.map((h, idx) => <span key={idx} className="px-3 py-1 bg-white/60 border border-indigo-100/30 text-indigo-500 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm">{h}</span>)}</div>
                  </div>
                  <div className="flex-1 glass-dark rounded-[3rem] p-6 border border-white flex flex-col overflow-hidden">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-4 ml-2">Workshop Metrics</h3>
                    <div className="flex-1 w-full min-h-[140px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={scoreData} margin={{ top: 0, right: 10, left: -40, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                          <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#cbd5e1' }} />
                          <Tooltip cursor={{ fill: '#f8fafc', radius: 10 }} contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 10px 20px rgba(114, 9, 183, 0.04)', fontSize: '11px' }} formatter={(value: number) => [value.toFixed(1), "Score"]} />
                          <Bar dataKey="score" radius={[10, 10, 10, 10]} barSize={35}><Cell fill="url(#chartGradient)" /><Cell fill="url(#chartGradient)" /><Cell fill="url(#chartGradient)" /><Cell fill="url(#chartGradient)" /></Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-50 space-y-2 shrink-0">
                      <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full primary-gradient opacity-50"></span>Optimization Findings</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed max-h-[80px] overflow-y-auto custom-scrollbar font-medium">{currentSolution?.consensusSummary}</p>
                    </div>
                    <div className="mt-6 flex gap-4 shrink-0">
                      <button onClick={saveCurrentSolution} className="flex-1 py-4 bg-white border border-indigo-100 text-indigo-600 rounded-[1.2rem] text-[10px] font-bold shadow-sm hover-elevate transition-all uppercase tracking-[0.2em] focus:outline-none flex items-center justify-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>Save Path</button>
                      <button onClick={iterateCurrentSolution} className="flex-[1.5] py-4 primary-gradient text-white rounded-[1.2rem] text-[10px] font-bold shadow-lg hover-elevate transition-all uppercase tracking-[0.2em] focus:outline-none flex items-center justify-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>Refine Design</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
};

export default App;