import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ThreeBoxingMachine } from './ThreeBoxingMachine';
import { TwoPlayerResultsModal } from './TwoPlayerResultsModal';
import { StartCountdown } from './StartCountdown';
import { Question, LEDTheme, FlashCardToken, AdminSettings } from '../types';
import { soundEngine } from '../utils/audio';
import { fetchQuestionsForLevel, convertPromptSeqToTerms, formatPromptSequenceText } from '../utils/questionsBank';
import { ArrowLeft, Users, Trophy, RotateCcw, Zap, Flame, CheckCircle2, XCircle, Gauge, Lock } from 'lucide-react';
import { THREE_SPEED_PRESETS, SpeedPresetKey, getCurrentSpeedPresetKey, getActiveSpeedInfo, DEFAULT_ADMIN_SETTINGS } from '../utils/adminSettings';

interface TwoPlayerGameProps {
  theme: LEDTheme;
  onBackToMenu: () => void;
  adminSettings?: AdminSettings;
}


interface QuestionHistoryItem {
  questionNumber: number;
  promptText: string;
  correctAnswer: string;
  p1Answer: string;
  p1IsCorrect: boolean;
  p2Answer: string;
  p2IsCorrect: boolean;
}

export const TwoPlayerGame: React.FC<TwoPlayerGameProps> = ({ theme, onBackToMenu, adminSettings }) => {
  const activeAdminSettings = adminSettings || DEFAULT_ADMIN_SETTINGS;
  const speedInfo = React.useMemo(() => getActiveSpeedInfo(activeAdminSettings), [activeAdminSettings]);
  const flashMs = speedInfo.effectiveFlashMs;
  const qTimeLimit = speedInfo.timeLimitSec;

  // Config state
  const [level, setLevel] = useState<number>(activeAdminSettings.targetLevel ?? 1);
  const [isComplex, setIsComplex] = useState<boolean>(activeAdminSettings.isComplexMode ?? false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isCountdownActive, setIsCountdownActive] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isFetchingQuestions, setIsFetchingQuestions] = useState<boolean>(false);

  // Player 1 state
  const [p1Digits, setP1Digits] = useState<string>('');
  const [p1Score, setP1Score] = useState<number>(0);
  const [p1Combo, setP1Combo] = useState<number>(0);
  const [p1MaxCombo, setP1MaxCombo] = useState<number>(0);
  const [p1Correct, setP1Correct] = useState<number>(0);
  const [p1Wrong, setP1Wrong] = useState<number>(0);
  const [p1Submitted, setP1Submitted] = useState<boolean>(false);
  const [p1LastResult, setP1LastResult] = useState<'correct' | 'wrong' | null>(null);
  const [p1TimeSeconds, setP1TimeSeconds] = useState<number>(0);

  // Player 2 state
  const [p2Digits, setP2Digits] = useState<string>('');
  const [p2Score, setP2Score] = useState<number>(0);
  const [p2Combo, setP2Combo] = useState<number>(0);
  const [p2MaxCombo, setP2MaxCombo] = useState<number>(0);
  const [p2Correct, setP2Correct] = useState<number>(0);
  const [p2Wrong, setP2Wrong] = useState<number>(0);
  const [p2Submitted, setP2Submitted] = useState<boolean>(false);
  const [p2LastResult, setP2LastResult] = useState<'correct' | 'wrong' | null>(null);
  const [p2TimeSeconds, setP2TimeSeconds] = useState<number>(0);

  // Round start timestamp ref
  const roundStartTimeRef = useRef<number>(0);

  // Questions & Match History
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [activeToken, setActiveToken] = useState<FlashCardToken | null>(null);
  const [isShowingSeq, setIsShowingSeq] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(10);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [matchHistory, setMatchHistory] = useState<QuestionHistoryItem[]>([]);
  const [roundRevealed, setRoundRevealed] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Match Total Elapsed Time Counter
  useEffect(() => {
    if (!isPlaying || isGameOver || isCountdownActive) return;
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isGameOver, isCountdownActive]);

  const formatMMSS = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const p1TotalAtt = p1Correct + p1Wrong;
  const p1LiveAcc = p1TotalAtt > 0 ? Math.min(100, Math.max(0, Math.round((p1Correct / p1TotalAtt) * 100))) : 100;

  const p2TotalAtt = p2Correct + p2Wrong;
  const p2LiveAcc = p2TotalAtt > 0 ? Math.min(100, Math.max(0, Math.round((p2Correct / p2TotalAtt) * 100))) : 100;

  // Load / Generate Synchronized Questions
  const loadQuestions = async (lvl: number, complex: boolean) => {
    setIsFetchingQuestions(true);
    try {
      const res = await fetch('/api/generate-ai-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: lvl,
          isComplex: complex,
          count: 5,
          operations: complex ? ['+', '-', '*'] : ['+', '-'],
          theme: 'Mind Sport Two Player Head-To-Head',
        }),
      });
      const data = await res.json();
      if (data.success && data.questions?.length > 0) {
        setQuestions(
          data.questions.map((q: any) => ({
            ...q,
            promptSeq: convertPromptSeqToTerms(q.promptSeq || []),
          }))
        );
      } else {
        throw new Error('Fallback required');
      }
    } catch (e) {
      setQuestions(fetchQuestionsForLevel(lvl, complex, 5));
    } finally {
      setIsFetchingQuestions(false);
    }
  };

  // Start Match
  const startMatch = async () => {
    await loadQuestions(level, isComplex);
    setCurrentQIndex(0);
    setP1Score(0);
    setP1Combo(0);
    setP1MaxCombo(0);
    setP1Correct(0);
    setP1Wrong(0);
    setP1Submitted(false);
    setP1LastResult(null);
    setP1TimeSeconds(0);

    setP2Score(0);
    setP2Combo(0);
    setP2MaxCombo(0);
    setP2Correct(0);
    setP2Wrong(0);
    setP2Submitted(false);
    setP2LastResult(null);
    setP2TimeSeconds(0);

    setMatchHistory([]);
    setRoundRevealed(false);
    setElapsedTime(0);
    setIsGameOver(false);
    setIsPlaying(true);
    setIsCountdownActive(true);
  };

  const seqIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sequence Player & Round Timer
  useEffect(() => {
    if (!isPlaying || isCountdownActive || isGameOver || questions.length === 0 || currentQIndex >= questions.length) return;

    if (seqIntervalRef.current) clearInterval(seqIntervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    const q = questions[currentQIndex];
    setP1Digits('');
    setP2Digits('');
    setP1Submitted(false);
    setP2Submitted(false);
    setP1LastResult(null);
    setP2LastResult(null);
    setRoundRevealed(false);
    setIsShowingSeq(true);

    if (!q.promptSeq || q.promptSeq.length === 0) {
      setActiveToken(null);
      setIsShowingSeq(false);
      startRoundCountdown(qTimeLimit);
      return;
    }

    setActiveToken(q.promptSeq[0]);
    soundEngine.playTargetActivate();
    let idx = 1;

    seqIntervalRef.current = setInterval(() => {
      if (idx < q.promptSeq.length) {
        setActiveToken(q.promptSeq[idx]);
        soundEngine.playTargetActivate();
        idx++;
      } else {
        setActiveToken(null);
        setIsShowingSeq(false);
        if (seqIntervalRef.current) clearInterval(seqIntervalRef.current);
        startRoundCountdown(qTimeLimit);
      }
    }, flashMs);

    return () => {
      if (seqIntervalRef.current) clearInterval(seqIntervalRef.current);
    };
  }, [currentQIndex, questions, isPlaying, isCountdownActive, flashMs, qTimeLimit]);

  const startRoundCountdown = (limitSec: number) => {
    roundStartTimeRef.current = Date.now();
    let rem = limitSec;
    setTimeRemaining(rem);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      rem -= 0.1;
      setTimeRemaining(Math.max(0, rem));
      if (rem <= 0) {
        clearInterval(timerRef.current!);
        handleTimeExpired();
      }
    }, 100);
  };

  // Check if both players have submitted, then trigger round reveal & advance
  const checkBothSubmitted = (
    p1Sub: boolean,
    p2Sub: boolean,
    p1Ans: string,
    p2Ans: string,
    p1IsCorr: boolean,
    p2IsCorr: boolean
  ) => {
    if (p1Sub && p2Sub && !roundRevealed) {
      setRoundRevealed(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const q = questions[currentQIndex];
      const historyItem: QuestionHistoryItem = {
        questionNumber: currentQIndex + 1,
        promptText: formatPromptSequenceText(q.promptSeq),
        correctAnswer: q.answer,
        p1Answer: p1Ans,
        p1IsCorrect: p1IsCorr,
        p2Answer: p2Ans,
        p2IsCorrect: p2IsCorr,
      };

      setMatchHistory((prev) => [...prev, historyItem]);

      setTimeout(() => {
        advanceRound();
      }, 1200);
    }
  };

  // Handle Player 1 Input Handlers
  const handleP1Digit = (digit: number) => {
    if (!isPlaying || isShowingSeq || p1Submitted || isGameOver) return;
    setP1Digits((prev) => prev + String(digit));
  };

  const handleP1ToggleMinus = () => {
    if (!isPlaying || isShowingSeq || p1Submitted || isGameOver) return;
    setP1Digits((prev) => (prev.startsWith('-') ? prev.slice(1) : '-' + prev));
  };

  const handleP1Backspace = () => {
    if (!isPlaying || isShowingSeq || p1Submitted || isGameOver) return;
    setP1Digits((prev) => prev.slice(0, -1));
  };

  const handleP1Clear = () => {
    if (!isPlaying || isShowingSeq || p1Submitted || isGameOver) return;
    setP1Digits('');
  };

  const handleP1Submit = () => {
    if (!isPlaying || isShowingSeq || p1Submitted || isGameOver || !p1Digits) return;

    if (roundStartTimeRef.current > 0) {
      const elapsed = Math.max(0.1, (Date.now() - roundStartTimeRef.current) / 1000);
      setP1TimeSeconds((prev) => prev + elapsed);
    }

    const q = questions[currentQIndex];
    const isCorr = p1Digits.trim() === q.answer.trim();

    setP1Submitted(true);
    if (isCorr) {
      const newCombo = p1Combo + 1;
      setP1Combo(newCombo);
      setP1MaxCombo((m) => Math.max(m, newCombo));
      setP1Score((s) => s + 150 + newCombo * 20);
      setP1Correct((c) => c + 1);
      setP1LastResult('correct');
      soundEngine.playCorrectSound(newCombo);
    } else {
      setP1Combo(0);
      setP1Wrong((w) => w + 1);
      setP1LastResult('wrong');
      soundEngine.playWrongSound();
    }

    checkBothSubmitted(true, p2Submitted, p1Digits, p2Digits, isCorr, p2LastResult === 'correct');
  };

  // Handle Player 2 Input Handlers
  const handleP2Digit = (digit: number) => {
    if (!isPlaying || isShowingSeq || p2Submitted || isGameOver) return;
    setP2Digits((prev) => prev + String(digit));
  };

  const handleP2ToggleMinus = () => {
    if (!isPlaying || isShowingSeq || p2Submitted || isGameOver) return;
    setP2Digits((prev) => (prev.startsWith('-') ? prev.slice(1) : '-' + prev));
  };

  const handleP2Backspace = () => {
    if (!isPlaying || isShowingSeq || p2Submitted || isGameOver) return;
    setP2Digits((prev) => prev.slice(0, -1));
  };

  const handleP2Clear = () => {
    if (!isPlaying || isShowingSeq || p2Submitted || isGameOver) return;
    setP2Digits('');
  };

  const handleP2Submit = () => {
    if (!isPlaying || isShowingSeq || p2Submitted || isGameOver || !p2Digits) return;

    if (roundStartTimeRef.current > 0) {
      const elapsed = Math.max(0.1, (Date.now() - roundStartTimeRef.current) / 1000);
      setP2TimeSeconds((prev) => prev + elapsed);
    }

    const q = questions[currentQIndex];
    const isCorr = p2Digits.trim() === q.answer.trim();

    setP2Submitted(true);
    if (isCorr) {
      const newCombo = p2Combo + 1;
      setP2Combo(newCombo);
      setP2MaxCombo((m) => Math.max(m, newCombo));
      setP2Score((s) => s + 150 + newCombo * 20);
      setP2Correct((c) => c + 1);
      setP2LastResult('correct');
      soundEngine.playCorrectSound(newCombo);
    } else {
      setP2Combo(0);
      setP2Wrong((w) => w + 1);
      setP2LastResult('wrong');
      soundEngine.playWrongSound();
    }

    checkBothSubmitted(p1Submitted, true, p1Digits, p2Digits, p1LastResult === 'correct', isCorr);
  };

  // Time Expired for round
  const handleTimeExpired = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const q = questions[currentQIndex];
    const maxRoundSec = adminSettings?.timeLimitSeconds ?? q.timeLimitSeconds ?? 10;

    let p1Ans = p1Digits;
    let p1IsCorr = p1LastResult === 'correct';
    if (!p1Submitted) {
      setP1TimeSeconds((prev) => prev + maxRoundSec);
      p1IsCorr = p1Digits.trim() === q.answer.trim() && p1Digits !== '';
      if (p1IsCorr) {
        setP1Score((s) => s + 150);
        setP1Correct((c) => c + 1);
        setP1LastResult('correct');
      } else {
        setP1Wrong((w) => w + 1);
        setP1LastResult('wrong');
      }
      setP1Submitted(true);
    }

    let p2Ans = p2Digits;
    let p2IsCorr = p2LastResult === 'correct';
    if (!p2Submitted) {
      setP2TimeSeconds((prev) => prev + maxRoundSec);
      p2IsCorr = p2Digits.trim() === q.answer.trim() && p2Digits !== '';
      if (p2IsCorr) {
        setP2Score((s) => s + 150);
        setP2Correct((c) => c + 1);
        setP2LastResult('correct');
      } else {
        setP2Wrong((w) => w + 1);
        setP2LastResult('wrong');
      }
      setP2Submitted(true);
    }

    setRoundRevealed(true);

    const historyItem: QuestionHistoryItem = {
      questionNumber: currentQIndex + 1,
      promptText: formatPromptSequenceText(q.promptSeq),
      correctAnswer: q.answer,
      p1Answer: p1Ans || '(لم تجب)',
      p1IsCorrect: p1IsCorr,
      p2Answer: p2Ans || '(لم تجب)',
      p2IsCorrect: p2IsCorr,
    };

    setMatchHistory((prev) => [...prev, historyItem]);

    setTimeout(() => {
      advanceRound();
    }, 1200);
  };

  const advanceRound = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      setIsPlaying(false);
      setIsGameOver(true);

      soundEngine.playVictorySound();
      
      const totalQ = questions.length || 1;
      const p1Acc = Math.round((p1Correct / totalQ) * 100);
      const p2Acc = Math.round((p2Correct / totalQ) * 100);
      if (p1Acc >= 70 || p2Acc >= 70) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between p-3 md:p-6 select-none">
      {/* Top Header / HUD */}
      <header className="relative z-10 w-full max-w-7xl flex items-center justify-between pb-3 border-b border-pink-500/20">
        <button
          onClick={onBackToMenu}
          className="px-4 py-2 rounded-2xl bg-pink-950/40 hover:bg-pink-900/40 backdrop-blur-md border border-pink-500/30 hover:border-pink-400 text-slate-200 hover:text-white flex items-center gap-2 text-xs font-bold uppercase transition-all shadow-lg shadow-pink-500/10"
        >
          <ArrowLeft className="w-4 h-4 text-pink-400" />
          <span className="hidden sm:inline">MENU</span>
        </button>

        {/* SPEEDDIGITS Brand Title */}
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-fuchsia-300 to-purple-400 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">
            SPEEDDIGITS
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-purple-500/15 backdrop-blur-md border border-purple-400/30 text-purple-300 font-black text-xs uppercase flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">TWO PLAYER</span> DUAL ARENA
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-pink-500/15 backdrop-blur-md border border-pink-400/30 text-pink-300 font-black text-xs uppercase flex items-center gap-1.5">
            <span>LEVEL {level} • {isComplex ? 'COMPLEX / متقدم' : 'EASY / سهل'} • {speedInfo.icon} {speedInfo.displayNameAr} ({speedInfo.effectiveFlashMs}ms)</span>
            <Lock className="w-3 h-3 text-pink-400" />
          </div>
        </div>
      </header>

      {!isPlaying && !isGameOver ? (
        /* Setup Arena screen */
        <div className="relative z-10 my-auto w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center">
          <div className="w-14 h-14 rounded-3xl bg-purple-500/15 text-purple-300 border border-purple-400/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <Users className="w-7 h-7 text-purple-400" />
          </div>

          <div className="text-[10px] font-bold tracking-[0.3em] text-purple-400 uppercase mb-1 opacity-80">
            Synchronized Hologram Arena
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">SPLIT SCREEN HEAD-TO-HEAD</h2>
          <p className="text-xs text-slate-300/80 max-w-md mb-6 leading-relaxed">
            لاعبان في مواجهة مباشرة! تظهر المسائل الرقمية في وقت واحد، ويقوم كل لاعب بكتابة النتيجة وإرسالها بشكل مستقل!
          </p>

          {/* Difficulty Mode Selector Tabs (Easy / Complex) */}
          <div className="w-full mb-5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
              <span>اختر الوضع / SELECT MODE</span>
            </div>
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950/60 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setIsComplex(false)}
                className={`py-2.5 px-4 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-0.5 ${
                  !isComplex
                    ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-sm font-bold">الوضع السهل</span>
                <span className="text-[10px] opacity-80">EASY MODE</span>
              </button>

              <button
                type="button"
                onClick={() => setIsComplex(true)}
                className={`py-2.5 px-4 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-0.5 ${
                  isComplex
                    ? 'bg-purple-500/20 border border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-sm font-bold">الوضع المتقدم</span>
                <span className="text-[10px] opacity-80">COMPLEX MODE</span>
              </button>
            </div>
          </div>

          {/* Speed Info (Exclusively Locked & Controlled by Admin) */}
          <div className="w-full mb-5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-950/90 via-slate-900/90 to-slate-950/90 border border-purple-500/30 flex items-center justify-between shadow-[0_0_20px_rgba(168,85,247,0.15)]">
            <div className="flex items-center gap-3 text-right">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400 text-purple-300 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                {speedInfo.icon}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                  <span>سرعة اللعبة: {speedInfo.displayNameAr}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 font-bold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    معتمدة من الأدمن
                  </span>
                </div>
                <div className="text-[10px] text-slate-300/80 font-mono mt-0.5">
                  وميض الرقم: <span className="text-cyan-300 font-bold">{speedInfo.effectiveFlashMs}ms</span> • وقت الإجابة: <span className="text-purple-300 font-bold">{speedInfo.timeLimitSec}s</span>
                </div>
              </div>
            </div>

            <div className="hidden sm:block text-left text-[10px] text-slate-400 font-mono">
              <div className="text-slate-400">ADMIN CONTROLLED</div>
              <div className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                LOCKED
              </div>
            </div>
          </div>

          {/* Level 0 to 6 Selection Grid */}
          <div className="w-full mb-8">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
              <span>اختر المستوى / SELECT LEVEL</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center gap-0.5 ${
                    level === l
                      ? 'bg-purple-500/20 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] scale-105'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-xs font-black text-purple-300">Level {l}</span>
                  <span className="text-[10px] font-bold opacity-80">
                    {l === 0 ? 'Starter' : `Lvl ${l}`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startMatch}
            disabled={isFetchingQuestions}
            className="w-full py-4 rounded-2xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            {isFetchingQuestions ? (
              <Zap className="w-5 h-5 animate-spin fill-slate-950" />
            ) : (
              <Flame className="w-5 h-5 fill-slate-950" />
            )}
            {isFetchingQuestions
              ? 'GENERATING MATCH...'
              : `START BATTLE - LEVEL ${level} (${isComplex ? 'COMPLEX' : 'EASY'})`}
          </button>
        </div>
      ) : isGameOver ? (
        <TwoPlayerResultsModal
          p1Score={p1Score}
          p1Correct={p1Correct}
          p1Wrong={p1Wrong}
          p1MaxCombo={p1MaxCombo}
          p1TimeSeconds={p1TimeSeconds}
          p2Score={p2Score}
          p2Correct={p2Correct}
          p2Wrong={p2Wrong}
          p2MaxCombo={p2MaxCombo}
          p2TimeSeconds={p2TimeSeconds}
          totalQuestions={questions.length}
          matchTimeSeconds={elapsedTime}
          history={matchHistory}
          onRetry={startMatch}
          onMenu={onBackToMenu}
        />
      ) : (
        /* Split Screen Dual Machine & Answer Keypads Arena */
        <div className="relative z-10 w-full max-w-7xl flex-1 flex flex-col gap-3 my-auto py-2">
          {/* Central Arena Match HUD (Time & Round Progress) */}
          <div className="bg-slate-950/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center justify-between shadow-[0_0_20px_rgba(255,255,255,0.05)] text-xs font-black">
            <div className="flex items-center gap-2 text-cyan-400">
              <span className="text-[10px] uppercase text-slate-400">الجولة / ROUND:</span>
              <span className="text-sm font-mono text-white">{currentQIndex + 1} / {questions.length}</span>
            </div>

            <div className="flex items-center gap-2 text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>الوقت الإجمالي / TIME: <span className="font-mono text-sm text-white">{formatMMSS(elapsedTime)}</span></span>
            </div>

            <div className="flex items-center gap-2 text-purple-400">
              <span className="text-[10px] uppercase text-slate-400">SPEED:</span>
              <span className="text-xs uppercase text-purple-300 font-bold">{speedInfo.icon} {speedInfo.displayNameAr} ({speedInfo.effectiveFlashMs}ms)</span>
            </div>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* PLAYER 1 COLUMN */}
            <div className="flex flex-col gap-3">
              {/* P1 Score Banner */}
              <div className="bg-slate-950/80 backdrop-blur-md border border-cyan-400/40 px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-[0_0_20px_rgba(0,240,255,0.15)]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">
                    PLAYER 1 / اللاعب 1
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                    دقة %{p1LiveAcc}
                  </span>
                  {p1Combo > 1 && (
                    <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> {p1Combo}x
                    </span>
                  )}
                  <span className="text-lg sm:text-xl font-black text-white">{p1Score} PTS</span>
                </div>
              </div>

              {/* 3D Boxing Machine Player 1 */}
              <div className="h-[380px] sm:h-[460px] md:h-[520px] w-full rounded-2xl overflow-hidden border border-cyan-500/20">
                <ThreeBoxingMachine
                  theme="cyber-neon"
                  activeToken={activeToken}
                  userInputDigits={p1Digits}
                  comboCount={p1Combo}
                  timeRemaining={timeRemaining}
                  timeMax={10}
                  onPunchDigit={handleP1Digit}
                  onToggleMinus={handleP1ToggleMinus}
                  onClear={handleP1Clear}
                  onSubmitAnswer={handleP1Submit}
                  labelTitle="P1 MACHINE"
                  interactive={!isShowingSeq && !p1Submitted}
                  isSubmitted={p1Submitted}
                />
              </div>
            </div>

            {/* PLAYER 2 COLUMN */}
            <div className="flex flex-col gap-3">
              {/* P2 Score Banner */}
              <div className="bg-slate-950/80 backdrop-blur-md border border-purple-400/40 px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-xs font-black text-purple-400 uppercase tracking-widest">
                    PLAYER 2 / اللاعب 2
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                    دقة %{p2LiveAcc}
                  </span>
                  {p2Combo > 1 && (
                    <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> {p2Combo}x
                    </span>
                  )}
                  <span className="text-lg sm:text-xl font-black text-white">{p2Score} PTS</span>
                </div>
              </div>

              {/* 3D Boxing Machine Player 2 */}
              <div className="h-[380px] sm:h-[460px] md:h-[520px] w-full rounded-2xl overflow-hidden border border-purple-500/20">
                <ThreeBoxingMachine
                  theme="laser-purple"
                  activeToken={activeToken}
                  userInputDigits={p2Digits}
                  comboCount={p2Combo}
                  timeRemaining={timeRemaining}
                  timeMax={10}
                  onPunchDigit={handleP2Digit}
                  onToggleMinus={handleP2ToggleMinus}
                  onClear={handleP2Clear}
                  onSubmitAnswer={handleP2Submit}
                  labelTitle="P2 MACHINE"
                  interactive={!isShowingSeq && !p2Submitted}
                  isSubmitted={p2Submitted}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3-2-1-GO! Mental Math Countdown Overlay */}
      {isCountdownActive && (
        <StartCountdown
          title={`مواجهة ثنائية (Head-to-Head) - المستوى ${level} (${isComplex ? 'مسائل مركبة' : 'مسائل أساسية'})`}
          onComplete={() => setIsCountdownActive(false)}
        />
      )}
    </div>
  );
};
