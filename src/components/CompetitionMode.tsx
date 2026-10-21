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

// Dedicated scattered coordinates for Player 1 (Left Half) and Player 2 (Right Half)
// Calibrated with ample clearance around the central question cell so NO number is ever covered or obscured
interface ButtonPos {
  digit: number;
  top: string;
  left: string;
}

// Dedicated scattered coordinates for Player 1 (Left Half) and Player 2 (Right Half)
// Calibrated with wide clearance (>60% center channel) so the enlarged central question circle never touches any number
export const P1_SCATTERED_LAYOUT: ButtonPos[] = [
  { digit: 6, top: '9%', left: '22%' },  // Top-left (far above circle)
  { digit: 7, top: '9%', left: '74%' },  // Top-right (above circle)
  { digit: 5, top: '29%', left: '15%' }, // Mid-upper-left
  { digit: 9, top: '29%', left: '38%' }, // Mid-upper-center (left <= 38%, well clear of center)
  { digit: 0, top: '50%', left: '13%' }, // Mid-left
  { digit: 4, top: '50%', left: '36%' }, // Mid-center (left <= 36%, well clear of center)
  { digit: 3, top: '71%', left: '20%' }, // Mid-lower-left
  { digit: 8, top: '90%', left: '15%' }, // Bottom-left
  { digit: 1, top: '90%', left: '42%' }, // Bottom-center
  { digit: 2, top: '90%', left: '74%' }, // Bottom-right (below circle)
];

