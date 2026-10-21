import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ThreeBoxingMachine } from './ThreeBoxingMachine';
import { MatchResultsModal } from './MatchResultsModal';
import { StartCountdown } from './StartCountdown';
import { Question, LEDTheme, FlashCardToken, AdminSettings } from '../types';
import { soundEngine } from '../utils/audio';
import { fetchQuestionsForLevel, convertPromptSeqToTerms } from '../utils/questionsBank';
import { ArrowLeft, RotateCcw, Zap, Award, Flame, CheckCircle2, AlertCircle, Sparkles, Gauge, Lock, Play } from 'lucide-react';
import { THREE_SPEED_PRESETS, SpeedPresetKey, getCurrentSpeedPresetKey, getActiveSpeedInfo, DEFAULT_ADMIN_SETTINGS } from '../utils/adminSettings';

interface SinglePlayerGameProps {
  theme: LEDTheme;
  onBackToMenu: () => void;
  adminSettings?: AdminSettings;
}

export const SinglePlayerGame: React.FC<SinglePlayerGameProps> = ({ theme, onBackToMenu, adminSettings }) => {
  const activeAdminSettings = adminSettings || DEFAULT_ADMIN_SETTINGS;
  const speedInfo = React.useMemo(() => getActiveSpeedInfo(activeAdminSettings), [activeAdminSettings]);
  const flashMs = speedInfo.effectiveFlashMs;
  const qTimeLimit = speedInfo.timeLimitSec;

  // Config state
  const [level, setLevel] = useState<number>(activeAdminSettings.targetLevel ?? 1);
  const [isComplex, setIsComplex] = useState<boolean>(activeAdminSettings.isComplexMode ?? false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isCountdownActive, setIsCountdownActive] = useState<boolean>(false);


  // Question state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [activeToken, setActiveToken] = useState<FlashCardToken | null>(null);
  const [isShowingSequence, setIsShowingSequence] = useState<boolean>(false);

  // Input & Match state
  const [userInputDigits, setUserInputDigits] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);

  // Timer & Feedback
  const [timeRemaining, setTimeRemaining] = useState<number>(10);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [flashStatus, setFlashStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [isMatchOver, setIsMatchOver] = useState<boolean>(false);
  const [isFetchingQuestions, setIsFetchingQuestions] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const seqIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Total elapsed time tracker
  useEffect(() => {
    if (!isPlaying || isMatchOver || isCountdownActive) return;
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isMatchOver, isCountdownActive]);

  const formatMMSS = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalAttempted = correctCount + wrongCount;
  const liveAccuracyPct = totalAttempted > 0 ? Math.min(100, Math.max(0, Math.round((correctCount / totalAttempted) * 100))) : 100;

  // Generate Questions via API or Fallback
  const loadQuestions = async (lvl: number, complex: boolean) => {
    setIsFetchingQuestions(true);
    try {
      const res = await fetch('/api/generate-ai-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store',
        },
        body: JSON.stringify({
          level: lvl,
          isComplex: complex,
          count: 5,
          operations: complex ? ['+', '-', '*'] : ['+', '-'],
          theme: 'Mind Sport Single Player',
          timestamp: Date.now(),
        }),
      });
      const data = await res.json();
      if (data.success && data.questions?.length > 0) {
        setQuestions(data.questions.map((q: any) => ({
          ...q,
          promptSeq: convertPromptSeqToTerms(q.promptSeq || []),
        })));
      } else {
        throw new Error('Fallback required');
      }
    } catch (e) {
      // Local fallback generator from TALMAS bank or level logic
      setQuestions(fetchQuestionsForLevel(lvl, complex, 5));
    } finally {
      setIsFetchingQuestions(false);
    }
  };

  const startNewGame = async () => {
    await loadQuestions(level, isComplex);
    setCurrentQIndex(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setWrongCount(0);
    setElapsedTime(0);
    setIsMatchOver(false);
    setIsPlaying(true);
    setIsCountdownActive(true);
  };

  // Start Sequence Animation for current Question
  useEffect(() => {
    if (!isPlaying || isCountdownActive || isMatchOver || questions.length === 0 || currentQIndex >= questions.length) return;

    if (seqIntervalRef.current) clearInterval(seqIntervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    const currQ = questions[currentQIndex];
    setUserInputDigits('');
    setIsShowingSequence(true);
    setFlashStatus('idle');
    setTimeRemaining(qTimeLimit);

    if (!currQ.promptSeq || currQ.promptSeq.length === 0) {
      setActiveToken(null);
      setIsShowingSequence(false);
      startAnswerCountdown(qTimeLimit);
      return;
    }

    // Sequence Player Loop: Show first token immediately
    setActiveToken(currQ.promptSeq[0]);
    soundEngine.playTargetActivate();

    let seqIdx = 1;
    seqIntervalRef.current = setInterval(() => {
      if (seqIdx < currQ.promptSeq.length) {
        const token = currQ.promptSeq[seqIdx];
        setActiveToken(token);
        soundEngine.playTargetActivate();
        seqIdx++;
      } else {
        // Clear active card when all numbers have been shown
        setActiveToken(null);
        setIsShowingSequence(false);
        if (seqIntervalRef.current) clearInterval(seqIntervalRef.current);
        startAnswerCountdown(qTimeLimit);
      }
    }, flashMs);

    return () => {
      if (seqIntervalRef.current) clearInterval(seqIntervalRef.current);
    };
  }, [currentQIndex, questions, isPlaying, isCountdownActive, flashMs, qTimeLimit]);


  // Answer Countdown
  const startAnswerCountdown = (maxSec: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    let rem = maxSec;

    timerRef.current = setInterval(() => {
      rem -= 0.1;
      setTimeRemaining(Math.max(0, rem));

      if (rem <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        handleWrongAnswer('TIME EXPIRED');
      }
    }, 100);
  };

  // Process Digit Punch Input
  const handlePunchDigit = (digit: number) => {
    if (!isPlaying || isShowingSequence || isMatchOver || questions.length === 0) return;
    setUserInputDigits((prev) => prev + String(digit));
  };

  const handleToggleMinus = () => {
    if (!isPlaying || isShowingSequence || isMatchOver) return;
    setUserInputDigits((prev) => (prev.startsWith('-') ? prev.slice(1) : '-' + prev));
  };

  const handleBackspace = () => {
    if (!isPlaying || isShowingSequence || isMatchOver) return;
    setUserInputDigits((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (!isPlaying || isShowingSequence || isMatchOver) return;
    setUserInputDigits('');
  };

  const handleSubmitAnswer = () => {
    if (!isPlaying || isShowingSequence || isMatchOver || !userInputDigits || questions.length === 0) return;

    const currentQ = questions[currentQIndex];
    if (timerRef.current) clearInterval(timerRef.current);

    if (userInputDigits.trim() === currentQ.answer.trim()) {
      // Correct Punch!
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo((prev) => Math.max(prev, newCombo));
      setScore((prev) => prev + 100 * newCombo + Math.round(timeRemaining * 10));
      setCorrectCount((prev) => prev + 1);
      setFlashStatus('correct');
      soundEngine.playCorrectSound(newCombo);

      setTimeout(() => {
        advanceToNextQuestion();
      }, 800);
    } else {
      // Wrong Punch!
      handleWrongAnswer('INCORRECT ANSWER');
    }
  };

  const handleWrongAnswer = (reason: string) => {
    setCombo(0);
    setWrongCount((prev) => prev + 1);
    setFlashStatus('wrong');
    soundEngine.playWrongSound();

    setTimeout(() => {
      advanceToNextQuestion();
    }, 1000);
  };

  const advanceToNextQuestion = () => {
    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      // Match Finish
      setIsPlaying(false);
      setIsMatchOver(true);
      soundEngine.playVictorySound();
      
      const totalQ = questions.length || 1;
      const acc = Math.round((correctCount / totalQ) * 100);
      if (acc >= 70) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between p-4 md:p-6 select-none">
      {/* Top HUD Bar */}
      <header className="relative z-10 w-full max-w-6xl flex items-center justify-between pb-3 border-b border-pink-500/20">
        <button
          onClick={onBackToMenu}
          className="px-4 py-2 rounded-2xl bg-pink-950/40 hover:bg-pink-900/40 backdrop-blur-md border border-pink-500/30 hover:border-pink-400 text-slate-200 hover:text-white flex items-center gap-2 text-xs font-bold uppercase transition-all shadow-lg shadow-pink-500/10 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-pink-400" />
          <span className="hidden sm:inline">MENU</span>
        </button>

        {/* Mind Sport Brand Title */}
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-fuchsia-300 to-purple-400 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">
            Mind Sport
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-pink-950/40 border border-pink-500/30 text-pink-300 font-bold text-xs uppercase">
            Level {level} {isComplex ? '• Complex' : ''}
          </div>
        </div>
      </header>

      {/* Main Game Arena / Screens */}
      {!isPlaying && !isMatchOver ? (
        /* Setup Screen: ONLY Title, Mode, and Level as requested */
        <div className="relative z-10 my-auto w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center">
          <div className="w-14 h-14 rounded-3xl bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            <Play className="w-7 h-7 fill-cyan-300" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-6">Single Player</h2>

          {/* Mode Selector (Easy / Complex) */}
          <div className="w-full mb-6">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
              Mode
            </div>
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950/60 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setIsComplex(false)}
                className={`py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  !isComplex
                    ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Easy Mode</span>
              </button>

              <button
                type="button"
                onClick={() => setIsComplex(true)}
                className={`py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isComplex
                    ? 'bg-purple-500/20 border border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Complex Mode</span>
              </button>
            </div>
          </div>

          {/* Level 0 to 6 Selection */}
          <div className="w-full mb-8">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
              Level
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    level === l
                      ? 'bg-cyan-400/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.3)] scale-105'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-xs font-black text-cyan-400">Level {l}</span>
                  <span className="text-[10px] font-bold opacity-80">
                    {l === 0 ? 'Starter' : `Lvl ${l}`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startNewGame}
            disabled={isFetchingQuestions}
            className="w-full py-4 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
          >
            {isFetchingQuestions ? (
              <Sparkles className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5 fill-slate-950" />
            )}
            <span>{isFetchingQuestions ? 'Starting...' : 'Start Game'}</span>
          </button>
        </div>
      ) : isMatchOver ? (
        /* Match Results Screen */
        <MatchResultsModal
          score={score}
          timeSeconds={elapsedTime}
          totalQuestions={questions.length}
          correctCount={correctCount}
          wrongCount={wrongCount}
          notAnsweredCount={Math.max(0, questions.length - correctCount - wrongCount)}
          onRetry={startNewGame}
          onMenu={onBackToMenu}
        />
      ) : (
        /* Active 3D Machine Arena Screen: Focused solely on interactive device */
        <div className="relative z-10 w-full max-w-5xl flex-1 flex flex-col gap-2.5 items-center justify-center my-auto py-1">
          {/* Streamlined Minimal In-Game Top Bar */}
          <div className="w-full flex items-center justify-between px-4 py-2 rounded-2xl bg-slate-950/70 border border-white/10 text-xs font-bold">
            <div className="flex items-center gap-2 text-cyan-300">
              <span className="text-slate-400 text-[10px] uppercase">Round:</span>
              <span className="font-mono text-white text-sm">{currentQIndex + 1} / {questions.length}</span>
            </div>

            <div className="flex items-center gap-2 text-amber-300 font-mono text-sm">
              <span className="text-slate-400 text-[10px] uppercase font-sans">Time:</span>
              <span>{formatMMSS(elapsedTime)}</span>
            </div>

            <div className="flex items-center gap-2 text-emerald-400">
              <span className="text-slate-400 text-[10px] uppercase">Score:</span>
              <span className="font-mono text-white text-sm">{score} PTS</span>
            </div>
          </div>

          {/* Center 3D Smart Boxing Machine - Maximized Space */}
          <div className="w-full flex-1 h-[520px] sm:h-[600px] md:h-[680px] max-h-[82vh] rounded-2xl overflow-hidden border border-cyan-500/20">
            <ThreeBoxingMachine
              theme={theme}
              activeToken={activeToken}
              userInputDigits={userInputDigits}
              comboCount={combo}
              timeRemaining={timeRemaining}
              timeMax={qTimeLimit}
              onPunchDigit={handlePunchDigit}
              onToggleMinus={handleToggleMinus}
              onClear={handleClear}
              onSubmitAnswer={handleSubmitAnswer}
              flashStatus={flashStatus}
              interactive={!isShowingSequence}
              labelTitle={questions[currentQIndex]?.displayTitle || 'Mind Sport'}
            />
          </div>
        </div>
      )}

      {/* 3-2-1-GO! Mental Math Countdown Overlay */}
      {isCountdownActive && (
        <StartCountdown
          title={`تحدي الحساب الذهني - المستوى ${level} (${isComplex ? 'مسائل مركبة' : 'مسائل أساسية'})`}
          onComplete={() => setIsCountdownActive(false)}
        />
      )}
    </div>
  );
};
