import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Sparkles, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

interface MatchResultsModalProps {
  score: number;
  timeSeconds: number | string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  notAnsweredCount?: number;
  playerName?: string;
  isWinner?: boolean;
  onRetry: () => void;
  onMenu: () => void;
}

export const MatchResultsModal: React.FC<MatchResultsModalProps> = ({
  score,
  timeSeconds,
  totalQuestions,
  correctCount,
  wrongCount,
  notAnsweredCount = 0,
  playerName,
  isWinner = true,
  onRetry,
  onMenu,
}) => {
  const total = Math.max(1, totalQuestions || 1);
  const correctPct = Math.min(100, Math.max(0, Math.round((correctCount / total) * 100)));
  const wrongPct = Math.min(100, Math.max(0, Math.round((wrongCount / total) * 100)));
  const unansPct = Math.max(0, Math.min(100, 100 - correctPct - wrongPct));

  useEffect(() => {
    // Launch celebratory fireworks only if score/accuracy is 70% or higher
    if (correctPct < 70) return;

    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ec4899', '#a855f7', '#3b82f6', '#eab308'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ec4899', '#a855f7', '#3b82f6', '#eab308'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [correctPct]);

  const formatTimeDisplay = (sec: number | string): string => {
    const s = typeof sec === 'number' ? sec : parseFloat(String(sec)) || 0;
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    const padM = String(mins).padStart(2, '0');
    const padS = String(secs).padStart(2, '0');
    return `${padM}:${padS}`;
  };

  const formattedTime = formatTimeDisplay(timeSeconds);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto overflow-x-hidden no-scrollbar">
      <div className="relative w-full max-w-lg bg-slate-950/90 border-2 border-pink-500/50 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_80px_rgba(236,72,153,0.3)] flex flex-col items-center select-none overflow-hidden no-scrollbar">
        {/* Background Ambient Glows */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* SPEEDDIGITS Title Banner */}
        <div className="relative z-10 mb-2 flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-400/30 text-pink-300 text-[10px] font-bold uppercase tracking-[0.25em] mb-1">
            <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            SPEEDDIGITS
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-fuchsia-300 to-purple-400 tracking-wider">
            {playerName ? `${playerName.toUpperCase()} RESULTS` : 'MATCH COMPLETED'}
          </h2>
        </div>

        {/* Central Main Result Circle */}
        <div className="relative z-10 my-4 flex flex-col items-center">
          <div className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-full border-4 border-pink-500 bg-gradient-to-b from-pink-950/90 via-slate-950 to-purple-950/90 p-3 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(236,72,153,0.45)] border-t-pink-400 border-b-purple-500">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-wider my-0.5 drop-shadow-[0_0_12px_rgba(236,72,153,0.9)]">
              {correctPct}%
            </span>
            <span className="text-xs sm:text-sm font-black text-amber-300 font-mono bg-slate-950/90 px-3 py-0.5 rounded-full border border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.3)] mt-0.5">
              ({formattedTime})
            </span>
          </div>

          {/* Clean Score Badge */}
          <div className="mt-4 px-5 py-2 rounded-2xl bg-slate-900/90 border border-pink-500/30 text-xs sm:text-sm font-black text-slate-200 shadow-[inset_0_0_15px_rgba(236,72,153,0.1)] flex items-center gap-2">
            <span>Score / النتيجة:</span>
            <span className="text-pink-400 font-mono text-base sm:text-lg">{score}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 w-full flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRetry}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(236,72,153,0.4)] active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            إعادة اللعب / RETRY
          </button>
          <button
            onClick={onMenu}
            className="flex-1 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-pink-400" />
            القائمة الرئيسية / MENU
          </button>
        </div>
      </div>
    </div>
  );
};
