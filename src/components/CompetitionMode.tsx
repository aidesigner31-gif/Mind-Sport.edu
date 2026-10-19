import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { StartCountdown } from './StartCountdown';
import { FlashCardToken, Question, AdminSettings } from '../types';
import { soundEngine } from '../utils/audio';
import { fetchQuestionsForLevel, formatPromptSequenceText } from '../utils/questionsBank';
import {
  ArrowLeft,
  Trophy,
  Medal,
  Flame,
  Timer,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Users,
  Bot,
  Sparkles,
  Zap,
  CornerDownLeft,
  Delete,
  Award
} from 'lucide-react';
import { getActiveSpeedInfo, DEFAULT_ADMIN_SETTINGS } from '../utils/adminSettings';

interface CompetitionModeProps {
  onBackToMenu: () => void;
  adminSettings?: AdminSettings;
}

interface RoundHistory {
  round: number;
  questionText: string;
  correctAnswer: string;
  p1Answer: string;
  p1Correct: boolean;
  p1TimeSec: number;
  p2Answer: string;
  p2Correct: boolean;
  p2TimeSec: number;
}

// Fixed scattered coordinates for the 10 digit circles (0-9) as shown in the video whiteboard:
// Notice: Organic/scattered non-grid positions, identical on left and right contestants' sides
interface ButtonPos {
  digit: number;
  top: string;
  left: string;
}

const SCATTERED_DIGIT_LAYOUT: ButtonPos[] = [
  { digit: 6, top: '14%', left: '26%' },
  { digit: 7, top: '14%', left: '74%' },
  { digit: 5, top: '35%', left: '18%' },
  { digit: 9, top: '35%', left: '72%' },
  { digit: 0, top: '56%', left: '16%' },
  { digit: 4, top: '55%', left: '46%' },
  { digit: 3, top: '56%', left: '78%' },
  { digit: 8, top: '78%', left: '18%' },
  { digit: 1, top: '78%', left: '46%' },
  { digit: 2, top: '78%', left: '78%' },
];

