import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ThreeBoxingMachine } from './ThreeBoxingMachine';
import { MatchResultsModal } from './MatchResultsModal';
import { Question, LEDTheme, FlashCardToken, AdminSettings } from '../types';
import { soundEngine } from '../utils/audio';
import { fetchQuestionsForLevel, convertPromptSeqToTerms } from '../utils/questionsBank';
import { ArrowLeft, RotateCcw, Zap, Award, Flame, CheckCircle2, AlertCircle, Sparkles, Gauge, Lock } from 'lucide-react';
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
    if (!isPlaying || isMatchOver) return;
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isMatchOver]);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: lvl,
          isComplex: complex,
          count: 5,
          operations: complex ? ['+', '-', '*'] : ['+', '-'],
          theme: 'Mind Sport Single Player',
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
  };

  // Start Sequence Animation for current Question
  useEffect(() => {
    if (!isPlaying || isMatchOver || questions.length === 0 || currentQIndex >= questions.length) return;

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
  }, [currentQIndex, questions, isPlaying, flashMs, qTimeLimit]);


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
      {/* Top HUD Controls Bar */}
      <header className="relative z-10 w-full max-w-6xl flex items-center justify-between pb-3 border-b border-pink-500/20">
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

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-pink-950/30 backdrop-blur-md border border-pink-500/30 px-3 sm:px-4 py-1.5 rounded-xl">
            <span className="text-[10px] font-bold text-pink-300 uppercase tracking-widest">LEVEL:</span>
            <select
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              disabled={isPlaying}
              className="bg-transparent text-pink-400 font-black text-xs focus:outline-none cursor-pointer"
            >
              {[0, 1, 2, 3, 4, 5, 6].map((l) => (
                <option key={l} value={l} className="bg-[#0a0f1d] text-white">
                  Level {l} {l === 0 ? '(Easy)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsComplex(!isComplex)}
            disabled={isPlaying}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all border backdrop-blur-md ${
              isComplex
                ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            {isComplex ? '⚡ COMPLEX' : 'STANDARD'}
          </button>
        </div>
      </header>

      {/* Main Game Arena / Screens */}
      {!isPlaying && !isMatchOver ? (
        <div className="relative z-10 my-auto w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center">
          <div className="w-14 h-14 rounded-3xl bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            <Zap className="w-7 h-7 fill-cyan-300" />
          </div>

          <div className="text-[10px] font-bold tracking-[0.3em] text-cyan-400 uppercase mb-1 opacity-80">
            Holographic Memory Module
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">SINGLE PLAYER MENTAL DRILL</h2>
          <p className="text-xs text-slate-300/80 max-w-md mb-6 leading-relaxed">
            Memorize sequential flashcards and punch illuminated target pads at high velocity.
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
          <div className="w-full mb-5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-950/90 via-slate-900/90 to-slate-950/90 border border-pink-500/30 flex items-center justify-between shadow-[0_0_20px_rgba(236,72,153,0.15)]">
            <div className="flex items-center gap-3 text-right">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-400 text-pink-300 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                {speedInfo.icon}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                  <span>سرعة اللعبة: {speedInfo.displayNameAr}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-300 font-bold flex items-center gap-1">
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
            className="w-full py-4 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            {isFetchingQuestions ? (
              <Sparkles className="w-5 h-5 animate-spin" />
            ) : (
              <Flame className="w-5 h-5 fill-slate-950" />
            )}
            {isFetchingQuestions ? 'GENERATING DRILL...' : `START DRILL - LEVEL ${level} (${isComplex ? 'COMPLEX' : 'EASY'})`}
          </button>
        </div>
      ) : isMatchOver ? (
        /* SPEEDDIGITS Match Results Screen */
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
        /* Active 3D Machine Arena Screen */
        <div className="relative z-10 w-full max-w-6xl flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6 items-center justify-center my-auto py-2">
          {/* Side Match Stats Glass Panel */}
          <div className="w-full lg:w-60 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-5 shadow-[0_0_30px_rgba(0,0,0,0.5)] grid grid-cols-2 lg:flex lg:flex-col justify-between items-center gap-3">
            <div className="w-full text-center lg:text-left">
              <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em] mb-0.5">PROGRESS / التقدم</div>
              <div className="text-lg sm:text-2xl font-black text-white">
                {currentQIndex + 1} <span className="text-xs sm:text-sm text-slate-500">/ {questions.length}</span>
              </div>
            </div>

            <div className="w-full text-center lg:text-left">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.2em] mb-0.5">TIME / الوقت</div>
              <div className="text-lg sm:text-2xl font-black text-amber-300 font-mono">
                {formatMMSS(elapsedTime)}
              </div>
            </div>

            <div className="w-full text-center lg:text-left">
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] mb-0.5">ACCURACY / الدقة</div>
              <div className="text-lg sm:text-2xl font-black text-emerald-300">
                %{liveAccuracyPct}
              </div>
            </div>

            <div className="w-full text-center lg:text-left">
              <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em] mb-0.5">SCORE / النتيجة</div>
              <div className="text-xl sm:text-2xl font-black text-cyan-300">{score}</div>
            </div>

            <div className="w-full text-center lg:text-left col-span-2 lg:col-span-1">
              <div className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.2em] mb-0.5">COMBO / الكومبو</div>
              <div className="text-lg sm:text-xl font-black text-purple-300">{combo}x</div>
            </div>
          </div>

          {/* Center 3D Smart Boxing Machine */}
          <div className="w-full flex-1 h-[460px] sm:h-[520px] md:h-[580px] lg:h-[640px] max-h-[78vh] rounded-2xl overflow-hidden border border-cyan-500/20">
            <ThreeBoxingMachine
              theme={theme}
              activeToken={activeToken}
              userInputDigits={userInputDigits}
              comboCount={combo}
              timeRemaining={timeRemaining}
              timeMax={questions[currentQIndex]?.timeLimitSeconds || 10}
              onPunchDigit={handlePunchDigit}
              onToggleMinus={handleToggleMinus}
              onClear={handleClear}
              onSubmitAnswer={handleSubmitAnswer}
              flashStatus={flashStatus}
              interactive={!isShowingSequence}
            />
          </div>
        </div>
      )}
    </div>
  );
};
