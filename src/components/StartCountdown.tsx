import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { soundEngine } from '../utils/audio';
import { Zap, Sparkles, Flame } from 'lucide-react';

interface StartCountdownProps {
  onComplete: () => void;
  title?: string;
}

type CountdownStep = 3 | 2 | 1 | 'GO';

export const StartCountdown: React.FC<StartCountdownProps> = ({ onComplete, title = 'تحدي الحساب الذهني' }) => {
  const [step, setStep] = useState<CountdownStep>(3);

  useEffect(() => {
    // Play initial sound for 3
    soundEngine.playBeep(false);

    const t3to2 = setTimeout(() => {
      setStep(2);
      soundEngine.playBeep(false);
    }, 900);

    const t2to1 = setTimeout(() => {
      setStep(1);
      soundEngine.playBeep(false);
    }, 1800);

    const t1toGo = setTimeout(() => {
      setStep('GO');
      soundEngine.playBeep(true);
    }, 2700);

    const tGoFinish = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => {
      clearTimeout(t3to2);
      clearTimeout(t2to1);
      clearTimeout(t1toGo);
      clearTimeout(tGoFinish);
    };
  }, [onComplete]);

  // Color theme based on current step
  const getStepStyles = () => {
    switch (step) {
      case 3:
        return {
          textColor: 'text-amber-400',
          glowColor: 'rgba(251, 191, 36, 0.6)',
          borderColor: 'border-amber-400/40',
          bgGradient: 'from-amber-500/20 via-slate-900/90 to-slate-950/95',
          labelAr: 'اسـتـعـد',
          labelEn: 'READY',
          arabicNum: '٣',
          beadsCount: 3,
        };
      case 2:
        return {
          textColor: 'text-purple-400',
          glowColor: 'rgba(192, 132, 252, 0.6)',
          borderColor: 'border-purple-400/40',
          bgGradient: 'from-purple-500/20 via-slate-900/90 to-slate-950/95',
          labelAr: 'تـأهّـب',
          labelEn: 'SET',
          arabicNum: '٢',
          beadsCount: 2,
        };
      case 1:
        return {
          textColor: 'text-cyan-400',
          glowColor: 'rgba(34, 211, 238, 0.6)',
          borderColor: 'border-cyan-400/40',
          bgGradient: 'from-cyan-500/20 via-slate-900/90 to-slate-950/95',
          labelAr: 'تـركـيـز',
          labelEn: 'FOCUS',
          arabicNum: '١',
          beadsCount: 1,
        };
      case 'GO':
        return {
          textColor: 'text-emerald-400',
          glowColor: 'rgba(52, 211, 153, 0.8)',
          borderColor: 'border-emerald-400/60',
          bgGradient: 'from-emerald-500/30 via-slate-900/95 to-slate-950/95',
          labelAr: 'انـطـلـق!',
          labelEn: 'START!',
          arabicNum: '!',
          beadsCount: 4,
        };
    }
  };

  const style = getStepStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl select-none">
      {/* Background Animated Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.15, 0.35, 0.15],
          }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          className="w-[450px] h-[450px] sm:w-[600px] sm:h-[600px] rounded-full border border-cyan-500/30 blur-sm"
        />
        <motion.div
          animate={{
            scale: [1.2, 0.95, 1.2],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] rounded-full border border-purple-500/30 blur-md"
        />
      </div>

      {/* Main Countdown Center Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={`relative z-10 w-full max-w-lg rounded-3xl p-6 sm:p-10 border ${style.borderColor} bg-gradient-to-b ${style.bgGradient} shadow-[0_0_80px_rgba(0,0,0,0.8)] text-center flex flex-col items-center justify-center overflow-hidden`}
      >
        {/* Top Header info */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-bold text-slate-300 tracking-wider font-mono">{title}</span>
        </div>

        {/* Soroban Abacus Beading Simulation (المعداد الذهني) */}
        <div className="w-full max-w-xs mb-6 px-4 py-3 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col items-center gap-2">
          <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>معداد الحساب الذهني / ABACUS COUNTER</span>
          </div>

          {/* Abacus Frame with Active Glowing Beads */}
          <div className="w-full h-10 bg-slate-900/90 rounded-xl border border-white/10 relative flex items-center justify-around px-3">
            {/* Abacus divider beam */}
            <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-[2px] bg-white/20" />

            {/* 4 Rods with Beads */}
            {[1, 2, 3, 4].map((rodIndex) => {
              const isBeadActive =
                step === 'GO' ? true : rodIndex <= (typeof step === 'number' ? step : 0);

              return (
                <div key={rodIndex} className="relative z-10 flex flex-col items-center justify-between h-7 w-6">
                  {/* Vertical rod */}
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-slate-700" />

                  {/* Upper bead */}
                  <motion.div
                    animate={{
                      y: isBeadActive ? 2 : -2,
                      scale: isBeadActive ? 1.15 : 0.9,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`relative z-10 w-4 h-2.5 rounded-sm border transition-all duration-300 ${
                      isBeadActive
                        ? 'bg-amber-400 border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.8)]'
                        : 'bg-slate-800 border-slate-700'
                    }`}
                  />

                  {/* Lower bead */}
                  <motion.div
                    animate={{
                      y: isBeadActive ? -2 : 2,
                      scale: isBeadActive ? 1.15 : 0.9,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`relative z-10 w-4 h-2.5 rounded-sm border transition-all duration-300 ${
                      isBeadActive
                        ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]'
                        : 'bg-slate-800 border-slate-700'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Central Giant Countdown Digit / GO! Display */}
        <div className="relative h-44 sm:h-52 w-full flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={String(step)}
              initial={{ opacity: 0, scale: 0.3, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.4, y: -20 }}
              transition={{
                type: 'spring',
                stiffness: 450,
                damping: 24,
              }}
              className="flex flex-col items-center justify-center"
            >
              {step === 'GO' ? (
                <div className="flex flex-col items-center">
                  <div
                    className="text-7xl sm:text-9xl font-black italic tracking-tighter text-emerald-400 drop-shadow-[0_0_35px_rgba(52,211,153,0.9)] flex items-center gap-2"
                  >
                    <span>GO!</span>
                    <Flame className="w-16 h-16 sm:w-20 sm:h-20 fill-emerald-400 text-emerald-300 animate-pulse" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-1 tracking-widest uppercase">
                    انطلق الآن!
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div
                    className={`text-8xl sm:text-9xl font-black font-mono leading-none ${style.textColor}`}
                    style={{
                      textShadow: `0 0 45px ${style.glowColor}`,
                    }}
                  >
                    {step}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm sm:text-base font-black text-white/90 tracking-widest font-mono">
                      {style.labelEn}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-sm sm:text-base font-black text-slate-200">
                      {style.labelAr}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Subtext */}
        <div className="text-xs text-slate-400 mt-3 font-medium">
          {step === 'GO' ? (
            <span className="text-emerald-400 font-bold animate-pulse">تظهر المسائل فوراً... ركّز وسدّد!</span>
          ) : (
            <span>استعد لتسديد الإجابات بدقة وسرعة عبر المعداد والأزرار</span>
          )}
        </div>
      </motion.div>
    </div>
  );
};