export const CompetitionMode: React.FC<CompetitionModeProps> = ({ onBackToMenu, adminSettings }) => {
  const activeAdminSettings = adminSettings || DEFAULT_ADMIN_SETTINGS;
  const speedInfo = React.useMemo(() => getActiveSpeedInfo(activeAdminSettings), [activeAdminSettings]);
  const flashMs = speedInfo.effectiveFlashMs;
  const qTimeLimit = speedInfo.timeLimitSec;

  // Match configuration state
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isCountdownActive, setIsCountdownActive] = useState<boolean>(false);
  const [isMatchOver, setIsMatchOver] = useState<boolean>(false);

  // Play mode: 'two-students' or 'vs-bot'
  const [playMode, setPlayMode] = useState<'two-students' | 'vs-bot'>('two-students');
  const [p1Name, setP1Name] = useState<string>('المتسابق 1');
  const [p2Name, setP2Name] = useState<string>('المتسابق 2');
  const [totalRounds, setTotalRounds] = useState<number>(5);
  const [selectedLevel, setSelectedLevel] = useState<number>(activeAdminSettings.targetLevel ?? 1);
  const [isComplex, setIsComplex] = useState<boolean>(activeAdminSettings.isComplexMode ?? false);

  // Match Questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [activeToken, setActiveToken] = useState<FlashCardToken | null>(null);
  const [isShowingSeq, setIsShowingSeq] = useState<boolean>(false);
  const [roundRevealed, setRoundRevealed] = useState<boolean>(false);
  const [roundTimeRemaining, setRoundTimeRemaining] = useState<number>(qTimeLimit);
  const [totalElapsedTime, setTotalElapsedTime] = useState<number>(0);

  // Player 1 state (Cyan)
  const [p1Digits, setP1Digits] = useState<string>('');
  const [p1Score, setP1Score] = useState<number>(0);
  const [p1CorrectCount, setP1CorrectCount] = useState<number>(0);
  const [p1WrongCount, setP1WrongCount] = useState<number>(0);
  const [p1Combo, setP1Combo] = useState<number>(0);
  const [p1Submitted, setP1Submitted] = useState<boolean>(false);
  const [p1LastResult, setP1LastResult] = useState<'correct' | 'wrong' | null>(null);
  const [p1TotalTime, setP1TotalTime] = useState<number>(0);

  // Player 2 state (Purple)
  const [p2Digits, setP2Digits] = useState<string>('');
  const [p2Score, setP2Score] = useState<number>(0);
  const [p2CorrectCount, setP2CorrectCount] = useState<number>(0);
  const [p2WrongCount, setP2WrongCount] = useState<number>(0);
  const [p2Combo, setP2Combo] = useState<number>(0);
  const [p2Submitted, setP2Submitted] = useState<boolean>(false);
  const [p2LastResult, setP2LastResult] = useState<'correct' | 'wrong' | null>(null);
  const [p2TotalTime, setP2TotalTime] = useState<number>(0);

  // Match history
  const [matchHistory, setMatchHistory] = useState<RoundHistory[]>([]);

  // Refs
  const seqIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const roundStartTimestampRef = useRef<number>(0);
  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Total elapsed timer
  useEffect(() => {
    if (!isLive || isCountdownActive || isMatchOver) return;
    const interval = setInterval(() => {
      setTotalElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isLive, isCountdownActive, isMatchOver]);

  // Format MM:SS
  const formatMMSS = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Start the championship match
  const startChampionship = () => {
    const qList = fetchQuestionsForLevel(selectedLevel, isComplex, totalRounds);
    setQuestions(qList);
    setCurrentRound(0);

    // Reset scores & stats
    setP1Score(0);
    setP1CorrectCount(0);
    setP1WrongCount(0);
    setP1Combo(0);
    setP1Digits('');
    setP1Submitted(false);
    setP1LastResult(null);
    setP1TotalTime(0);

    setP2Score(0);
    setP2CorrectCount(0);
    setP2WrongCount(0);
    setP2Combo(0);
    setP2Digits('');
    setP2Submitted(false);
    setP2LastResult(null);
    setP2TotalTime(0);

    setMatchHistory([]);
    setRoundRevealed(false);
    setTotalElapsedTime(0);
    setIsMatchOver(false);
    setIsLive(true);
    setIsCountdownActive(true);
  };

  // Trigger flash sequence for current question
  useEffect(() => {
    if (!isLive || isCountdownActive || isMatchOver || questions.length === 0 || currentRound >= questions.length) {
      return;
    }

    if (seqIntervalRef.current) clearInterval(seqIntervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);

    const q = questions[currentRound];
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
      startRoundAnswerPhase();
      return;
    }

    // Play first token
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
        startRoundAnswerPhase();
      }
    }, flashMs);

    return () => {
      if (seqIntervalRef.current) clearInterval(seqIntervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    };
  }, [currentRound, questions, isLive, isCountdownActive, flashMs, qTimeLimit]);

  // Answer phase timer countdown
  const startRoundAnswerPhase = () => {
    roundStartTimestampRef.current = Date.now();
    let rem = qTimeLimit;
    setRoundTimeRemaining(rem);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      rem -= 0.1;
      setRoundTimeRemaining(Math.max(0, rem));
      if (rem <= 0) {
        clearInterval(timerRef.current!);
        handleRoundTimeExpired();
      }
    }, 100);

    // If playMode is 'vs-bot', schedule simulated AI answer
    if (playMode === 'vs-bot') {
      const q = questions[currentRound];
      const botDelayMs = Math.floor(Math.random() * 1200) + 1400; // 1.4s - 2.6s realistic reaction
      botTimeoutRef.current = setTimeout(() => {
        handleBotAutoAnswer(q.answer);
      }, botDelayMs);
    }
  };

  // Bot auto answer
  const handleBotAutoAnswer = (correctAnswer: string) => {
    if (p2Submitted || roundRevealed) return;
    const shouldBeCorrect = Math.random() < 0.88; // 88% bot accuracy
    let botAns = correctAnswer;
    if (!shouldBeCorrect) {
      const wrongOffset = Math.random() < 0.5 ? 1 : -1;
      botAns = String(parseInt(correctAnswer, 10) + wrongOffset);
    }

    setP2Digits(botAns);
    processPlayerSubmission(2, botAns);
  };

  // Process submission for P1 or P2
  const processPlayerSubmission = (player: 1 | 2, answerVal: string) => {
    if (roundRevealed || !questions[currentRound]) return;
    const q = questions[currentRound];
    const isCorr = answerVal.trim() === q.answer.trim();
    const elapsed = Math.max(0.1, (Date.now() - roundStartTimestampRef.current) / 1000);

    if (player === 1) {
      if (p1Submitted) return;
      setP1Submitted(true);
      setP1TotalTime((t) => t + elapsed);
      if (isCorr) {
        const newCombo = p1Combo + 1;
        setP1Combo(newCombo);
        setP1Score((s) => s + 200 + newCombo * 25);
        setP1CorrectCount((c) => c + 1);
        setP1LastResult('correct');
        soundEngine.playCorrectSound(newCombo);
      } else {
        setP1Combo(0);
        setP1WrongCount((w) => w + 1);
        setP1LastResult('wrong');
        soundEngine.playWrongSound();
      }
    } else {
      if (p2Submitted) return;
      setP2Submitted(true);
      setP2TotalTime((t) => t + elapsed);
      if (isCorr) {
        const newCombo = p2Combo + 1;
        setP2Combo(newCombo);
        setP2Score((s) => s + 200 + newCombo * 25);
        setP2CorrectCount((c) => c + 1);
        setP2LastResult('correct');
        soundEngine.playCorrectSound(newCombo);
      } else {
        setP2Combo(0);
        setP2WrongCount((w) => w + 1);
        setP2LastResult('wrong');
        soundEngine.playWrongSound();
      }
    }

    // Check if both submitted
    const p1SubAfter = player === 1 ? true : p1Submitted;
    const p2SubAfter = player === 2 ? true : p2Submitted;

    if (p1SubAfter && p2SubAfter) {
      concludeRound();
    }
  };

  // Round time expired
  const handleRoundTimeExpired = () => {
    if (roundRevealed) return;
    if (!p1Submitted) {
      setP1Submitted(true);
      setP1WrongCount((w) => w + 1);
      setP1Combo(0);
      setP1LastResult('wrong');
    }
    if (!p2Submitted) {
      setP2Submitted(true);
      setP2WrongCount((w) => w + 1);
      setP2Combo(0);
      setP2LastResult('wrong');
    }
    soundEngine.playWrongSound();
    concludeRound();
  };

  // Conclude the round and reveal answer
  const concludeRound = () => {
    setRoundRevealed(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);

    const q = questions[currentRound];
    const historyItem: RoundHistory = {
      round: currentRound + 1,
      questionText: formatPromptSequenceText(q.promptSeq),
      correctAnswer: q.answer,
      p1Answer: p1Digits || 'لم يجب',
      p1Correct: p1Digits.trim() === q.answer.trim(),
      p1TimeSec: Math.max(0.1, (Date.now() - roundStartTimestampRef.current) / 1000),
      p2Answer: p2Digits || 'لم يجب',
      p2Correct: p2Digits.trim() === q.answer.trim(),
      p2TimeSec: Math.max(0.1, (Date.now() - roundStartTimestampRef.current) / 1000),
    };

    setMatchHistory((prev) => [...prev, historyItem]);

    // Advance to next round or end championship
    setTimeout(() => {
      if (currentRound + 1 < questions.length) {
        setCurrentRound((prev) => prev + 1);
      } else {
        // Championship Finish!
        setIsMatchOver(true);
        setIsLive(false);
        soundEngine.playVictorySound();
        confetti({
          particleCount: 180,
          spread: 100,
          origin: { y: 0.45 },
        });
      }
    }, 1600);
  };

  // Player 1 Punch Digit
  const handleP1Digit = (digit: number) => {
    if (!isLive || isShowingSeq || p1Submitted || isMatchOver) return;
    soundEngine.playPunchImpact(0.9);
    const newBuf = p1Digits + String(digit);
    setP1Digits(newBuf);

    // Auto-submit if buffer matches expected answer length
    const expectedLen = questions[currentRound]?.answer?.length || 1;
    if (newBuf.length >= expectedLen) {
      processPlayerSubmission(1, newBuf);
    }
  };

  const handleP1Clear = () => {
    if (!isLive || isShowingSeq || p1Submitted || isMatchOver) return;
    soundEngine.playPunchImpact(0.5);
    setP1Digits('');
  };

  const handleP1Backspace = () => {
    if (!isLive || isShowingSeq || p1Submitted || isMatchOver) return;
    soundEngine.playPunchImpact(0.5);
    setP1Digits((prev) => prev.slice(0, -1));
  };

  const handleP1Submit = () => {
    if (!isLive || isShowingSeq || p1Submitted || isMatchOver || !p1Digits) return;
    processPlayerSubmission(1, p1Digits);
  };

  // Player 2 Punch Digit
  const handleP2Digit = (digit: number) => {
    if (!isLive || isShowingSeq || p2Submitted || isMatchOver || playMode === 'vs-bot') return;
    soundEngine.playPunchImpact(0.9);
    const newBuf = p2Digits + String(digit);
    setP2Digits(newBuf);

    const expectedLen = questions[currentRound]?.answer?.length || 1;
    if (newBuf.length >= expectedLen) {
      processPlayerSubmission(2, newBuf);
    }
  };

  const handleP2Clear = () => {
    if (!isLive || isShowingSeq || p2Submitted || isMatchOver || playMode === 'vs-bot') return;
    soundEngine.playPunchImpact(0.5);
    setP2Digits('');
  };

  const handleP2Backspace = () => {
    if (!isLive || isShowingSeq || p2Submitted || isMatchOver || playMode === 'vs-bot') return;
    soundEngine.playPunchImpact(0.5);
    setP2Digits((prev) => prev.slice(0, -1));
  };

  const handleP2Submit = () => {
    if (!isLive || isShowingSeq || p2Submitted || isMatchOver || !p2Digits || playMode === 'vs-bot') return;
    processPlayerSubmission(2, p2Digits);
  };

  // Determine winner for trophy display
  const p1Wins = p1Score > p2Score || (p1Score === p2Score && p1CorrectCount > p2CorrectCount);
  const p2Wins = p2Score > p1Score || (p1Score === p2Score && p2CorrectCount > p1CorrectCount);
  const isTie = p1Score === p2Score && p1CorrectCount === p2CorrectCount;

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between p-2 sm:p-4 md:p-6 select-none bg-[#070a14] text-white overflow-hidden">
      {/* Background Arena Lights */}
      <div className="fixed -top-40 left-1/4 w-[450px] h-[450px] bg-cyan-600/10 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="fixed -bottom-40 right-1/4 w-[450px] h-[450px] bg-purple-600/10 blur-[140px] rounded-full pointer-events-none z-0" />

      {/* Top Header Navigation HUD */}
      <header className="relative z-20 w-full flex items-center justify-between pb-3 border-b border-white/10">
        <button
          onClick={onBackToMenu}
          className="px-3 sm:px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 hover:text-white flex items-center gap-2 text-xs font-bold uppercase transition-all shadow cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-pink-400" />
          <span className="hidden sm:inline">القائمة الرئيسية / Menu</span>
        </button>

        {/* Brand Title */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-widest">
            <Trophy className="w-3.5 h-3.5" />
            <span>MIND SPORT ARENA • شاشة المسابقة الرسمية</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-amber-300 to-purple-400">
            بطولة تحدي الحساب الذهني
          </h1>
        </div>

        {/* Speed Indicator Badge */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-2 shadow">
            <span>{speedInfo.icon}</span>
            <span className="hidden md:inline font-bold">السرعة: {speedInfo.displayNameAr}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-200">
              {speedInfo.effectiveFlashMs}ms
            </span>
          </div>
        </div>
      </header>

      {/* ========================================================
          1. PRE-MATCH SETUP SCREEN
          ======================================================== */}
      {!isLive && !isMatchOver ? (
        <div className="relative z-10 my-auto w-full max-w-3xl mx-auto bg-slate-950/80 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.8)] text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-300 border border-amber-400/40 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(245,158,11,0.3)]">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="text-[10px] font-bold tracking-[0.3em] text-amber-400 uppercase mb-1">
            Official Classroom Arena
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">إعداد مسابقة التحدي الثنائية</h2>
          <p className="text-xs text-slate-300 max-w-lg mb-6 leading-relaxed">
            واجهة المسابقة الموحدة للسبورات الذكية والشاشات: تظهر أرقام السؤال في الدائرة الكبرى في المنتصف، ويتنافس
            اللاعبان على النقر السريع على الأرقام المبعثرة المتطابقة للفوز بكأس البطولة!
          </p>

          {/* Mode Selector (2 Students vs AI Bot) */}
          <div className="w-full grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => {
                soundEngine.playTargetActivate();
                setPlayMode('two-students');
              }}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-center gap-2.5 font-bold text-xs sm:text-sm cursor-pointer ${
                playMode === 'two-students'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-[1.02]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              <Users className="w-5 h-5 text-cyan-400" />
              <span>طالب ضد طالب (شاشة واحدة)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playTargetActivate();
                setPlayMode('vs-bot');
              }}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-center gap-2.5 font-bold text-xs sm:text-sm cursor-pointer ${
                playMode === 'vs-bot'
                  ? 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.3)] scale-[1.02]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              <Bot className="w-5 h-5 text-purple-400" />
              <span>تحدي ضد الروبوت (طالب واحد)</span>
            </button>
          </div>

          {/* Contestants Names Inputs */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="text-right p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30">
              <label className="text-[11px] font-bold text-cyan-300 block mb-1.5 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                اسم المتسابق الأول (الجهة اليسرى)
              </label>
              <input
                type="text"
                value={p1Name}
                onChange={(e) => setP1Name(e.target.value)}
                placeholder="المتسابق 1"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-400/40 text-cyan-200 text-sm font-bold text-right focus:outline-none focus:border-cyan-300"
              />
            </div>

            <div className="text-right p-3 rounded-2xl bg-purple-950/30 border border-purple-500/30">
              <label className="text-[11px] font-bold text-purple-300 block mb-1.5 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                {playMode === 'vs-bot' ? 'المنافس الآلي (الروبوت)' : 'اسم المتسابق الثاني (الجهة اليمنى)'}
              </label>
              <input
                type="text"
                value={playMode === 'vs-bot' ? 'روبوت الحساب السريع ⚡' : p2Name}
                onChange={(e) => setP2Name(e.target.value)}
                disabled={playMode === 'vs-bot'}
                placeholder="المتسابق 2"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-purple-400/40 text-purple-200 text-sm font-bold text-right focus:outline-none focus:border-purple-300 disabled:opacity-70"
              />
            </div>
          </div>

          {/* Rounds & Level Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Rounds Selector */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-right">
              <label className="text-[11px] font-bold text-slate-300 block mb-2">عدد الجولات في المسابقة:</label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 7, 10].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTotalRounds(r)}
                    className={`py-2 rounded-xl font-bold text-xs transition-all ${
                      totalRounds === r
                        ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)] font-black'
                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {r} جولات
                  </button>
                ))}
              </div>
            </div>

            {/* Level Selector */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-right">
              <label className="text-[11px] font-bold text-slate-300 block mb-2">مستوى الصعوبة:</label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setSelectedLevel(l)}
                    className={`py-2 rounded-xl font-bold text-xs transition-all ${
                      selectedLevel === l
                        ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] font-black'
                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {l === 0 ? 'تمهيدي (0)' : `مستوى ${l}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Speed Status Alert */}
          <div className="w-full mb-6 p-3 rounded-2xl bg-slate-900 border border-emerald-500/30 flex items-center justify-between text-right text-xs">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>سرعة المسابقة موحدة تلقائياً من الأدمن: {speedInfo.displayNameAr} ({speedInfo.effectiveFlashMs}ms)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              وقت الإجابة: {speedInfo.timeLimitSec} ثوانٍ
            </span>
          </div>

          {/* Start Championship Button */}
          <button
            onClick={startChampionship}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-110 text-slate-950 font-black text-base uppercase tracking-wider shadow-[0_0_35px_rgba(245,158,11,0.5)] transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-slate-950" />
            <span>بدء المسابقة الآن • START CHAMPIONSHIP</span>
          </button>
        </div>
      ) : isMatchOver ? (
        /* ========================================================
            3. MATCH RESULTS & TROPHY CELEBRATION
           ======================================================== */
        <div className="relative z-10 w-full flex-1 flex flex-col justify-between max-w-7xl mx-auto py-2">
          {/* Main Winner Stage */}
          <div className="relative w-full flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch my-auto">
            {/* LEFT PLAYER RESULTS CARD */}
            <div
              className={`relative rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-between text-center transition-all backdrop-blur-xl border ${
                p1Wins
                  ? 'bg-gradient-to-b from-cyan-950/80 via-slate-900/95 to-slate-950 border-cyan-400 shadow-[0_0_60px_rgba(6,182,212,0.4)] scale-[1.02]'
                  : 'bg-slate-950/60 border-white/10 opacity-80'
              }`}
            >
              {p1Wins && (
                <div className="absolute -top-4 px-4 py-1.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.6)] flex items-center gap-1.5 animate-bounce">
                  <Trophy className="w-4 h-4 fill-slate-950" />
                  <span>بطل المسابقة • CHAMPION!</span>
                </div>
              )}

              {/* Contestant Header */}
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-1">
                  المتسابق الأول
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white">{p1Name}</h3>
              </div>

              {/* The Grand Winner Trophy (Shows on the Winner's Half as in the Video!) */}
              <div className="my-6 flex flex-col items-center justify-center">
                {p1Wins ? (
                  <div className="relative group">
                    <div className="absolute inset-0 bg-amber-400/25 blur-3xl rounded-full animate-pulse" />
                    <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 p-1 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.6)]">
                      <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center">
                        <Trophy className="w-20 h-20 sm:w-24 sm:h-24 text-amber-300 drop-shadow-[0_0_20px_rgba(245,158,11,0.8)] animate-pulse" />
                        <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest mt-1">
                          الكأس الذهبي
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                    <Medal className="w-12 h-12 text-slate-400" />
                  </div>
                )}
              </div>

              {/* Stats Breakdown */}
              <div className="w-full space-y-2 bg-slate-900/80 rounded-2xl p-4 border border-white/10">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">مجموع النقاط:</span>
                  <span className="text-xl font-black text-cyan-300">{p1Score} PTS</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">الإجابات الصحيحة:</span>
                  <span className="text-sm font-bold text-emerald-400">{p1CorrectCount} / {totalRounds}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">الإجابات الخاطئة:</span>
                  <span className="text-sm font-bold text-rose-400">{p1WrongCount}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">معدل الدقة:</span>
                  <span className="text-sm font-bold text-amber-300">
                    {totalRounds > 0 ? Math.round((p1CorrectCount / totalRounds) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT PLAYER RESULTS CARD */}
            <div
              className={`relative rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-between text-center transition-all backdrop-blur-xl border ${
                p2Wins
                  ? 'bg-gradient-to-b from-purple-950/80 via-slate-900/95 to-slate-950 border-purple-400 shadow-[0_0_60px_rgba(168,85,247,0.4)] scale-[1.02]'
                  : 'bg-slate-950/60 border-white/10 opacity-80'
              }`}
            >
              {p2Wins && (
                <div className="absolute -top-4 px-4 py-1.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.6)] flex items-center gap-1.5 animate-bounce">
                  <Trophy className="w-4 h-4 fill-slate-950" />
                  <span>بطل المسابقة • CHAMPION!</span>
                </div>
              )}

              {/* Contestant Header */}
              <div>
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block mb-1">
                  {playMode === 'vs-bot' ? 'المنافس الآلي' : 'المتسابق الثاني'}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white">{p2Name}</h3>
              </div>

              {/* The Grand Winner Trophy (Shows on the Winner's Half as in the Video!) */}
              <div className="my-6 flex flex-col items-center justify-center">
                {p2Wins ? (
                  <div className="relative group">
                    <div className="absolute inset-0 bg-amber-400/25 blur-3xl rounded-full animate-pulse" />
                    <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 p-1 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.6)]">
                      <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center">
                        <Trophy className="w-20 h-20 sm:w-24 sm:h-24 text-amber-300 drop-shadow-[0_0_20px_rgba(245,158,11,0.8)] animate-pulse" />
                        <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest mt-1">
                          الكأس الذهبي
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                    <Medal className="w-12 h-12 text-slate-400" />
                  </div>
                )}
              </div>

              {/* Stats Breakdown */}
              <div className="w-full space-y-2 bg-slate-900/80 rounded-2xl p-4 border border-white/10">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">مجموع النقاط:</span>
                  <span className="text-xl font-black text-purple-300">{p2Score} PTS</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">الإجابات الصحيحة:</span>
                  <span className="text-sm font-bold text-emerald-400">{p2CorrectCount} / {totalRounds}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">الإجابات الخاطئة:</span>
                  <span className="text-sm font-bold text-rose-400">{p2WrongCount}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">معدل الدقة:</span>
                  <span className="text-sm font-bold text-amber-300">
                    {totalRounds > 0 ? Math.round((p2CorrectCount / totalRounds) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={startChampionship}
              className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4 fill-slate-950" />
              <span>جولة جديدة / Rematch</span>
            </button>

            <button
              onClick={onBackToMenu}
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm transition-all cursor-pointer active:scale-95"
            >
              العودة للقائمة الرئيسية
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================
            2. THE ACTIVE COMPETITION ARENA (THE VIDEO WHITEBOARD!)
           ======================================================== */
        <div className="relative z-10 w-full flex-1 flex flex-col justify-between my-auto py-1">
          {/* Central Match HUD Info */}
          <div className="w-full bg-slate-950/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center justify-between text-xs mb-2 shadow">
            <div className="flex items-center gap-2 text-cyan-300">
              <span className="text-slate-400 font-bold uppercase text-[10px]">الجولة:</span>
              <span className="font-mono font-black text-sm text-white">
                {currentRound + 1} / {questions.length}
              </span>
              {questions[currentRound]?.displayTitle && (
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  ({questions[currentRound].displayTitle})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
              <Timer className="w-3.5 h-3.5 text-amber-400" />
              <span>الوقت المستغرق: {formatMMSS(totalElapsedTime)}</span>
            </div>

            <div className="flex items-center gap-2 text-purple-300 font-bold text-[10px]">
              <span className="text-slate-400 uppercase">السرعة الموحدة:</span>
              <span className="text-white font-mono bg-purple-500/20 px-2 py-0.5 rounded border border-purple-400/30">
                {speedInfo.displayNameAr} ({flashMs}ms)
              </span>
            </div>
          </div>

          {/* THE WHITEBOARD COMPETITION SURFACE (Splits in 2 with Central Question Cell) */}
          <div className="relative w-full flex-1 min-h-[500px] sm:min-h-[560px] md:min-h-[620px] rounded-3xl bg-gradient-to-b from-[#0b1022] via-[#090d1c] to-[#060914] border-2 border-slate-700/60 shadow-[0_0_50px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col">
            {/* Whiteboard Perimeter Frame (like the red marker frame in the video) */}
            <div className="absolute inset-0 border-4 border-rose-500/20 rounded-3xl pointer-events-none z-10" />

            {/* Central Dividing Line (as drawn by the teacher in the video) */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1.5 bg-gradient-to-b from-cyan-500/30 via-slate-600/60 to-purple-500/30 z-0 pointer-events-none" />

            {/* ⭐ THE BIG CENTRAL QUESTION CIRCLE / CELL (دائرة السؤال الكبرى في المنتصف) ⭐ */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center justify-center">
              {/* Outer Glowing Ring */}
              <div
                className={`relative w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-full flex flex-col items-center justify-center p-2 transition-all duration-300 shadow-[0_0_60px_rgba(0,0,0,0.9)] ${
                  isShowingSeq
                    ? 'bg-gradient-to-tr from-cyan-900/90 via-slate-900/95 to-purple-900/90 border-4 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.5)] scale-105'
                    : roundRevealed
                    ? 'bg-gradient-to-tr from-emerald-950 via-slate-900 to-emerald-900 border-4 border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.5)]'
                    : 'bg-slate-950/90 border-4 border-cyan-400/80 shadow-[0_0_40px_rgba(6,182,212,0.3)]'
                }`}
              >
                {/* Secondary inner ring */}
                <div className="w-full h-full rounded-full border border-dashed border-white/20 flex flex-col items-center justify-center relative overflow-hidden bg-radial from-slate-800/40 to-slate-950">
                  {/* Flashing content */}
                  {isShowingSeq ? (
                    <div className="flex flex-col items-center justify-center animate-pulse">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-0.5">
                        انتبه للرقم!
                      </span>
                      <span className="text-4xl sm:text-5xl md:text-6xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]">
                        {activeToken ? (
                          activeToken.value.startsWith('-')
                            ? activeToken.value
                            : `+${activeToken.value}`
                        ) : (
                          '...'
                        )}
                      </span>
                    </div>
                  ) : roundRevealed ? (
                    <div className="flex flex-col items-center justify-center animate-bounce">
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-0.5">
                        الإجابة الصحيحة
                      </span>
                      <span className="text-3xl sm:text-4xl md:text-5xl font-black font-mono text-emerald-300 drop-shadow-[0_0_20px_rgba(16,185,129,0.9)]">
                        = {questions[currentRound]?.answer}
                      </span>
                    </div>
                  ) : (
                    /* Answer Phase / Countdown */
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                        احسب وانقر!
                      </span>
                      <span className="text-3xl sm:text-4xl font-black font-mono text-white">
                        {roundTimeRemaining.toFixed(1)}s
                      </span>
                      <div className="w-20 sm:w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-100"
                          style={{ width: `${(roundTimeRemaining / qTimeLimit) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Central Title Tag */}
              <div className="mt-1 px-3 py-0.5 rounded-full bg-slate-900/90 border border-white/15 text-[9px] font-bold text-slate-300 shadow">
                {isShowingSeq ? 'جارٍ وميض السؤال' : roundRevealed ? 'نتيجة الجولة' : 'وقت الإجابة السريعة'}
              </div>
            </div>

            {/* Split Screen Container (Left Player Half vs Right Player Half) */}
            <div className="relative w-full flex-1 grid grid-cols-2 z-10">
              {/* ========================================================
                  LEFT HALF: PLAYER 1 (Cyan / Electric Neon)
                 ======================================================== */}
              <div className="relative h-full flex flex-col justify-between p-3 sm:p-5 border-r border-white/5">
                {/* P1 Top Stats Header */}
                <div className="w-full flex items-center justify-between bg-slate-950/70 backdrop-blur-md border border-cyan-500/30 rounded-2xl px-3 py-2 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-pulse" />
                    <div>
                      <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                        المتسابق الأول
                      </div>
                      <div className="text-xs sm:text-sm font-black text-white">{p1Name}</div>
                    </div>
                  </div>

                  {/* P1 Live Input & Score */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[9px] text-slate-400 font-bold uppercase">المدخل:</div>
                      <div className="text-sm sm:text-base font-black font-mono text-cyan-300 min-w-[32px] text-center bg-cyan-950/60 border border-cyan-400/40 px-2 rounded-lg">
                        {p1Digits || '—'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-slate-400 font-bold uppercase">النقاط:</div>
                      <div className="text-sm sm:text-base font-black text-white">{p1Score}</div>
                    </div>
                  </div>
                </div>

                {/* P1 Organic Scattered Number Circles (0-9) as in Video! */}
                <div className="relative flex-1 w-full my-2 min-h-[340px] sm:min-h-[400px]">
                  {SCATTERED_DIGIT_LAYOUT.map((item) => (
                    <button
                      key={`p1_${item.digit}`}
                      onClick={() => handleP1Digit(item.digit)}
                      disabled={isShowingSeq || p1Submitted || isMatchOver}
                      style={{
                        top: item.top,
                        left: item.left,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className={`absolute w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full font-black text-2xl sm:text-3xl md:text-4xl transition-all duration-150 flex items-center justify-center cursor-pointer select-none active:scale-90 ${
                        isShowingSeq || p1Submitted
                          ? 'bg-slate-900/60 border-2 border-slate-700/60 text-slate-500 opacity-60 cursor-not-allowed'
                          : 'bg-gradient-to-b from-cyan-950 via-slate-900 to-slate-950 border-3 border-cyan-400 text-cyan-300 hover:text-white hover:border-cyan-300 hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      }`}
                    >
                      {item.digit}
                    </button>
                  ))}

                  {/* Result Overlay on P1 side upon round end */}
                  {p1Submitted && (
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-white/20 text-xs font-bold">
                      {p1LastResult === 'correct' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-300">أحسنت! صحيح</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-400" />
                          <span className="text-rose-300">إجابة خاطئة</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* P1 Bottom Utility Buttons (Clear / Backspace / Submit) */}
                <div className="w-full flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={handleP1Clear}
                    disabled={isShowingSeq || p1Submitted || isMatchOver || !p1Digits}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 text-[11px] font-bold flex items-center gap-1 transition-all disabled:opacity-40"
                  >
                    <Delete className="w-3.5 h-3.5" />
                    <span>مسح</span>
                  </button>

                  <button
                    onClick={handleP1Backspace}
                    disabled={isShowingSeq || p1Submitted || isMatchOver || !p1Digits}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 text-[11px] font-bold flex items-center gap-1 transition-all disabled:opacity-40"
                  >
                    <span>⌫ تراجع</span>
                  </button>

                  <button
                    onClick={handleP1Submit}
                    disabled={isShowingSeq || p1Submitted || isMatchOver || !p1Digits}
                    className="flex-1 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all disabled:opacity-40 active:scale-95"
                  >
                    <CornerDownLeft className="w-3.5 h-3.5" />
                    <span>تأكيد الإجابة</span>
                  </button>
                </div>
              </div>

              {/* ========================================================
                  RIGHT HALF: PLAYER 2 (Fuchsia / Laser Purple)
                  (Exact Same Scattered Distribution As Left Player!)
                 ======================================================== */}
              <div className="relative h-full flex flex-col justify-between p-3 sm:p-5 border-l border-white/5">
                {/* P2 Top Stats Header */}
                <div className="w-full flex items-center justify-between bg-slate-950/70 backdrop-blur-md border border-purple-500/30 rounded-2xl px-3 py-2 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)] animate-pulse" />
                    <div>
                      <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                        {playMode === 'vs-bot' ? 'المنافس الآلي' : 'المتسابق الثاني'}
                      </div>
                      <div className="text-xs sm:text-sm font-black text-white">{p2Name}</div>
                    </div>
                  </div>

                  {/* P2 Live Input & Score */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[9px] text-slate-400 font-bold uppercase">المدخل:</div>
                      <div className="text-sm sm:text-base font-black font-mono text-purple-300 min-w-[32px] text-center bg-purple-950/60 border border-purple-400/40 px-2 rounded-lg">
                        {p2Digits || '—'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-slate-400 font-bold uppercase">النقاط:</div>
                      <div className="text-sm sm:text-base font-black text-white">{p2Score}</div>
                    </div>
                  </div>
                </div>

                {/* P2 Organic Scattered Number Circles (0-9) - Identical Layout to Left Side! */}
                <div className="relative flex-1 w-full my-2 min-h-[340px] sm:min-h-[400px]">
                  {SCATTERED_DIGIT_LAYOUT.map((item) => (
                    <button
                      key={`p2_${item.digit}`}
                      onClick={() => handleP2Digit(item.digit)}
                      disabled={isShowingSeq || p2Submitted || isMatchOver || playMode === 'vs-bot'}
                      style={{
                        top: item.top,
                        left: item.left,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className={`absolute w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full font-black text-2xl sm:text-3xl md:text-4xl transition-all duration-150 flex items-center justify-center cursor-pointer select-none active:scale-90 ${
                        isShowingSeq || p2Submitted || playMode === 'vs-bot'
                          ? 'bg-slate-900/60 border-2 border-slate-700/60 text-slate-500 opacity-60 cursor-not-allowed'
                          : 'bg-gradient-to-b from-purple-950 via-slate-900 to-slate-950 border-3 border-purple-400 text-purple-300 hover:text-white hover:border-purple-300 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                      }`}
                    >
                      {item.digit}
                    </button>
                  ))}

                  {/* Result Overlay on P2 side upon round end */}
                  {p2Submitted && (
                    <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-white/20 text-xs font-bold">
                      {p2LastResult === 'correct' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-300">أحسنت! صحيح</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-400" />
                          <span className="text-rose-300">إجابة خاطئة</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* P2 Bottom Utility Buttons (Clear / Backspace / Submit) */}
                <div className="w-full flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={handleP2Clear}
                    disabled={isShowingSeq || p2Submitted || isMatchOver || !p2Digits || playMode === 'vs-bot'}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 text-[11px] font-bold flex items-center gap-1 transition-all disabled:opacity-40"
                  >
                    <Delete className="w-3.5 h-3.5" />
                    <span>مسح</span>
                  </button>

                  <button
                    onClick={handleP2Backspace}
                    disabled={isShowingSeq || p2Submitted || isMatchOver || !p2Digits || playMode === 'vs-bot'}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 text-[11px] font-bold flex items-center gap-1 transition-all disabled:opacity-40"
                  >
                    <span>⌫ تراجع</span>
                  </button>

                  <button
                    onClick={handleP2Submit}
                    disabled={isShowingSeq || p2Submitted || isMatchOver || !p2Digits || playMode === 'vs-bot'}
                    className="flex-1 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all disabled:opacity-40 active:scale-95"
                  >
                    <CornerDownLeft className="w-3.5 h-3.5" />
                    <span>تأكيد الإجابة</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3-2-1 Mental Math Countdown Overlay */}
      {isCountdownActive && (
        <StartCountdown
          title={`مسابقة التحدي الثنائية - ${p1Name} ضد ${p2Name}`}
          onComplete={() => setIsCountdownActive(false)}
        />
      )}
    </div>
  );
};
