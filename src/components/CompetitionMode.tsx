import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ThreeBoxingMachine } from './ThreeBoxingMachine';
import { MatchResultsModal } from './MatchResultsModal';
import { Competitor, FlashCardToken, Question, AdminSettings } from '../types';
import { soundEngine } from '../utils/audio';
import { getLevel1Questions } from '../utils/questionsBank';
import { ArrowLeft, Trophy, Medal, Flame, Timer, CheckCircle, AlertTriangle, Play, Lock, CheckCircle2 } from 'lucide-react';
import { getActiveSpeedInfo, DEFAULT_ADMIN_SETTINGS } from '../utils/adminSettings';

interface CompetitionModeProps {
  onBackToMenu: () => void;
  adminSettings?: AdminSettings;
}

export const CompetitionMode: React.FC<CompetitionModeProps> = ({ onBackToMenu, adminSettings }) => {
  const activeAdminSettings = adminSettings || DEFAULT_ADMIN_SETTINGS;
  const speedInfo = React.useMemo(() => getActiveSpeedInfo(activeAdminSettings), [activeAdminSettings]);
  const flashMs = speedInfo.effectiveFlashMs;

  const [isLive, setIsLive] = useState<boolean>(false);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const totalRounds = 5;

  // Player's personal machine state in the tournament
  const [userDigits, setUserDigits] = useState<string>('');
  const [userScore, setUserScore] = useState<number>(0);
  const [userMistakes, setUserMistakes] = useState<number>(0);

  // Synchronized question
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [activeToken, setActiveToken] = useState<FlashCardToken | null>(null);
  const [isShowingSeq, setIsShowingSeq] = useState<boolean>(false);
  const seqIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Leaderboard of 12 simulated tournament competitors
  const [competitors, setCompetitors] = useState<Competitor[]>([
    { id: 'usr', name: 'YOU (Machine #01)', school: 'Apex Academy', score: 0, accuracy: 100, timeMs: 0, mistakes: 0, currentQuestionIndex: 0, isFinished: false, status: 'active' },
    { id: 'c1', name: 'Sami A.', school: 'Future Mind High', score: 1250, accuracy: 96, timeMs: 1420, mistakes: 0, currentQuestionIndex: 0, isFinished: false, status: 'active' },
    { id: 'c2', name: 'Lina K.', school: 'Olympic STEM', score: 1180, accuracy: 92, timeMs: 1580, mistakes: 1, currentQuestionIndex: 0, isFinished: false, status: 'active' },
    { id: 'c3', name: 'Omar H.', school: 'Cyber Tech Prep', score: 1100, accuracy: 90, timeMs: 1620, mistakes: 1, currentQuestionIndex: 0, isFinished: false, status: 'active' },
    { id: 'c4', name: 'Yasmeen M.', school: 'Apex Academy', score: 1050, accuracy: 88, timeMs: 1710, mistakes: 2, currentQuestionIndex: 0, isFinished: false, status: 'active' },
    { id: 'c5', name: 'Zaid T.', school: 'Future Mind High', score: 980, accuracy: 85, timeMs: 1820, mistakes: 2, currentQuestionIndex: 0, isFinished: false, status: 'active' },
    { id: 'c6', name: 'Farah S.', school: 'Olympic STEM', score: 920, accuracy: 82, timeMs: 1940, mistakes: 3, currentQuestionIndex: 0, isFinished: false, status: 'active' },
  ]);

  const [isTournamentOver, setIsTournamentOver] = useState<boolean>(false);

  // Start Tournament
  const startChampionship = () => {
    setIsLive(true);
    setCurrentRound(0);
    setUserScore(0);
    setUserMistakes(0);
    setIsTournamentOver(false);
    loadNextRoundQuestion(0);
  };

  const loadNextRoundQuestion = (roundIdx: number) => {
    if (seqIntervalRef.current) clearInterval(seqIntervalRef.current);

    const qList = getLevel1Questions(1);
    const q: Question = qList[0] || {
      id: `champ_${roundIdx}`,
      displayTitle: `CHAMPIONSHIP ROUND ${roundIdx + 1}`,
      promptSeq: [
        { type: 'number', value: '48' },
        { type: 'operator', value: '+' },
        { type: 'number', value: '51' },
      ],
      answer: '99',
      timeLimitSeconds: 15,
    };
    q.displayTitle = `CHAMPIONSHIP ROUND ${roundIdx + 1}`;

    setActiveQuestion(q);
    setUserDigits('');
    setIsShowingSeq(true);

    if (!q.promptSeq || q.promptSeq.length === 0) {
      setActiveToken(null);
      setIsShowingSeq(false);
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
      }
    }, flashMs);
  };

  // Simulate AI competitors' scoring dynamically on round end
  const simulateCompetitorProgress = () => {
    setCompetitors((prev) => {
      const updated = prev.map((c) => {
        if (c.id === 'usr') {
          return {
            ...c,
            score: userScore,
            mistakes: userMistakes,
          };
        }
        // AI random performance update
        const pointsAdded = Math.floor(Math.random() * 180) + 100;
        return {
          ...c,
          score: c.score + pointsAdded,
          timeMs: c.timeMs + Math.floor(Math.random() * 300) + 1200,
        };
      });

      // Priority sort: 1. Highest Score -> 2. Fastest Time -> 3. Least Mistakes
      return updated.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
        return a.mistakes - b.mistakes;
      });
    });
  };

  const handlePunchDigit = (digit: number) => {
    if (!isLive || isShowingSeq || !activeQuestion || isTournamentOver) return;

    const newBuf = userDigits + String(digit);
    setUserDigits(newBuf);

    if (newBuf.length >= activeQuestion.answer.length) {
      if (newBuf === activeQuestion.answer) {
        soundEngine.playCorrectSound();
        setUserScore((s) => s + 250);
      } else {
        soundEngine.playWrongSound();
        setUserMistakes((m) => m + 1);
      }

      simulateCompetitorProgress();

      if (currentRound + 1 < totalRounds) {
        const nextR = currentRound + 1;
        setCurrentRound(nextR);
        loadNextRoundQuestion(nextR);
      } else {
        // Championship Finish!
        setIsTournamentOver(true);
        setIsLive(false);
        soundEngine.playVictorySound();

        const correctRounds = Math.max(0, totalRounds - userMistakes);
        const acc = totalRounds > 0 ? Math.round((correctRounds / totalRounds) * 100) : 0;
        if (acc >= 70) {
          confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
        }
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between p-4 md:p-6 select-none">
      {/* Header HUD */}
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

        <div className="flex items-center gap-3">
          <div className="px-4 py-1.5 rounded-xl bg-amber-500/15 backdrop-blur-md border border-amber-400/30 text-amber-300 font-black text-xs uppercase flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">CHAMPIONSHIP</span> LEADERBOARD
          </div>
        </div>
      </header>

      {!isLive && !isTournamentOver ? (
        <div className="relative z-10 my-auto w-full max-w-xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-300 border border-amber-400/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="text-[10px] font-bold tracking-[0.3em] text-amber-400 uppercase mb-2 opacity-80">
            eSports Tournament Arena
          </div>
          <h2 className="text-3xl font-black text-white mb-2">LIVE CLASSROOM TOURNAMENT</h2>
          <p className="text-xs text-slate-300/80 max-w-md mb-6 leading-relaxed">
            All connected Mind Sport hardware units receive identical flashcard questions simultaneously. Ranked live by
            Score, Reaction Speed, and Accuracy!
          </p>

          {/* Speed Info Badge (Locked by Admin) */}
          <div className="w-full mb-6 p-3.5 rounded-2xl bg-slate-950/80 border border-amber-400/30 flex items-center justify-between">
            <div className="flex items-center gap-3 text-right">
              <span className="text-2xl">{speedInfo.icon}</span>
              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>سرعة البطولة المعتمدة: {speedInfo.displayNameAr}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" />
                    محددة من المشرف
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  معدل وميض الرقم: <span className="text-amber-300 font-bold">{speedInfo.effectiveFlashMs}ms</span>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              LOCKED
            </div>
          </div>

          <button
            onClick={startChampionship}
            className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            JOIN CHAMPIONSHIP
          </button>
        </div>
      ) : isTournamentOver ? (
        <MatchResultsModal
          playerName="CHAMPIONSHIP RESULT"
          score={userScore}
          timeSeconds={(totalRounds * 3.8).toFixed(2)}
          totalQuestions={totalRounds}
          correctCount={Math.max(1, totalRounds - userMistakes)}
          wrongCount={userMistakes}
          notAnsweredCount={0}
          onRetry={startChampionship}
          onMenu={onBackToMenu}
        />
      ) : (
        /* Tournament Active Arena */
        <div className="relative z-10 w-full max-w-7xl flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 my-auto items-stretch pt-2 sm:pt-4">
          {/* Machine Arena (2 cols) */}
          <div className="lg:col-span-2 flex flex-col justify-between h-full min-h-[320px]">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 sm:p-4 rounded-2xl flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                ROUND {currentRound + 1} / {totalRounds}
              </span>
              <span className="text-lg sm:text-xl font-black text-white">{userScore} PTS</span>
            </div>

            <div className="flex-1 h-[450px] sm:h-[520px] md:h-[580px] max-h-[72vh]">
              <ThreeBoxingMachine
                theme="olympic-gold"
                activeToken={activeToken}
                userInputDigits={userDigits}
                comboCount={userScore > 0 ? 2 : 1}
                timeRemaining={6}
                timeMax={8}
                onPunchDigit={handlePunchDigit}
                labelTitle="TOURNAMENT HARDWARE UNIT #01"
                interactive={!isShowingSeq}
              />
            </div>
          </div>

          {/* Live Leaderboard Ticker (1 col) */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                LIVE TOURNAMENT RANKINGS
              </h3>

              <div className="space-y-2 max-h-[300px] sm:max-h-[360px] overflow-y-auto pr-1">
                {competitors.map((c, idx) => (
                  <div
                    key={c.id}
                    className={`p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between transition-all backdrop-blur-md ${
                      c.id === 'usr'
                        ? 'bg-amber-400/20 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl font-black text-[11px] sm:text-xs flex items-center justify-center ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-950'
                            : idx === 2
                            ? 'bg-amber-600 text-white'
                            : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{c.name}</div>
                        <div className="text-[10px] text-slate-400">{c.school}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-black text-amber-300">{c.score}</div>
                      <div className="text-[10px] text-slate-500">{c.timeMs}ms</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {isTournamentOver && (
              <button
                onClick={startChampionship}
                className="mt-6 w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              >
                PLAY AGAIN
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
