import React from 'react';
import { Delete, CheckCircle2, RotateCcw, Send, Minus } from 'lucide-react';

interface PlayerKeypadProps {
  playerLabel: string;
  themeColor: 'cyan' | 'purple';
  digits: string;
  isSubmitted: boolean;
  disabled: boolean;
  statusMessage?: string;
  lastResult?: 'correct' | 'wrong' | null;
  showNumberGrid?: boolean;
  onDigit: (digit: number) => void;
  onToggleMinus: () => void;
  onBackspace: () => void;
  onClear: () => void;
  onSubmit: () => void;
}

export const PlayerKeypad: React.FC<PlayerKeypadProps> = ({
  playerLabel,
  themeColor,
  digits,
  isSubmitted,
  disabled,
  statusMessage,
  lastResult,
  showNumberGrid = true,
  onDigit,
  onToggleMinus,
  onBackspace,
  onClear,
  onSubmit,
}) => {
  const isCyan = themeColor === 'cyan';

  const primaryBorder = isCyan ? 'border-cyan-400/60' : 'border-purple-400/60';
  const primaryGlow = isCyan
    ? 'shadow-[0_0_20px_rgba(0,240,255,0.25)]'
    : 'shadow-[0_0_20px_rgba(168,85,247,0.25)]';
  const textColor = isCyan ? 'text-cyan-400' : 'text-purple-400';
  const btnHover = isCyan
    ? 'hover:bg-cyan-500/20 hover:border-cyan-400 text-cyan-200'
    : 'hover:bg-purple-500/20 hover:border-purple-400 text-purple-200';
  
  const submitBtnStyle = isCyan
    ? 'border-cyan-400 text-cyan-300 bg-cyan-950/40 hover:bg-cyan-500/25 shadow-[0_0_20px_rgba(0,240,255,0.35)]'
    : 'border-purple-400 text-purple-300 bg-purple-950/40 hover:bg-purple-500/25 shadow-[0_0_20px_rgba(168,85,247,0.35)]';

  return (
    <div
      className={`w-full bg-slate-950/85 backdrop-blur-md border ${primaryBorder} rounded-2xl p-3 flex flex-col gap-3 ${primaryGlow} select-none`}
    >
      {/* Player Display Header */}
      <div className="flex items-center justify-between px-1">
        <span className={`text-[11px] font-black uppercase tracking-wider ${textColor}`}>
          {playerLabel}
        </span>
        {lastResult ? (
          <span
            className={`text-xs font-black px-2 py-0.5 rounded-full ${
              lastResult === 'correct'
                ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
                : 'bg-rose-500/20 border border-rose-400 text-rose-300'
            }`}
          >
            {lastResult === 'correct' ? '✓ إجابة صحيحة' : '✗ إجابة خاطئة'}
          </span>
        ) : isSubmitted ? (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300">
            تم إرسال الإجابة ✓
          </span>
        ) : (
          <span className="text-[10px] font-bold text-slate-400">اختر الإجابة</span>
        )}
      </div>

      {/* 1. ANSWER Box with Backspace [X] inside */}
      <div
        className={`w-full py-2 px-3.5 rounded-xl bg-slate-900/95 border-2 ${primaryBorder} flex items-center justify-between min-h-[48px] shadow-inner`}
      >
        <span
          className={`text-lg sm:text-2xl font-black tracking-widest ${
            digits ? 'text-white' : 'text-slate-400 uppercase'
          }`}
        >
          {digits || 'ANSWER'}
        </span>
        <button
          type="button"
          disabled={disabled || isSubmitted || !digits}
          onClick={onBackspace}
          className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none hover:border-slate-500 hover:text-white"
          title="تراجع / Delete"
        >
          <Delete className="w-4 h-4" />
        </button>
      </div>

      {/* 2. SUBMIT Button directly below the ANSWER box */}
      <div className="flex justify-center w-full my-0.5">
        <button
          type="button"
          disabled={disabled || isSubmitted || !digits}
          onClick={onSubmit}
          className={`w-full py-2.5 rounded-xl border-2 font-black text-xs sm:text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg ${
            !digits || disabled || isSubmitted
              ? 'border-slate-700 text-slate-400 bg-slate-900/80 opacity-60 cursor-not-allowed'
              : isCyan
              ? 'border-cyan-400 text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.5)]'
              : 'border-purple-400 text-slate-950 bg-purple-400 hover:bg-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.5)]'
          }`}
        >
          <Send className="w-4 h-4" />
          SUBMIT
        </button>
      </div>

      {/* Interactive Keypad Buttons Grid */}
      {showNumberGrid && (
        <div className="grid grid-cols-3 gap-1.5 w-full pt-1 border-t border-white/10">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              disabled={disabled || isSubmitted}
              onClick={() => onDigit(num)}
              className={`py-2 rounded-xl bg-slate-900 border border-white/10 text-white font-black text-base transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none ${btnHover}`}
            >
              {num}
            </button>
          ))}

          {/* Minus Sign Button (-) */}
          <button
            type="button"
            disabled={disabled || isSubmitted}
            onClick={onToggleMinus}
            className={`py-2 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-400 font-black text-base transition-all active:scale-95 flex items-center justify-center gap-1 disabled:opacity-30 disabled:pointer-events-none ${btnHover}`}
            title="علامة الطرح (-)"
          >
            <Minus className="w-4 h-4 stroke-[3]" />
            (-)
          </button>

          {/* Zero Button */}
          <button
            type="button"
            disabled={disabled || isSubmitted}
            onClick={() => onDigit(0)}
            className={`py-2 rounded-xl bg-slate-900 border border-white/10 text-white font-black text-base transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none ${btnHover}`}
          >
            0
          </button>

          {/* Clear Button */}
          <button
            type="button"
            disabled={disabled || isSubmitted || !digits}
            onClick={onClear}
            className="py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-bold text-xs uppercase transition-all active:scale-95 flex items-center justify-center gap-1 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            مسح
          </button>
        </div>
      )}
    </div>
  );
};