// Player 2 (Right Half): Symmetrically mirrored so Player 2 has identical distance & fairness with zero overlap
export const P2_SCATTERED_LAYOUT: ButtonPos[] = [
  { digit: 6, top: '9%', left: '78%' },  // Top-right (far above circle)
  { digit: 7, top: '9%', left: '26%' },  // Top-left (above circle)
  { digit: 5, top: '29%', left: '85%' }, // Mid-upper-right
  { digit: 9, top: '29%', left: '62%' }, // Mid-upper-center (left >= 62%, well clear of center)
  { digit: 0, top: '50%', left: '87%' }, // Mid-right
  { digit: 4, top: '50%', left: '64%' }, // Mid-center (left >= 64%, well clear of center)
  { digit: 3, top: '71%', left: '80%' }, // Mid-lower-right
  { digit: 8, top: '90%', left: '85%' }, // Bottom-right
  { digit: 1, top: '90%', left: '58%' }, // Bottom-center
  { digit: 2, top: '90%', left: '26%' }, // Bottom-left (below circle)
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

  // Play mode: 'two-students' or 'vs-bot' (Defaults to vs-bot for instant solo play against AI)
  const [playMode, setPlayMode] = useState<'two-students' | 'vs-bot'>('vs-bot');
  const [p1Name, setP1Name] = useState<string>('المتسابق 1');
  const [p2Name, setP2Name] = useState<string>('روبوت الحساب السريع 🤖');
  const [isBotThinking, setIsBotThinking] = useState<boolean>(false);
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

  // Refs for rock-solid closure safety and timer synchronization
  const seqIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const roundStartTimestampRef = useRef<number>(0);
  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const advanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronous state refs to prevent stale closures and freezing
  const playModeRef = useRef<'two-students' | 'vs-bot'>('vs-bot');
  const p1SubmittedRef = useRef<boolean>(false);
  const p2SubmittedRef = useRef<boolean>(false);
  const roundRevealedRef = useRef<boolean>(false);
  const currentRoundRef = useRef<number>(0);
  const questionsRef = useRef<Question[]>([]);
  const p1DigitsRef = useRef<string>('');
  const p2DigitsRef = useRef<string>('');

  useEffect(() => {
    playModeRef.current = playMode;
  }, [playMode]);

  useEffect(() => {
    currentRoundRef.current = currentRound;
  }, [currentRound]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  // Total elapsed timer
  useEffect(() => {
    if (!isLive || isCountdownActive || isMatchOver) return;
    const interval = setInterval(() => {
      setTotalElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isLive, isCountdownActive, isMatchOver]);

  // Clean up all active intervals and timeouts on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (seqIntervalRef.current) clearInterval(seqIntervalRef.current);
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    };
  }, []);

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
    questionsRef.current = qList;
    currentRoundRef.current = 0;
    setCurrentRound(0);

    // Reset synchronous refs
    p1SubmittedRef.current = false;
    p2SubmittedRef.current = false;
    roundRevealedRef.current = false;
    p1DigitsRef.current = '';
    p2DigitsRef.current = '';

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

  // Advance immediately to next round or finish championship
  const advanceToNextRound = () => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    const totalQ = questionsRef.current.length > 0 ? questionsRef.current.length : questions.length;
    const nextIdx = currentRoundRef.current + 1;

    if (nextIdx < totalQ) {
      startNewRound(nextIdx);
    } else {
      // Championship Finish!
      setIsMatchOver(true);
      setIsLive(false);
      try {
        soundEngine.playVictorySound();
        confetti({
          particleCount: 180,
          spread: 100,
          origin: { y: 0.45 },
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Dedicated deterministic round starter (immune to closure bugs & skipped rounds)
  const startNewRound = (roundIdx: number) => {
    // 1. Clear any pending timers
    if (seqIntervalRef.current) {
      clearInterval(seqIntervalRef.current);
      seqIntervalRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current);
      botTimeoutRef.current = null;
    }
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }

    // 2. Synchronously reset ALL round state refs
    currentRoundRef.current = roundIdx;
    p1SubmittedRef.current = false;
    p2SubmittedRef.current = false;
    roundRevealedRef.current = false;
    p1DigitsRef.current = '';
    p2DigitsRef.current = '';

    // 3. Update React states
    setCurrentRound(roundIdx);
    setP1Digits('');
    setP2Digits('');
    setP1Submitted(false);
    setP2Submitted(false);
    setP1LastResult(null);
    setP2LastResult(null);
    setRoundRevealed(false);
    setIsBotThinking(false);
    setRoundTimeRemaining(qTimeLimit);

    // 4. Validate question data
    const qList = questionsRef.current.length > 0 ? questionsRef.current : questions;
    const q = qList[roundIdx];
    if (!q) {
      setIsMatchOver(true);
      setIsLive(false);
      return;
    }

    if (!q.promptSeq || q.promptSeq.length === 0) {
      setActiveToken(null);
      setIsShowingSeq(false);
      startRoundAnswerPhase();
      return;
    }

    // 5. Play flash sequence
    setIsShowingSeq(true);
    setActiveToken(q.promptSeq[0]);
    try {
      soundEngine.playTargetActivate();
    } catch (e) {
      console.error(e);
    }
    let idx = 1;

    seqIntervalRef.current = setInterval(() => {
      if (idx < q.promptSeq.length) {
        setActiveToken(q.promptSeq[idx]);
        try {
          soundEngine.playTargetActivate();
        } catch (e) {
          console.error(e);
        }
        idx++;
      } else {
        setActiveToken(null);
        setIsShowingSeq(false);
        if (seqIntervalRef.current) {
          clearInterval(seqIntervalRef.current);
          seqIntervalRef.current = null;
        }
        startRoundAnswerPhase();
      }
    }, flashMs);
  };

  // Answer phase timer countdown
  const startRoundAnswerPhase = () => {
    roundStartTimestampRef.current = Date.now();
    let rem = qTimeLimit;
    setRoundTimeRemaining(rem);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current);
      botTimeoutRef.current = null;
    }
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }

    timerRef.current = setInterval(() => {
      rem = Math.max(0, Number((rem - 0.1).toFixed(1)));
      setRoundTimeRemaining(rem);
      if (rem <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        handleRoundTimeExpired();
      }
    }, 100);

    // If playMode is 'vs-bot', schedule simulated AI answer
    if (playModeRef.current === 'vs-bot') {
      const currRoundIdx = currentRoundRef.current;
      const qList = questionsRef.current.length > 0 ? questionsRef.current : questions;
      const currQ = qList[currRoundIdx];
      if (currQ) {
        setIsBotThinking(true);
        // Fast, realistic response between 1.0s and 1.6s
        const botDelayMs = Math.floor(Math.random() * 600) + 1100;
        botTimeoutRef.current = setTimeout(() => {
          if (roundRevealedRef.current || p2SubmittedRef.current) return;
          setIsBotThinking(false);
          const correctAnswer = currQ.answer;
          const shouldBeCorrect = Math.random() < 0.88; // 88% bot accuracy
          let botAns = correctAnswer;
          if (!shouldBeCorrect) {
            const wrongOffset = Math.random() < 0.5 ? 1 : -1;
            botAns = String(Math.max(0, parseInt(correctAnswer, 10) + wrongOffset));
          }
          handleBotSubmission(botAns);
        }, botDelayMs);
      }
    }
  };

  // Bot submission handler
  const handleBotSubmission = (botAns: string) => {
    if (roundRevealedRef.current || p2SubmittedRef.current) return;
    p2SubmittedRef.current = true;
    p2DigitsRef.current = botAns;
    setP2Digits(botAns);
    setIsBotThinking(false);
    processPlayerSubmission(2, botAns);
  };

  // Process submission for P1 or P2
  const processPlayerSubmission = (player: 1 | 2, answerVal: string) => {
    if (roundRevealedRef.current) return;
    const currRoundIdx = currentRoundRef.current;
    const qList = questionsRef.current.length > 0 ? questionsRef.current : questions;
    const q = qList[currRoundIdx];
    if (!q) return;

    const isCorr = String(answerVal).trim() === String(q.answer).trim();
    const elapsed = Math.max(0.1, (Date.now() - roundStartTimestampRef.current) / 1000);

    if (player === 1) {
      if (p1SubmittedRef.current) return;
      p1SubmittedRef.current = true;
      p1DigitsRef.current = answerVal;
      setP1Submitted(true);
      setP1TotalTime((t) => t + elapsed);

      if (isCorr) {
        setP1Combo((prev) => {
          const newCombo = prev + 1;
          setP1Score((s) => s + 200 + newCombo * 25);
          try {
            soundEngine.playCorrectSound(newCombo);
          } catch (e) {
            console.error(e);
          }
          return newCombo;
        });
        setP1CorrectCount((c) => c + 1);
        setP1LastResult('correct');

        // ⭐ SPEED VICTORY! Player 1 solved it correctly first!
        if (playModeRef.current === 'vs-bot') {
          if (botTimeoutRef.current) {
            clearTimeout(botTimeoutRef.current);
            botTimeoutRef.current = null;
          }
          setIsBotThinking(false);
          p2SubmittedRef.current = true;
          setP2Submitted(true);
          p2DigitsRef.current = 'تأخر الرد ⚡';
          setP2Digits('تأخر الرد ⚡');
        }
        concludeRound();
        return;
      } else {
        setP1Combo(0);
        setP1WrongCount((w) => w + 1);
        setP1LastResult('wrong');
        try {
          soundEngine.playWrongSound();
        } catch (e) {
          console.error(e);
        }
        // In vs-bot mode: if player 1 is wrong, conclude soon so user is never stuck
        if (playModeRef.current === 'vs-bot') {
          setTimeout(() => {
            if (!roundRevealedRef.current) {
              concludeRound();
            }
          }, 800);
        }
      }
    } else {
      // Player 2 or Bot
      if (p2SubmittedRef.current && player !== 2) return;
      p2SubmittedRef.current = true;
      p2DigitsRef.current = answerVal;
      setP2Submitted(true);
      setP2TotalTime((t) => t + elapsed);

      if (isCorr) {
        setP2Combo((prev) => {
          const newCombo = prev + 1;
          setP2Score((s) => s + 200 + newCombo * 25);
          try {
            soundEngine.playCorrectSound(newCombo);
          } catch (e) {
            console.error(e);
          }
          return newCombo;
        });
        setP2CorrectCount((c) => c + 1);
        setP2LastResult('correct');

        concludeRound();
        return;
      } else {
        setP2Combo(0);
        setP2WrongCount((w) => w + 1);
        setP2LastResult('wrong');
        try {
          soundEngine.playWrongSound();
        } catch (e) {
          console.error(e);
        }
      }
    }

    // Check if both players have submitted
    if (p1SubmittedRef.current && p2SubmittedRef.current) {
      concludeRound();
    }
  };

  // Round time expired
  const handleRoundTimeExpired = () => {
    if (roundRevealedRef.current) return;
    p1SubmittedRef.current = true;
    p2SubmittedRef.current = true;
    setP1Submitted(true);
    setP2Submitted(true);

    if (!p1DigitsRef.current) {
      setP1WrongCount((w) => w + 1);
      setP1Combo(0);
      setP1LastResult('wrong');
      setP1TotalTime((t) => t + qTimeLimit);
    }
    if (!p2DigitsRef.current) {
      setP2WrongCount((w) => w + 1);
      setP2Combo(0);
      setP2LastResult('wrong');
      setP2TotalTime((t) => t + qTimeLimit);
    }
    try {
      soundEngine.playWrongSound();
    } catch (e) {
      console.error(e);
    }
    concludeRound();
  };

  // Conclude the round and reveal answer
  const concludeRound = () => {
    if (roundRevealedRef.current) return;
    roundRevealedRef.current = true;
    setRoundRevealed(true);
    setIsBotThinking(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current);
      botTimeoutRef.current = null;
    }
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }

    try {
      const currIdx = currentRoundRef.current;
      const qList = questionsRef.current.length > 0 ? questionsRef.current : questions;
      const q = qList[currIdx];

      if (q) {
        const p1Ans = p1DigitsRef.current || 'لم يجب';
        const p2Ans = p2DigitsRef.current || (playModeRef.current === 'vs-bot' && p1SubmittedRef.current ? 'تأخر الرد' : 'لم يجب');
        const historyItem: RoundHistory = {
          round: currIdx + 1,
          questionText: formatPromptSequenceText(q.promptSeq),
          correctAnswer: q.answer,
          p1Answer: p1Ans,
          p1Correct: String(p1Ans).trim() === String(q.answer).trim(),
          p1TimeSec: Math.max(0.1, (Date.now() - roundStartTimestampRef.current) / 1000),
          p2Answer: p2Ans,
          p2Correct: String(p2Ans).trim() === String(q.answer).trim(),
          p2TimeSec: Math.max(0.1, (Date.now() - roundStartTimestampRef.current) / 1000),
        };

        setMatchHistory((prev) => [...prev, historyItem]);
      }
    } catch (e) {
      console.error('Error logging round history:', e);
    }

    // Auto-advance to next round after 1.4s reveal
    advanceTimeoutRef.current = setTimeout(() => {
      advanceToNextRound();
    }, 1400);
  };

  // Player 1 Punch Digit (Uses ref to construct full multi-digit number without stale closures)
  const handleP1Digit = (digit: number) => {
    if (!isLive || isShowingSeq || p1SubmittedRef.current || roundRevealedRef.current || isMatchOver) return;
    soundEngine.playPunchImpact(0.9);
    const current = p1DigitsRef.current || '';
    const newBuf = current + String(digit);
    p1DigitsRef.current = newBuf;
    setP1Digits(newBuf);

    // Auto-submit if buffer matches expected answer length
    const qList = questionsRef.current.length > 0 ? questionsRef.current : questions;
    const currQ = qList[currentRoundRef.current];
    const expectedLen = currQ?.answer?.length || 1;
    if (newBuf.length >= expectedLen) {
      processPlayerSubmission(1, newBuf);
    }
  };

  const handleP1Clear = () => {
    if (!isLive || isShowingSeq || p1SubmittedRef.current || roundRevealedRef.current || isMatchOver) return;
    soundEngine.playPunchImpact(0.5);
    p1DigitsRef.current = '';
    setP1Digits('');
  };

  const handleP1Backspace = () => {
    if (!isLive || isShowingSeq || p1SubmittedRef.current || roundRevealedRef.current || isMatchOver) return;
    soundEngine.playPunchImpact(0.5);
    const updated = (p1DigitsRef.current || '').slice(0, -1);
    p1DigitsRef.current = updated;
    setP1Digits(updated);
  };

  const handleP1Submit = () => {
    if (!isLive || isShowingSeq || p1SubmittedRef.current || roundRevealedRef.current || isMatchOver || !p1DigitsRef.current) return;
    processPlayerSubmission(1, p1DigitsRef.current);
  };

  // Player 2 Punch Digit (Uses ref to construct full multi-digit number without stale closures)
  const handleP2Digit = (digit: number) => {
    if (!isLive || isShowingSeq || p2SubmittedRef.current || roundRevealedRef.current || isMatchOver || playModeRef.current === 'vs-bot') return;
    soundEngine.playPunchImpact(0.9);
    const current = p2DigitsRef.current || '';
    const newBuf = current + String(digit);
    p2DigitsRef.current = newBuf;
    setP2Digits(newBuf);

    const qList = questionsRef.current.length > 0 ? questionsRef.current : questions;
    const currQ = qList[currentRoundRef.current];
    const expectedLen = currQ?.answer?.length || 1;
    if (newBuf.length >= expectedLen) {
      processPlayerSubmission(2, newBuf);
    }
  };

  const handleP2Clear = () => {
    if (!isLive || isShowingSeq || p2SubmittedRef.current || roundRevealedRef.current || isMatchOver || playModeRef.current === 'vs-bot') return;
    soundEngine.playPunchImpact(0.5);
    p2DigitsRef.current = '';
    setP2Digits('');
  };

  const handleP2Backspace = () => {
    if (!isLive || isShowingSeq || p2SubmittedRef.current || roundRevealedRef.current || isMatchOver || playModeRef.current === 'vs-bot') return;
    soundEngine.playPunchImpact(0.5);
    const updated = (p2DigitsRef.current || '').slice(0, -1);
    p2DigitsRef.current = updated;
    setP2Digits(updated);
  };

  const handleP2Submit = () => {
    if (!isLive || isShowingSeq || p2SubmittedRef.current || roundRevealedRef.current || isMatchOver || !p2DigitsRef.current || playModeRef.current === 'vs-bot') return;
    processPlayerSubmission(2, p2DigitsRef.current);
  };

  // ⭐ Precise Winner Determination & Tie-Breaking Criteria ⭐
  // Criterion 1: Highest Score (العلامة / الدرجة الأعلى لتحديد الفائز الأساسي)
  // Criterion 2: Speed / Least Time (السرعة والوقت الأقل كمعيار لحسم النتيجة عند تعادل العلامات)
  // ⭐ Precise Winner Determination & Tie-Breaking Criteria ⭐
  // Criterion 1: Highest Score (العلامة / الدرجة الأعلى لتحديد الفائز الأساسي)
  // Criterion 2: Speed / Least Time (السرعة والوقت الأقل كمعيار لحسم النتيجة عند تعادل العلامات)
  // Guarantee Trophy (الكأس الذهبي) to the faster contestant automatically upon score tie
  const scoreDiff = Math.abs(p1Score - p2Score);
  const timeDiff = Math.abs(p1TotalTime - p2TotalTime);

  let winner: 'p1' | 'p2' = 'p1';
  let winReason: 'score' | 'speed_tiebreaker' = 'score';

  if (p1Score > p2Score) {
    winner = 'p1';
    winReason = 'score';
  } else if (p2Score > p1Score) {
    winner = 'p2';
    winReason = 'score';
  } else {
    // Scores are tied! Settle by speed (least elapsed response time)
    if (p1TotalTime < p2TotalTime) {
      winner = 'p1';
      winReason = 'speed_tiebreaker';
    } else if (p2TotalTime < p1TotalTime) {
      winner = 'p2';
      winReason = 'speed_tiebreaker';
    } else {
      // Millisecond-exact tie fallback: least mistakes / accuracy
      if (p1CorrectCount > p2CorrectCount) {
        winner = 'p1';
        winReason = 'score';
      } else if (p2CorrectCount > p1CorrectCount) {
        winner = 'p2';
        winReason = 'score';
      } else {
        winner = 'p1';
        winReason = 'speed_tiebreaker';
      }
    }
  }

  const p1Wins = winner === 'p1';
  const p2Wins = winner === 'p2';
  const isTie = false;
  const isSpeedTiebreaker = winReason === 'speed_tiebreaker';

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
            <span>Mind Sport • Competition</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-amber-300 to-purple-400">
            بطولة تحدي الحساب الذهني
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="font-bold">المسابقة</span>
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

          {/* Mode Selector (AI Bot vs 2 Students) */}
          <div className="w-full grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => {
                soundEngine.playTargetActivate();
                setPlayMode('vs-bot');
                playModeRef.current = 'vs-bot';
                setP2Name('روبوت الحساب السريع 🤖');
              }}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-center gap-2.5 font-bold text-xs sm:text-sm cursor-pointer ${
                playMode === 'vs-bot'
                  ? 'bg-purple-500/25 border-purple-400 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-[1.02]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              <Bot className="w-5 h-5 text-purple-400" />
              <span>تحدي ضد الذكاء الاصطناعي (طالب واحد 🤖)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playTargetActivate();
                setPlayMode('two-students');
                playModeRef.current = 'two-students';
                setP2Name('المتسابق 2');
              }}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-center gap-2.5 font-bold text-xs sm:text-sm cursor-pointer ${
                playMode === 'two-students'
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-[1.02]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              <Users className="w-5 h-5 text-cyan-400" />
              <span>طالب ضد طالب (شاشة واحدة 👥)</span>
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
                {playMode === 'vs-bot' ? 'المنافس الآلي (الذكاء الاصطناعي)' : 'اسم المتسابق الثاني (الجهة اليمنى)'}
              </label>
              <input
                type="text"
                value={playMode === 'vs-bot' ? 'روبوت الحساب السريع 🤖' : p2Name}
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
            3. MATCH RESULTS & TROPHY CELEBRATION (معايير فك التعادل وجوائز الكأس والميدالية)
           ======================================================== */
        <div className="relative z-10 w-full flex-1 flex flex-col justify-between max-w-7xl mx-auto py-2">
          {/* Top Decision Header Banner */}
          <div className="w-full mb-3 sm:mb-4 p-3.5 sm:p-4 rounded-3xl bg-slate-950/80 backdrop-blur-xl border border-amber-400/40 shadow-[0_0_35px_rgba(245,158,11,0.2)]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                  <Trophy className="w-6 h-6 fill-slate-950" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                    النتيجة الرسمية لبطولة الحساب الذهني
                  </span>
                  <h3 className="text-lg sm:text-2xl font-black text-white">
                    {p1Wins
                      ? `🏆 بطل المسابقة: ${p1Name}`
                      : p2Wins
                      ? `🏆 بطل المسابقة: ${p2Name}`
                      : '⚔️ تعادل بطولي مشترك بين المتسابقين'}
                  </h3>
                </div>
              </div>

              {/* Criterion Decider Badge */}
              <div className="flex items-center gap-2">
                {isSpeedTiebreaker ? (
                  <div className="px-3.5 py-1.5 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse">
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>حسم الفوز بالسرعة الفائقة ⚡ (تعادل في النقاط وفارق سرعة {timeDiff.toFixed(2)} ثانية)</span>
                  </div>
                ) : !isTie ? (
                  <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>حسم الفوز بأعلى مجموع درجات (فارق {scoreDiff} نقطة)</span>
                  </div>
                ) : (
                  <div className="px-3.5 py-1.5 rounded-2xl bg-purple-500/20 border border-purple-400/50 text-purple-300 font-bold text-xs">
                    تعادل متطابق في النقاط والسرعة
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side-by-Side Winner Stage (Trophy on Winner's Half, Medal on Runner-up) */}
          <div className="relative w-full flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch my-auto">
            {/* LEFT PLAYER RESULTS CARD */}
            <div
              className={`relative rounded-3xl p-5 sm:p-7 flex flex-col items-center justify-between text-center transition-all backdrop-blur-xl border ${
                p1Wins
                  ? 'bg-gradient-to-b from-cyan-950/90 via-slate-900/95 to-slate-950 border-amber-400 shadow-[0_0_60px_rgba(245,158,11,0.35)] scale-[1.01]'
                  : 'bg-slate-950/70 border-white/10 opacity-90'
              }`}
            >
              {/* Winner or Runner-up Top Pill */}
              {p1Wins ? (
                <div className="absolute -top-4 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center gap-1.5 animate-bounce">
                  <Trophy className="w-4 h-4 fill-slate-950" />
                  <span>{isSpeedTiebreaker ? 'بطل المسابقة بحسم السرعة ⚡' : 'بطل المسابقة • المركز الأول 🏆'}</span>
                </div>
              ) : (
                <div className="absolute -top-4 px-3.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-600 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow">
                  <Medal className="w-3.5 h-3.5 text-slate-300" />
                  <span>المركز الثاني • RUNNER UP 🥈</span>
                </div>
              )}

              {/* Contestant Header */}
              <div className="mt-2">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest block mb-0.5">
                  المتسابق الأول
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">{p1Name}</h3>
              </div>

              {/* Award Trophy (for Winner) OR Award Medal (for Runner-Up) */}
              <div className="my-4 flex flex-col items-center justify-center">
                {p1Wins ? (
                  /* The Golden Trophy Award */
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
                  /* The Silver Medal Award */
                  <div className="relative group">
                    <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-b from-slate-300 via-slate-400 to-slate-600 p-1 flex items-center justify-center shadow-[0_0_30px_rgba(203,213,225,0.25)]">
                      <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center">
                        <Medal className="w-16 h-16 sm:w-18 sm:h-18 text-slate-300 drop-shadow-[0_0_15px_rgba(203,213,225,0.4)]" />
                        <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest mt-1">
                          الميدالية الفضية
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-banner Explaining the Award */}
                <div className="mt-3">
                  {p1Wins && isSpeedTiebreaker ? (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>مُنح الكأس الذهبي تلقائياً لحسم التعادل بالسرعة الأسرع!</span>
                    </div>
                  ) : p1Wins ? (
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>مُنح الكأس الذهبي لتحقيق أعلى مجموع نقاط</span>
                    </div>
                  ) : isSpeedTiebreaker ? (
                    <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
                      أداء متميز! تعادل في النقاط وحل وصيفاً بفارق سرعة ({timeDiff.toFixed(2)}s)
                    </div>
                  ) : (
                    <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
                      مُنحت الميدالية التكريمية تقديراً للأداء البطولي
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Breakdown including Speed/Time */}
              <div className="w-full space-y-2 bg-slate-900/85 rounded-2xl p-4 border border-white/10 text-right">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">مجموع النقاط (المعيار 1):</span>
                  <span className="text-xl font-black text-cyan-300 font-mono">{p1Score} PTS</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-white/5 pt-1.5">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5 text-amber-400" />
                    <span>إجمالي وقت الإجابة (السرعة):</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {p1TotalTime < p2TotalTime && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[10px] font-black border border-amber-400/30">
                        ⚡ الأسرع
                      </span>
                    )}
                    <span className="text-sm font-black text-white font-mono">{p1TotalTime.toFixed(2)} ثانية</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">متوسط سرعة الحل:</span>
                  <span className="text-xs font-bold text-slate-300 font-mono">
                    {totalRounds > 0 ? (p1TotalTime / totalRounds).toFixed(2) : 0} ثانية / سؤال
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-white/5 pt-1.5">
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
              className={`relative rounded-3xl p-5 sm:p-7 flex flex-col items-center justify-between text-center transition-all backdrop-blur-xl border ${
                p2Wins
                  ? 'bg-gradient-to-b from-purple-950/90 via-slate-900/95 to-slate-950 border-amber-400 shadow-[0_0_60px_rgba(245,158,11,0.35)] scale-[1.01]'
                  : 'bg-slate-950/70 border-white/10 opacity-90'
              }`}
            >
              {/* Winner or Runner-up Top Pill */}
              {p2Wins ? (
                <div className="absolute -top-4 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center gap-1.5 animate-bounce">
                  <Trophy className="w-4 h-4 fill-slate-950" />
                  <span>{isSpeedTiebreaker ? 'بطل المسابقة بحسم السرعة ⚡' : 'بطل المسابقة • المركز الأول 🏆'}</span>
                </div>
              ) : (
                <div className="absolute -top-4 px-3.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-600 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow">
                  <Medal className="w-3.5 h-3.5 text-slate-300" />
                  <span>المركز الثاني • RUNNER UP 🥈</span>
                </div>
              )}

              {/* Contestant Header */}
              <div className="mt-2">
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-widest block mb-0.5">
                  {playMode === 'vs-bot' ? 'المنافس الآلي' : 'المتسابق الثاني'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">{p2Name}</h3>
              </div>

              {/* Award Trophy (for Winner) OR Award Medal (for Runner-Up) */}
              <div className="my-4 flex flex-col items-center justify-center">
                {p2Wins ? (
                  /* The Golden Trophy Award */
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
                  /* The Silver Medal Award */
                  <div className="relative group">
                    <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-b from-slate-300 via-slate-400 to-slate-600 p-1 flex items-center justify-center shadow-[0_0_30px_rgba(203,213,225,0.25)]">
                      <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center">
                        <Medal className="w-16 h-16 sm:w-18 sm:h-18 text-slate-300 drop-shadow-[0_0_15px_rgba(203,213,225,0.4)]" />
                        <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest mt-1">
                          الميدالية الفضية
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-banner Explaining the Award */}
                <div className="mt-3">
                  {p2Wins && isSpeedTiebreaker ? (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>مُنح الكأس الذهبي تلقائياً لحسم التعادل بالسرعة الأسرع!</span>
                    </div>
                  ) : p2Wins ? (
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>مُنح الكأس الذهبي لتحقيق أعلى مجموع نقاط</span>
                    </div>
                  ) : isSpeedTiebreaker ? (
                    <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
                      أداء متميز! تعادل في النقاط وحل وصيفاً بفارق سرعة ({timeDiff.toFixed(2)}s)
                    </div>
                  ) : (
                    <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
                      مُنحت الميدالية التكريمية تقديراً للأداء البطولي
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Breakdown including Speed/Time */}
              <div className="w-full space-y-2 bg-slate-900/85 rounded-2xl p-4 border border-white/10 text-right">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">مجموع النقاط (المعيار 1):</span>
                  <span className="text-xl font-black text-purple-300 font-mono">{p2Score} PTS</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-white/5 pt-1.5">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5 text-amber-400" />
                    <span>إجمالي وقت الإجابة (السرعة):</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {p2TotalTime < p1TotalTime && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[10px] font-black border border-amber-400/30">
                        ⚡ الأسرع
                      </span>
                    )}
                    <span className="text-sm font-black text-white font-mono">{p2TotalTime.toFixed(2)} ثانية</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">متوسط سرعة الحل:</span>
                  <span className="text-xs font-bold text-slate-300 font-mono">
                    {totalRounds > 0 ? (p2TotalTime / totalRounds).toFixed(2) : 0} ثانية / سؤال
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-white/5 pt-1.5">
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
          <div className="relative w-full flex-1 min-h-[460px] sm:min-h-[500px] md:min-h-[540px] rounded-3xl bg-gradient-to-b from-[#0b1022] via-[#090d1c] to-[#060914] border-2 border-slate-700/60 shadow-[0_0_50px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col">
            {/* Whiteboard Perimeter Frame (like the red marker frame in the video) */}
            <div className="absolute inset-0 border-4 border-rose-500/20 rounded-3xl pointer-events-none z-10" />

            {/* Central Dividing Line (as drawn by the teacher in the video) */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1.5 bg-gradient-to-b from-cyan-500/30 via-slate-600/60 to-purple-500/30 z-0 pointer-events-none" />

            {/* ⭐ THE PROMINENT CENTRAL QUESTION CIRCLE / CELL (حصر التكبير على الدائرة والرقم في الوسط فقط ليكون فائق الوضوح للطلاب) ⭐ */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center select-none">
              {/* Central Glowing Cell */}
              <div
                onClick={() => {
                  if (roundRevealed) advanceToNextRound();
                }}
                className={`relative w-36 h-36 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-52 lg:h-52 rounded-full flex flex-col items-center justify-center p-2 sm:p-2.5 transition-all duration-300 shadow-[0_0_40px_rgba(0,0,0,0.95)] ${
                  roundRevealed ? 'cursor-pointer hover:scale-105 active:scale-95' : 'pointer-events-none'
                } ${
                  isShowingSeq
                    ? 'bg-gradient-to-tr from-cyan-950 via-slate-900 to-purple-950 border-3 sm:border-4 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.7)] scale-105'
                    : roundRevealed
                    ? 'bg-gradient-to-tr from-emerald-950 via-slate-900 to-emerald-900 border-3 sm:border-4 border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.7)] animate-pulse'
                    : 'bg-slate-950/95 border-3 sm:border-4 border-cyan-400/80 shadow-[0_0_30px_rgba(6,182,212,0.5)]'
                }`}
              >
                {/* Secondary inner ring with ambient depth */}
                <div className="w-full h-full rounded-full border border-dashed border-white/20 flex flex-col items-center justify-center relative overflow-hidden bg-radial from-slate-800/60 to-slate-950 shadow-inner">
                  {/* Flashing content - prominently enlarged for clear visibility */}
                  {isShowingSeq ? (
                    <div className="flex flex-col items-center justify-center animate-pulse">
                      <span className="text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-widest mb-0.5 sm:mb-1">
                        انتبه للرقم!
                      </span>
                      <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_30px_rgba(245,158,11,1)]">
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
                      <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-0.5 sm:mb-1">
                        الإجابة الصحيحة
                      </span>
                      <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-mono text-emerald-300 drop-shadow-[0_0_30px_rgba(16,185,129,1)]">
                        = {questions[currentRound]?.answer}
                      </span>
                    </div>
                  ) : (
                    /* Answer Phase / Countdown */
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] sm:text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-0.5 sm:mb-1 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400 animate-spin" />
                        احسب وأجب!
                      </span>
                      <span className="text-3xl sm:text-4xl md:text-5xl font-black font-mono text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                        {roundTimeRemaining.toFixed(1)}s
                      </span>
                      <div className="w-18 sm:w-22 md:w-28 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-100"
                          style={{ width: `${(roundTimeRemaining / qTimeLimit) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Central Title Tag or Next Round Interactive Button */}
              {roundRevealed ? (
                <button
                  onClick={advanceToNextRound}
                  className="mt-2.5 px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.6)] cursor-pointer active:scale-95 transition-all animate-bounce"
                >
                  <span>الجولة التالية</span>
                  <span>➜</span>
                </button>
              ) : (
                <div className="mt-2 px-3 py-0.5 rounded-full bg-slate-900/95 border border-white/20 text-[9px] sm:text-[10px] font-bold text-slate-300 shadow pointer-events-none">
                  {isShowingSeq ? 'وميض السؤال' : 'طور الإجابة السريعة'}
                </div>
              )}
            </div>

            {/* Split Screen Container (Left Player Half vs Right Player Half) */}
            <div className="relative w-full flex-1 grid grid-cols-2 z-10">
              {/* ========================================================
                  LEFT HALF: PLAYER 1 (Cyan / Electric Neon)
                 ======================================================== */}
              <div className="relative h-full flex flex-col justify-between p-2 sm:p-4 border-r border-white/5">
                {/* P1 Top Stats Header */}
                <div className="w-full flex items-center justify-between bg-slate-950/70 backdrop-blur-md border border-cyan-500/30 rounded-2xl px-3 py-1.5 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-pulse" />
                    <div>
                      <div className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">
                        المتسابق الأول
                      </div>
                      <div className="text-xs sm:text-sm font-black text-white">{p1Name}</div>
                    </div>
                  </div>

                  {/* P1 Live Input & Score */}
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <div className="text-[8px] text-slate-400 font-bold uppercase">المدخل:</div>
                      <div className="text-xs sm:text-sm font-black font-mono text-cyan-300 min-w-[28px] text-center bg-cyan-950/60 border border-cyan-400/40 px-1.5 py-0.5 rounded-lg">
                        {p1Digits || '—'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] text-slate-400 font-bold uppercase">النقاط:</div>
                      <div className="text-xs sm:text-sm font-black text-white">{p1Score}</div>
                    </div>
                  </div>
                </div>

                {/* P1 Organic Scattered Number Circles (0-9) - Standard Compact Size */}
                <div className="relative flex-1 w-full my-1 min-h-[280px] sm:min-h-[320px]">
                  {P1_SCATTERED_LAYOUT.map((item) => (
                    <button
                      key={`p1_${item.digit}`}
                      onClick={() => handleP1Digit(item.digit)}
                      disabled={isShowingSeq || p1Submitted || isMatchOver}
                      style={{
                        top: item.top,
                        left: item.left,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className={`absolute z-10 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full font-black text-xl sm:text-2xl md:text-3xl transition-all duration-150 flex items-center justify-center cursor-pointer select-none active:scale-90 ${
                        isShowingSeq || p1Submitted
                          ? 'bg-slate-900/60 border-2 border-slate-700/60 text-slate-500 opacity-60 cursor-not-allowed'
                          : 'bg-gradient-to-b from-cyan-950 via-slate-900 to-slate-950 border-2 sm:border-3 border-cyan-400 text-cyan-200 hover:text-white hover:border-cyan-300 hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      }`}
                    >
                      {item.digit}
                    </button>
                  ))}

                  {/* Result Overlay on P1 side upon round end */}
                  {p1Submitted && (
                    <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/95 border border-white/20 text-xs font-bold shadow">
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
                <div className="w-full flex items-center justify-between gap-2 pt-1.5 border-t border-white/5">
                  <button
                    onClick={handleP1Clear}
                    disabled={isShowingSeq || p1Submitted || isMatchOver || !p1Digits}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition-all disabled:opacity-40"
                  >
                    <Delete className="w-3.5 h-3.5" />
                    <span>مسح</span>
                  </button>

                  <button
                    onClick={handleP1Backspace}
                    disabled={isShowingSeq || p1Submitted || isMatchOver || !p1Digits}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition-all disabled:opacity-40"
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
                  (Exact Same Symmetrical Distance with ZERO Overlap!)
                 ======================================================== */}
              <div className="relative h-full flex flex-col justify-between p-2 sm:p-4 border-l border-white/5">
                {/* P2 Top Stats Header */}
                <div className="w-full flex items-center justify-between bg-slate-950/70 backdrop-blur-md border border-purple-500/30 rounded-2xl px-3 py-1.5 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)] animate-pulse" />
                    <div>
                      <div className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">
                        {playMode === 'vs-bot' ? 'المنافس الآلي (الذكاء الاصطناعي 🤖)' : 'المتسابق الثاني'}
                      </div>
                      <div className="text-xs sm:text-sm font-black text-white">{p2Name}</div>
                    </div>
                  </div>

                  {/* P2 Live Input & Score */}
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <div className="text-[8px] text-slate-400 font-bold uppercase">المدخل:</div>
                      <div className="text-xs sm:text-sm font-black font-mono text-purple-300 min-w-[32px] text-center bg-purple-950/60 border border-purple-400/40 px-2 py-0.5 rounded-lg">
                        {isBotThinking && playMode === 'vs-bot' ? (
                          <span className="text-[10px] text-amber-300 animate-pulse font-sans">يفكر... ⚡</span>
                        ) : (
                          p2Digits || '—'
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] text-slate-400 font-bold uppercase">النقاط:</div>
                      <div className="text-xs sm:text-sm font-black text-white">{p2Score}</div>
                    </div>
                  </div>
                </div>

                {/* P2 Organic Scattered Number Circles (0-9) - Standard Compact Size */}
                <div className="relative flex-1 w-full my-1 min-h-[280px] sm:min-h-[320px]">
                  {P2_SCATTERED_LAYOUT.map((item) => (
                    <button
                      key={`p2_${item.digit}`}
                      onClick={() => handleP2Digit(item.digit)}
                      disabled={isShowingSeq || p2Submitted || isMatchOver || playMode === 'vs-bot'}
                      style={{
                        top: item.top,
                        left: item.left,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className={`absolute z-10 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full font-black text-xl sm:text-2xl md:text-3xl transition-all duration-150 flex items-center justify-center cursor-pointer select-none active:scale-90 ${
                        isShowingSeq || p2Submitted || playMode === 'vs-bot'
                          ? 'bg-slate-900/60 border-2 border-slate-700/60 text-slate-500 opacity-60 cursor-not-allowed'
                          : 'bg-gradient-to-b from-purple-950 via-slate-900 to-slate-950 border-2 sm:border-3 border-purple-400 text-purple-200 hover:text-white hover:border-purple-300 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                      }`}
                    >
                      {item.digit}
                    </button>
                  ))}

                  {/* Result Overlay on P2 side upon round end */}
                  {p2Submitted && (
                    <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/95 border border-white/20 text-xs font-bold shadow">
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
                <div className="w-full flex items-center justify-between gap-2 pt-1.5 border-t border-white/5">
                  <button
                    onClick={handleP2Clear}
                    disabled={isShowingSeq || p2Submitted || isMatchOver || !p2Digits || playMode === 'vs-bot'}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition-all disabled:opacity-40"
                  >
                    <Delete className="w-3.5 h-3.5" />
                    <span>مسح</span>
                  </button>

                  <button
                    onClick={handleP2Backspace}
                    disabled={isShowingSeq || p2Submitted || isMatchOver || !p2Digits || playMode === 'vs-bot'}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition-all disabled:opacity-40"
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
          title={`مسابقة التحدي - ${p1Name} ضد ${p2Name}`}
          onComplete={() => {
            setIsCountdownActive(false);
            startNewRound(0);
          }}
        />
      )}
    </div>
  );
};
