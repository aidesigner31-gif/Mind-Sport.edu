import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Question } from '../types';
import {
  Trophy,
  RotateCcw,
  Home,
  Sparkles,
  CheckCircle2,
  XCircle,
  Users,
  Award,
  Zap,
  Flame,
  Crown,
  Medal,
  ChevronDown,
  ChevronUp,
  Star,
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

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
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const winner = p1Score > p2Score ? 'p1' : p2Score > p1Score ? 'p2' : 'tie';
  const scoreDiff = Math.abs(p1Score - p2Score);

  const matchSec =
    typeof matchTimeSeconds === 'number'
      ? matchTimeSeconds
      : parseFloat(String(matchTimeSeconds)) || 0;
  const realP1Time = p1TimeSeconds && p1TimeSeconds > 0 ? p1TimeSeconds : matchSec;
  const realP2Time = p2TimeSeconds && p2TimeSeconds > 0 ? p2TimeSeconds : matchSec;

  const p1TotalAtt = p1Correct + p1Wrong;
  const p2TotalAtt = p2Correct + p2Wrong;

  const p1Acc = Math.min(
    100,
    Math.max(
      0,
      p1TotalAtt > 0
        ? Math.round((p1Correct / p1TotalAtt) * 100)
        : totalQuestions > 0
        ? Math.round((p1Correct / totalQuestions) * 100)
        : 0
    )
  );
  const p2Acc = Math.min(
    100,
    Math.max(
      0,
      p2TotalAtt > 0
        ? Math.round((p2Correct / p2TotalAtt) * 100)
        : totalQuestions > 0
        ? Math.round((p2Correct / totalQuestions) * 100)
        : 0
    )
  );

  const timeDiff = Math.abs(realP1Time - realP2Time).toFixed(1);
  const p1IsFaster = realP1Time < realP2Time && Math.abs(realP1Time - realP2Time) >= 0.2;
  const p2IsFaster = realP2Time < realP1Time && Math.abs(realP1Time - realP2Time) >= 0.2;

  // Sound & Celebratory Confetti on match conclusion
  useEffect(() => {
    soundEngine.playVictorySound();

    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.6 },
        colors: ['#ffd700', '#00f0ff', '#a855f7', '#ec4899', '#ffffff'],
      });
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.6 },
        colors: ['#ffd700', '#00f0ff', '#a855f7', '#ec4899', '#ffffff'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [winner]);

  const formatTimeDisplay = (sec: number | string): string => {
    const s = typeof sec === 'number' ? sec : parseFloat(String(sec)) || 0;
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    const padM = String(mins).padStart(2, '0');
    const padS = String(secs).padStart(2, '0');
    return `${padM}:${padS}`;
  };

  const formattedP1Time = formatTimeDisplay(realP1Time);
  const formattedP2Time = formatTimeDisplay(realP2Time);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-auto overflow-x-hidden no-scrollbar">
      <div className="relative w-full max-w-4xl bg-slate-950/95 border-2 border-purple-500/40 rounded-3xl p-5 sm:p-8 text-center shadow-[0_0_90px_rgba(168,85,247,0.35)] flex flex-col items-center select-none max-h-[92vh] overflow-y-auto overflow-x-hidden no-scrollbar my-auto">
        
        {/* Background Ambient Glows */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 🏆 GRAND WINNER PODIUM HEADER BANNER 🏆 */}
        <div className="relative z-10 w-full mb-6">
          {winner === 'tie' ? (
            <div className="w-full py-4 px-6 rounded-3xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-cyan-500/20 border-2 border-amber-400/60 shadow-[0_0_35px_rgba(251,191,36,0.3)] flex flex-col items-center justify-center gap-1.5 animate-in zoom-in-95 duration-500">
              <div className="flex items-center gap-2 text-amber-300 font-black text-xl sm:text-2xl uppercase tracking-wider">
                <Sparkles className="w-6 h-6 text-amber-400 animate-spin" />
                <span>⚔️ تعادل بطولي مشترك بين اللاعبين! / EPIC TIE! ⚔️</span>
                <Sparkles className="w-6 h-6 text-amber-400 animate-spin" />
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                كلا اللاعبين أحرزا نفس المجموع ({p1Score} نقطة) وقدموا أداءً أسطورياً متكافئاً!
              </p>
            </div>
          ) : winner === 'p1' ? (
            <div className="w-full py-4 sm:py-5 px-6 rounded-3xl bg-gradient-to-r from-cyan-950/80 via-cyan-900/60 to-slate-950 border-2 border-cyan-400 shadow-[0_0_45px_rgba(0,240,255,0.45)] ring-4 ring-cyan-400/30 flex flex-col items-center justify-center gap-2 animate-in zoom-in-95 duration-500">
              <div className="flex items-center gap-2.5 text-cyan-300 font-black text-xl sm:text-3xl uppercase tracking-wider drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]">
                <Crown className="w-8 h-8 text-amber-400 fill-amber-400 animate-bounce" />
                <span>👑 مبروك الفوز للاعب الأول! / PLAYER 1 WINS! 👑</span>
                <Trophy className="w-7 h-7 text-amber-400 fill-amber-400" />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-bold text-cyan-100">
                <span className="px-3 py-1 rounded-full bg-cyan-400/20 border border-cyan-400/40 font-mono">
                  فارق النقاط: <strong className="text-white text-base">+{scoreDiff}</strong> نقطة
                </span>
                {p1IsFaster && (
                  <span className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-mono">
                    ⚡ أسرع بـ <strong className="text-white text-base">{timeDiff}</strong> ثانية
                  </span>
                )}
                <span className="px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 font-mono">
                  🎯 دقة: <strong className="text-white text-base">{p1Acc}%</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full py-4 sm:py-5 px-6 rounded-3xl bg-gradient-to-r from-purple-950/80 via-purple-900/60 to-slate-950 border-2 border-purple-400 shadow-[0_0_45px_rgba(168,85,247,0.45)] ring-4 ring-purple-400/30 flex flex-col items-center justify-center gap-2 animate-in zoom-in-95 duration-500">
              <div className="flex items-center gap-2.5 text-purple-300 font-black text-xl sm:text-3xl uppercase tracking-wider drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]">
                <Crown className="w-8 h-8 text-amber-400 fill-amber-400 animate-bounce" />
                <span>👑 مبروك الفوز للاعب الثاني! / PLAYER 2 WINS! 👑</span>
                <Trophy className="w-7 h-7 text-amber-400 fill-amber-400" />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-bold text-purple-100">
                <span className="px-3 py-1 rounded-full bg-purple-400/20 border border-purple-400/40 font-mono">
                  فارق النقاط: <strong className="text-white text-base">+{scoreDiff}</strong> نقطة
                </span>
                {p2IsFaster && (
                  <span className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-mono">
                    ⚡ أسرع بـ <strong className="text-white text-base">{timeDiff}</strong> ثانية
                  </span>
                )}
                <span className="px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 font-mono">
                  🎯 دقة: <strong className="text-white text-base">{p2Acc}%</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Side-by-Side Player Cards (Visual Distinction for Champion vs Runner-Up) */}
        <div className="relative z-10 w-full grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 items-stretch">
          
          {/* PLAYER 1 CARD */}
          <div
            className={`relative p-5 sm:p-6 rounded-3xl transition-all duration-300 flex flex-col justify-between overflow-hidden ${
              winner === 'p1'
                ? 'bg-gradient-to-b from-amber-500/15 via-cyan-950/40 to-slate-950 border-2 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.35)] ring-4 ring-amber-400/40 scale-[1.02] order-first md:order-none'
                : winner === 'p2'
                ? 'bg-slate-900/50 border border-white/10 opacity-80 scale-[0.98]'
                : 'bg-cyan-950/30 border-2 border-cyan-500/40 shadow-lg'
            }`}
          >
            {/* Top Distinct Status Ribbon */}
            <div className="mb-3">
              {winner === 'p1' ? (
                <div className="w-full py-2 px-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(251,191,36,0.6)]">
                  <Crown className="w-4 h-4 fill-slate-950 text-slate-950" />
                  <span>👑 الفائز بالمركز الأول (CHAMPION - 1st PLACE)</span>
                </div>
              ) : winner === 'p2' ? (
                <div className="w-full py-1.5 px-3 rounded-2xl bg-slate-800/80 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-white/10">
                  <Medal className="w-3.5 h-3.5 text-slate-400" />
                  <span>المركز الثاني (RUNNER-UP - 2nd PLACE)</span>
                </div>
              ) : (
                <div className="w-full py-1.5 px-3 rounded-2xl bg-amber-500/20 text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-amber-400/30">
                  <span>تعادل متكافئ (CO-CHAMPION)</span>
                </div>
              )}
            </div>

            {/* Title & Score Bar */}
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.8)]" />
                <span className="text-base sm:text-lg font-black text-cyan-300 uppercase tracking-widest">
                  PLAYER 1 / اللاعب 1
                </span>
              </div>
              <div className="flex items-center gap-2">
                {winner === 'p1' && (
                  <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black text-[10px] uppercase">
                    WINNER
                  </span>
                )}
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {p1Score} <span className="text-xs font-bold text-cyan-400 font-sans">PTS</span>
                </span>
              </div>
            </div>

            {/* Player 1 KPI Circular Display */}
            <div className="flex justify-center my-4">
              <div
                className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full p-2 flex flex-col items-center justify-center transition-all ${
                  winner === 'p1'
                    ? 'border-4 border-amber-400 bg-gradient-to-b from-amber-500/20 via-cyan-950/80 to-slate-950 shadow-[0_0_40px_rgba(251,191,36,0.5)]'
                    : 'border-4 border-cyan-500/40 bg-gradient-to-b from-cyan-950/50 to-slate-950 shadow-inner'
                }`}
              >
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  الدقة / Accuracy
                </span>
                <span className="text-3xl sm:text-4xl font-black text-white tracking-wider my-0.5 drop-shadow-[0_0_12px_rgba(0,240,255,0.9)]">
                  {p1Acc}%
                </span>
                <span className="text-xs font-black text-amber-300 font-mono bg-slate-950/90 px-3 py-0.5 rounded-full border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.2)] mt-0.5">
                  ⏱️ {formattedP1Time}
                </span>
              </div>
            </div>

            {/* Performance Stats Pill Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-white/10">
              <div className="bg-slate-950/60 p-2 rounded-xl border border-white/5">
                <div className="text-[10px] text-slate-400">إجابات صحيحة</div>
                <div className="text-emerald-400 font-black text-sm">{p1Correct} / {totalQuestions}</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-white/5">
                <div className="text-[10px] text-slate-400">أخطاء</div>
                <div className="text-rose-400 font-black text-sm">{p1Wrong}</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-white/5">
                <div className="text-[10px] text-slate-400">أعلى كومبو</div>
                <div className="text-amber-300 font-black text-sm font-mono">x{p1MaxCombo} 🔥</div>
              </div>
            </div>
          </div>

          {/* PLAYER 2 CARD */}
          <div
            className={`relative p-5 sm:p-6 rounded-3xl transition-all duration-300 flex flex-col justify-between overflow-hidden ${
              winner === 'p2'
                ? 'bg-gradient-to-b from-amber-500/15 via-purple-950/40 to-slate-950 border-2 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.35)] ring-4 ring-amber-400/40 scale-[1.02] order-first md:order-none'
                : winner === 'p1'
                ? 'bg-slate-900/50 border border-white/10 opacity-80 scale-[0.98]'
                : 'bg-purple-950/30 border-2 border-purple-500/40 shadow-lg'
            }`}
          >
            {/* Top Distinct Status Ribbon */}
            <div className="mb-3">
              {winner === 'p2' ? (
                <div className="w-full py-2 px-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(251,191,36,0.6)]">
                  <Crown className="w-4 h-4 fill-slate-950 text-slate-950" />
                  <span>👑 الفائز بالمركز الأول (CHAMPION - 1st PLACE)</span>
                </div>
              ) : winner === 'p1' ? (
                <div className="w-full py-1.5 px-3 rounded-2xl bg-slate-800/80 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-white/10">
                  <Medal className="w-3.5 h-3.5 text-slate-400" />
                  <span>المركز الثاني (RUNNER-UP - 2nd PLACE)</span>
                </div>
              ) : (
                <div className="w-full py-1.5 px-3 rounded-2xl bg-amber-500/20 text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-amber-400/30">
                  <span>تعادل متكافئ (CO-CHAMPION)</span>
                </div>
              )}
            </div>

            {/* Title & Score Bar */}
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                <span className="text-base sm:text-lg font-black text-purple-300 uppercase tracking-widest">
                  PLAYER 2 / اللاعب 2
                </span>
              </div>
              <div className="flex items-center gap-2">
                {winner === 'p2' && (
                  <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black text-[10px] uppercase">
                    WINNER
                  </span>
                )}
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {p2Score} <span className="text-xs font-bold text-purple-400 font-sans">PTS</span>
                </span>
              </div>
            </div>

            {/* Player 2 KPI Circular Display */}
            <div className="flex justify-center my-4">
              <div
                className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full p-2 flex flex-col items-center justify-center transition-all ${
                  winner === 'p2'
                    ? 'border-4 border-amber-400 bg-gradient-to-b from-amber-500/20 via-purple-950/80 to-slate-950 shadow-[0_0_40px_rgba(251,191,36,0.5)]'
                    : 'border-4 border-purple-500/40 bg-gradient-to-b from-purple-950/50 to-slate-950 shadow-inner'
                }`}
              >
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  الدقة / Accuracy
                </span>
                <span className="text-3xl sm:text-4xl font-black text-white tracking-wider my-0.5 drop-shadow-[0_0_12px_rgba(168,85,247,0.9)]">
                  {p2Acc}%
                </span>
                <span className="text-xs font-black text-amber-300 font-mono bg-slate-950/90 px-3 py-0.5 rounded-full border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.2)] mt-0.5">
                  ⏱️ {formattedP2Time}
                </span>
              </div>
            </div>

            {/* Performance Stats Pill Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-white/10">
              <div className="bg-slate-950/60 p-2 rounded-xl border border-white/5">
                <div className="text-[10px] text-slate-400">إجابات صحيحة</div>
                <div className="text-emerald-400 font-black text-sm">{p2Correct} / {totalQuestions}</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-white/5">
                <div className="text-[10px] text-slate-400">أخطاء</div>
                <div className="text-rose-400 font-black text-sm">{p2Wrong}</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-white/5">
                <div className="text-[10px] text-slate-400">أعلى كومبو</div>
                <div className="text-amber-300 font-black text-sm font-mono">x{p2MaxCombo} 🔥</div>
              </div>
            </div>
          </div>
        </div>

        {/* 📊 HEAD-TO-HEAD COMPARISON SUMMARY BAR 📊 */}
        <div className="relative z-10 w-full mb-5 bg-slate-900/80 border border-white/10 rounded-2xl p-3.5 sm:p-4 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-300 mb-2">
            <span className="text-cyan-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              اللاعب 1: {p1Score} pts ({p1Acc}%)
            </span>
            <span className="text-amber-300 uppercase tracking-widest text-[10px]">
              مقارنة الجولة / MATCH COMPARISON
            </span>
            <span className="text-purple-400 flex items-center gap-1">
              اللاعب 2: {p2Score} pts ({p2Acc}%)
              <span className="w-2 h-2 rounded-full bg-purple-400" />
            </span>
          </div>

          {/* Progress bar visual comparison */}
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
            <div
              className="h-full bg-cyan-400 transition-all duration-1000 shadow-[0_0_10px_rgba(0,240,255,0.8)]"
              style={{
                width: `${
                  p1Score + p2Score > 0
                    ? Math.round((p1Score / (p1Score + p2Score)) * 100)
                    : 50
                }%`,
              }}
            />
            <div
              className="h-full bg-purple-500 transition-all duration-1000 shadow-[0_0_10px_rgba(168,85,247,0.8)]"
              style={{
                width: `${
                  p1Score + p2Score > 0
                    ? Math.round((p2Score / (p1Score + p2Score)) * 100)
                    : 50
                }%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
            <span>
              {p1IsFaster ? '⚡ اللاعب 1 أسرع في إنهاء الجولة' : p1Acc > p2Acc ? '🎯 اللاعب 1 أكثر دقة' : ''}
            </span>
            <span>
              {p2IsFaster ? '⚡ اللاعب 2 أسرع في إنهاء الجولة' : p2Acc > p1Acc ? '🎯 اللاعب 2 أكثر دقة' : ''}
            </span>
          </div>
        </div>

        {/* Detailed Question-by-Question Accordion Toggle */}
        {history && history.length > 0 && (
          <div className="relative z-10 w-full mb-5">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs flex items-center justify-between transition-all cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-400" />
                <span>عرض تفاصيل ومقارنة إجابات كل مسألة ({history.length} مسائل)</span>
              </span>
              {showHistory ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showHistory && (
              <div className="mt-2.5 p-3 rounded-2xl bg-slate-900/90 border border-white/10 max-h-56 overflow-y-auto no-scrollbar space-y-2 text-right">
                {history.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-white/10 text-white font-mono font-bold flex items-center justify-center text-[10px]">
                        #{item.questionNumber}
                      </span>
                      <span className="font-mono font-bold text-white text-sm">
                        {item.promptText} = <strong className="text-amber-400 font-black">{item.correctAnswer}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] font-mono">
                      {/* P1 Answer */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-cyan-300">اللاعب 1:</span>
                        <span
                          className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
                            item.p1IsCorrect
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {item.p1IsCorrect ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-400" />
                          )}
                          {item.p1Answer || '-'}
                        </span>
                      </div>

                      {/* P2 Answer */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-purple-300">اللاعب 2:</span>
                        <span
                          className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
                            item.p2IsCorrect
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {item.p2IsCorrect ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-400" />
                          )}
                          {item.p2Answer || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="relative z-10 w-full grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => {
              soundEngine.playTargetActivate();
              onRetry();
            }}
            className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 stroke-[3]" />
            <span>REMATCH / إعادة التحدي</span>
          </button>
          <button
            onClick={() => {
              soundEngine.playTargetActivate();
              onMenu();
            }}
            className="w-full py-4 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-500 font-black text-sm uppercase tracking-wider transition-all transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <Home className="w-4 h-4 text-purple-400" />
            <span>MAIN MENU / القائمة الرئيسية</span>
          </button>
        </div>
      </div>
    </div>
  );
};
