export type GameMode = 'main-menu' | 'single-player' | 'two-player' | 'competition' | 'teacher-dashboard' | 'device-showcase';

export type SinglePlayerSubMode = 'practice' | 'training' | 'career' | 'free-play';

export interface FlashCardToken {
  type: 'number' | 'operator';
  value: string;
}

export interface Question {
  id: string;
  displayTitle: string;
  promptSeq: FlashCardToken[];
  answer: string;
  timeLimitSeconds: number;
}

export interface StudentLog {
  id: string;
  questionId: string;
  promptText: string;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpentMs: number;
  timestamp: string;
}

export interface StudentRecord {
  id: string;
  name: string;
  grade: string;
  totalGames: number;
  highestScore: number;
  avgAccuracyPercent: number;
  avgResponseMs: number;
  currentLevel: number;
  isComplex: boolean;
  logs: StudentLog[];
}

export interface Competitor {
  id: string;
  name: string;
  school: string;
  score: number;
  accuracy: number;
  timeMs: number;
  mistakes: number;
  currentQuestionIndex: number;
  isFinished: boolean;
  avatarUrl?: string;
  status: 'active' | 'finished' | 'punching';
}

export type LEDTheme = 'cyber-neon' | 'olympic-gold' | 'laser-purple' | 'emerald-boost' | 'fire-red';

export interface SoundSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  narrationEnabled: boolean;
}

export interface AdminSettings {
  gameSpeedMultiplier: number;
  flashIntervalMs: number;
  timeLimitSeconds: number;
  targetLevel: number;
  isComplexMode: boolean;
  questionCount: number;
  autoAdvanceDelayMs: number;
}

