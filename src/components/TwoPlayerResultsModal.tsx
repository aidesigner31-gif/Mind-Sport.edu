import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Question } from '../types';
import { Trophy, RotateCcw, Home, Sparkles, CheckCircle2, XCircle, Users, Award, Zap, Flame } from 'lucide-react';

interface QuestionHistoryItem {
  questionNumber: number;
  promptText: string;
  correctAnswer: string;
  p1Answer: string;
  p1IsCorrect: boolean;
  p2Answer: string;
  p2IsCorrect: boolean;
}

interface TwoPlayerResultsModalProps {
  p1Score: number;
  p1Correct: number;
  p1Wrong: number;
  p1MaxCombo: number;
  p1TimeSeconds?: number;
  p2Score: number;
  p2Correct: number;
  p2Wrong: number;
  p2MaxCombo: number;
  p2TimeSeconds?: number;
  totalQuestions: number;
  matchTimeSeconds?: number | string;
  history: QuestionHistoryItem[];
  onRetry: () => void;
  onMenu: () => void;
}

export const TwoPlayerResultsModal: React.FC<TwoPlayerResultsModalProps> = ({
  p1Score,
  p1Correct,
  p1Wrong,
  p1MaxCombo,
  p1TimeSeconds,
  p2Score,
  p2Correct,
  p2Wrong,
  p2MaxCombo,
  p2TimeSeconds,
  totalQuestions,
  matchTimeSeconds = 0,
  history,
  onRetry,
  onMenu,
}) => {
  const winner =
    p1Score > p2Score ? 'p1' : p2Score > p1Score ? 'p2' : 'tie';

  const matchSec = typeof matchTimeSeconds === 'number' ? matchTimeSeconds : parseFloat(String(matchTimeSeconds)) || 0;
  const realP1Time = p1TimeSeconds && p1TimeSeconds > 0 ? p1TimeSeconds : matchSec;
  const realP2Time = p2TimeSeconds && p2TimeSeconds > 0 ? p2TimeSeconds : matchSec;

  const p1TotalAtt = p1Correct + p1Wrong;
  const p2TotalAtt = p2Correct + p2Wrong;

  const p1Acc = Math.min(100, Math.max(0, p1TotalAtt > 0 ? Math.round((p1Correct / p1TotalAtt) * 100) : (totalQuestions > 0 ? Math.round((p1Correct / totalQuestions) * 100) : 0)));
  const p2Acc = Math.min(100, Math.max(0, p2TotalAtt > 0 ? Math.round((p2Correct / p2TotalAtt) * 100) : (totalQuestions > 0 ? Math.round((p2Correct / totalQuestions) * 100) : 0)));
  const maxAcc = Math.min(100, Math.max(p1Acc, p2Acc));

  const totalQ = totalQuestions || 1;
  const p1AvgSpeed = (realP1Time / totalQ).toFixed(1);
  const p2AvgSpeed = (realP2Time / totalQ).toFixed(1);

  const timeDiff = Math.abs(realP1Time - realP2Time).toFixed(1);
  const p1IsFaster = realP1Time < realP2Time && Math.abs(realP1Time - realP2Time) >= 0.2;
  const p2IsFaster = realP2Time < realP1Time && Math.abs(realP1Time - realP2Time) >= 0.2;
  const isSpeedTie = Math.abs(realP1Time - realP2Time) < 0.2;

  useEffect(() => {
    // Launch victory confetti only if highest accuracy is 70% or higher
    if (maxAcc < 70) return;

    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors: ['#00f0ff', '#a855f7', '#ec4899', '#ffd700'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors: ['#00f0ff', '#a855f7', '#ec4899', '#ffd700'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [maxAcc]);

  const formatTimeDisplay = (sec: number | string): string => {
    const s = typeof sec === 'number' ? sec : parseFloat(String(sec)) || 0;
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    const padM = String(mins).padStart(2, '0');
    const padS = String(secs).padStart(2, '0');
    return `${padM}:${padS}`;
  };

  const formattedMatchTime = formatTimeDisplay(matchTimeSeconds);
  const formattedP1Time = formatTimeDisplay(realP1Time);
  const formattedP2Time = formatTimeDisplay(realP2Time);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto overflow-x-hidden no-scrollbar">
      <div className="relative w-full max-w-4xl bg-slate-950/95 border-2 border-purple-500/40 rounded-3xl p-5 sm:p-8 text-center shadow-[0_0_80px_rgba(168,85,247,0.3)] flex flex-col items-center select-none max-h-[90vh] overflow-y-auto overflow-x-hidden no-scrollbar my-auto">
        {/* Background Ambient Glows */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Side-by-Side Player KPI Comparison */}
        <div className="relative z-10 w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Player 1 Card */}
          <div
            className={`relative p-5 rounded-2xl border transition-all flex flex-col gap-4 ${
              winner === 'p1'
                ? 'bg-cyan-950/40 border-cyan-400/80 shadow-[0_0_35px_rgba(0,240,255,0.25)]'
                : 'bg-slate-900/60 border-cyan-500/20'
            }`}
          >
            {/* Top Badges (Winner & Faster) */}
            <div className="flex items-center justify-start gap-2 flex-wrap min-h-[28px]">
              {winner === 'p1' && (
                <div className="px-3 py-1 rounded-full bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-md">
                  <Trophy className="w-3.5 h-3.5 fill-slate-950" /> WINNER / الفائز
                </div>
              )}
              {p1IsFaster && (
                <div className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-md border border-amber-300">
                  <Zap className="w-3.5 h-3.5 fill-slate-950 animate-bounce" /> FASTER ({timeDiff}S) / الأسرع
                </div>
              )}
            </div>

            {/* Title & Score Bar */}
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
              <span className="text-sm sm:text-base font-black text-cyan-400 uppercase tracking-widest">
                PLAYER 1 / 1 اللاعب
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                {p1Score} <span className="text-xs font-bold text-slate-400 font-sans">PTS</span>
              </span>
            </div>

            {/* Player 1 Result Circle */}
            <div className="flex justify-center my-3">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-cyan-400 bg-gradient-to-b from-cyan-950/90 to-slate-950 p-2 flex flex-col items-center justify-center shadow-[0_0_35px_rgba(0,240,255,0.4)]">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-wider my-0.5 drop-shadow-[0_0_12px_rgba(0,240,255,0.9)]">
                  {p1Acc}%
                </span>
                <span className="text-xs sm:text-sm font-black text-amber-300 font-mono bg-slate-950/90 px-3 py-0.5 rounded-full border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.2)] mt-1">
                  ({formattedP1Time})
                </span>
              </div>
            </div>
          </div>

          {/* Player 2 Card */}
          <div
            className={`relative p-5 rounded-2xl border transition-all flex flex-col gap-4 ${
              winner === 'p2'
                ? 'bg-purple-950/40 border-purple-400/80 shadow-[0_0_35px_rgba(168,85,247,0.25)]'
                : 'bg-slate-900/60 border-purple-500/20'
            }`}
          >
            {/* Top Badges (Winner & Faster) */}
            <div className="flex items-center justify-start gap-2 flex-wrap min-h-[28px]">
              {winner === 'p2' && (
                <div className="px-3 py-1 rounded-full bg-purple-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-md">
                  <Trophy className="w-3.5 h-3.5 fill-slate-950" /> WINNER / الفائز
                </div>
              )}
              {p2IsFaster && (
                <div className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-md border border-amber-300">
                  <Zap className="w-3.5 h-3.5 fill-slate-950 animate-bounce" /> FASTER ({timeDiff}S) / الأسرع
                </div>
              )}
            </div>

            {/* Title & Score Bar */}
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
              <span className="text-sm sm:text-base font-black text-purple-400 uppercase tracking-widest">
                PLAYER 2 / 2 اللاعب
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                {p2Score} <span className="text-xs font-bold text-slate-400 font-sans">PTS</span>
              </span>
            </div>

            {/* Player 2 Result Circle */}
            <div className="flex justify-center my-3">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-purple-400 bg-gradient-to-b from-purple-950/90 to-slate-950 p-2 flex flex-col items-center justify-center shadow-[0_0_35px_rgba(168,85,247,0.4)]">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-wider my-0.5 drop-shadow-[0_0_12px_rgba(168,85,247,0.9)]">
                  {p2Acc}%
                </span>
                <span className="text-xs sm:text-sm font-black text-amber-300 font-mono bg-slate-950/90 px-3 py-0.5 rounded-full border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.2)] mt-1">
                  ({formattedP2Time})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 w-full grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onRetry}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            REMATCH / إعادة المواجهة
          </button>
          <button
            onClick={onMenu}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-black text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-purple-400" />
            MAIN MENU / القائمة
          </button>
        </div>
      </div>
    </div>
  );
};
