import React, { useState, useEffect } from 'react';
import { AgentRole, DebateMessage } from '../types';

// Palette mapping for consistent but distinct blue-purple light tones
const bubblePalette: Record<string, { border: string, bg: string, text: string }> = {
  [AgentRole.CPO]: { border: 'border-blue-200', bg: 'bg-blue-50/40', text: 'text-blue-900' },
  [AgentRole.DESIGN]: { border: 'border-purple-200', bg: 'bg-purple-50/40', text: 'text-purple-900' },
  [AgentRole.TECH]: { border: 'border-indigo-200', bg: 'bg-indigo-50/40', text: 'text-indigo-900' },
  [AgentRole.UX]: { border: 'border-violet-200', bg: 'bg-violet-50/40', text: 'text-violet-900' },
  [AgentRole.MARKET]: { border: 'border-slate-200', bg: 'bg-slate-50/30', text: 'text-slate-800' },
};

export const AgentBubble: React.FC<{ 
  message: DebateMessage; 
  isLast: boolean; 
  isHighlighted?: boolean;
}> = ({ message, isLast, isHighlighted }) => {
  // Define layout based on role: Strategy/Leadership on left, Creative/Technical on right
  const isRight = [AgentRole.DESIGN, AgentRole.TECH].includes(message.role as AgentRole);
  const [displayedText, setDisplayedText] = useState(isLast ? '' : message.content);

  useEffect(() => {
    if (isLast && displayedText.length < message.content.length) {
      let i = displayedText.length;
      const interval = setInterval(() => {
        setDisplayedText(message.content.slice(0, i + 1));
        i++;
        if (i >= message.content.length) clearInterval(interval);
      }, 12);
      return () => clearInterval(interval);
    }
  }, [message.content, isLast, displayedText.length]);

  const style = bubblePalette[message.role] || bubblePalette[AgentRole.MARKET];

  return (
    <div className={`flex w-full mb-4 ${isRight ? 'justify-end' : 'justify-start'} transition-all duration-700 animate-in fade-in slide-in-from-bottom-2`}>
      <div className={`max-w-[82%] rounded-[1.8rem] px-7 py-5 border shadow-sm transition-all duration-500 
        ${style.bg} ${style.border} ${style.text}
        ${isHighlighted ? 'ring-2 ring-indigo-500/10 scale-[1.01] shadow-lg shadow-indigo-100/20' : ''}
        ${isRight ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
        
        <div className={`flex items-center gap-2 mb-2 ${isRight ? 'flex-row-reverse' : ''}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isLast ? 'animate-pulse primary-gradient' : 'bg-current opacity-20'}`}></div>
          <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">
            {message.role}
          </span>
        </div>

        <p className="text-[12.5px] leading-relaxed font-medium whitespace-pre-wrap opacity-90">
          {displayedText}
          {isLast && displayedText.length < message.content.length && (
            <span className="typing-cursor h-3.5 w-[1.5px] bg-current opacity-40"></span>
          )}
        </p>
      </div>
    </div>
  );
};