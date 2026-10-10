import { Question, FlashCardToken } from '../types';

/**
 * Normalizes any flashcard prompt sequence according to Mind Sport rules:
 * 1. Positive numbers do NOT display a '+' sign (e.g., '5', '48').
 * 2. Negative/subtraction numbers have an underscore prefix '_' attached directly (e.g., '_2', '_74').
 * 3. Standalone '+' or '-' operator tokens are converted/merged into signed number tokens.
 */
export function normalizePromptSeq(seq: FlashCardToken[]): FlashCardToken[] {
  const result: FlashCardToken[] = [];
  let pendingMinus = false;

  for (const token of seq) {
    if (token.type === 'operator') {
      if (token.value === '-') {
        pendingMinus = true;
      }
      // '+' operator tokens are ignored/dropped
      continue;
    }

    let val = (token.value || '').trim();
    if (val.startsWith('+')) {
      val = val.substring(1).trim();
    }

    if (pendingMinus || val.startsWith('-') || val.startsWith('_')) {
      if (val.startsWith('-') || val.startsWith('_')) {
        val = val.substring(1).trim();
      }
      val = `-${val}`;
      pendingMinus = false;
    }

    if (val) {
      result.push({
        type: 'number',
        value: val,
      });
    }
  }

  return result;
}

// 20 Exact Questions for Level 1 Complex extracted from the official competition sheet (2D 4R)
export const TALMAS_LEVEL_1_BANK: Omit<Question, 'id'>[] = [
  // --- Table 1 (Top Table): Columns A to J ---
  {
    displayTitle: 'TALMAS Level 1 Complex - Drill 1A',
    promptSeq: [
      { type: 'number', value: '48' },
      { type: 'number', value: '51' },
      { type: 'number', value: '-74' },
      { type: 'number', value: '22' },
    ],
    answer: '47',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Complex - Drill 1B',
    promptSeq: [
      { type: 'number', value: '64' },
      { type: 'number', value: '-52' },
      { type: 'number', value: '76' },
      { type: 'number', value: '-65' },
    ],
    answer: '23',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Complex - Drill 1C',
    promptSeq: [
      { type: 'number', value: '67' },
      { type: 'number', value: '-56' },
      { type: 'number', value: '28' },
      { type: 'number', value: '-19' },
    ],
    answer: '20',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Complex - Drill 1D',
    promptSeq: [
      { type: 'number', value: '73' },
      { type: 'number', value: '26' },
      { type: 'number', value: '-64' },
      { type: 'number', value: '12' },
    ],
    answer: '47',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Complex - Drill 1E',
    promptSeq: [
      { type: 'number', value: '92' },
      { type: 'number', value: '-61' },
      { type: 'number', value: '58' },
      { type: 'number', value: '-27' },
    ],
    answer: '62',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Complex - Drill 1F',
    promptSeq: [
      { type: 'number', value: '78' },
      { type: 'number', value: '-65' },
      { type: 'number', value: '86' },
      { type: 'number', value: '-73' },
    ],
    answer: '26',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Complex - Drill 1G',
    promptSeq: [
      { type: 'number', value: '88' },
      { type: 'number', value: '-13' },
      { type: 'number', value: '-65' },
      { type: 'number', value: '76' },
    ],
    answer: '86',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Complex - Drill 1H',
    promptSeq: [
      { type: 'number', value: '69' },
      { type: 'number', value: '20' },
      { type: 'number', value: '-72' },
      { type: 'number', value: '21' },
    ],
    answer: '38',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Complex - Drill 1I',
    promptSeq: [
      { type: 'number', value: '62' },
      { type: 'number', value: '26' },
      { type: 'number', value: '-13' },
      { type: 'number', value: '-65' },
    ],
    answer: '10',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Complex - Drill 1J',
    promptSeq: [
      { type: 'number', value: '62' },
      { type: 'number', value: '35' },
      { type: 'number', value: '-66' },
      { type: 'number', value: '17' },
    ],
    answer: '48',
    timeLimitSeconds: 15,
  },
  // --- Table 2 (Bottom Table): Columns A to J ---
  {
    displayTitle: 'TALMAS Level 1 Complex - Drill 2A',
    promptSeq: [
      { type: 'number', value: '92' },
      { type: 'number', value: '-41' },
      { type: 'number', value: '38' },
      { type: 'number', value: '-74' },
    ],
    answer: '15',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Complex - Drill 2B',
    promptSeq: [
      { type: 'number', value: '59' },
      { type: 'number', value: '10' },
      { type: 'number', value: '-67' },
      { type: 'number', value: '72' },
    ],
    answer: '74',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Complex - Drill 2C',
    promptSeq: [
      { type: 'number', value: '61' },
      { type: 'number', value: '25' },
      { type: 'number', value: '13' },
      { type: 'number', value: '-87' },
    ],
    answer: '12',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Complex - Drill 2D',
    promptSeq: [
      { type: 'number', value: '57' },
      { type: 'number', value: '31' },
      { type: 'number', value: '-25' },
      { type: 'number', value: '36' },
    ],
    answer: '99',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Complex - Drill 2E',
    promptSeq: [
      { type: 'number', value: '64' },
      { type: 'number', value: '25' },
      { type: 'number', value: '-34' },
      { type: 'number', value: '42' },
    ],
    answer: '97',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Complex - Drill 2F',
    promptSeq: [
      { type: 'number', value: '61' },
      { type: 'number', value: '25' },
      { type: 'number', value: '-71' },
      { type: 'number', value: '54' },
    ],
    answer: '69',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Complex - Drill 2G',
    promptSeq: [
      { type: 'number', value: '74' },
      { type: 'number', value: '25' },
      { type: 'number', value: '-48' },
      { type: 'number', value: '26' },
    ],
    answer: '77',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Complex - Drill 2H',
    promptSeq: [
      { type: 'number', value: '97' },
      { type: 'number', value: '-62' },
      { type: 'number', value: '54' },
      { type: 'number', value: '-15' },
    ],
    answer: '74',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Complex - Drill 2I',
    promptSeq: [
      { type: 'number', value: '97' },
      { type: 'number', value: '-45' },
      { type: 'number', value: '31' },
      { type: 'number', value: '15' },
    ],
    answer: '98',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Complex - Drill 2J',
    promptSeq: [
      { type: 'number', value: '74' },
      { type: 'number', value: '-23' },
      { type: 'number', value: '37' },
      { type: 'number', value: '-15' },
    ],
    answer: '73',
    timeLimitSeconds: 15,
  },
];

/**
 * Unbiased Fisher-Yates (Knuth) algorithm for shuffling arrays.
 * Guarantees every permutation is equally likely (1 / N!).
 */
export function shuffleArray<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

// Memory of previously served indices across rounds to prevent repetition on replay
let recentLevel1ComplexIndices: number[] = [];

/**
 * Returns 5 randomly selected questions from the 20-question TALMAS Level 1 bank (2D 4R abacus competition) without replacement.
 * This is used for Level 1 Complex / Advanced mode (المستوى الأول - الوضع المتقدم).
 */
export function getLevel1ComplexQuestions(count = 5): Question[] {
  const total = TALMAS_LEVEL_1_BANK.length;
  const allIndices = Array.from({ length: total }, (_, i) => i);
  let candidates = allIndices.filter((idx) => !recentLevel1ComplexIndices.includes(idx));
  if (candidates.length < count) {
    recentLevel1ComplexIndices = [];
    candidates = allIndices;
  }

  const shuffledCandidates = shuffleArray(candidates);
  const pickedIndices = shuffledCandidates.slice(0, Math.min(count, total));
  recentLevel1ComplexIndices = [...recentLevel1ComplexIndices, ...pickedIndices];

  return pickedIndices.map((origIdx, idx) => {
    const q = TALMAS_LEVEL_1_BANK[origIdx];
    return {
      ...q,
      promptSeq: convertPromptSeqToTerms(q.promptSeq),
      id: `talmas_lvl1_complex_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${origIdx}_${idx}`,
      displayTitle: `المستوى 1 (متقدم) • مسألة #${origIdx + 1} (سؤال ${idx + 1} من ${pickedIndices.length})`,
    };
  });
}

// 20 Exact 1D 5R Questions extracted from Page 3 of the attached TALMAS PDF (Level 1 Easy / المستوى السهل)
export const TALMAS_LEVEL_1_EASY_BANK: Omit<Question, 'id'>[] = [
  {
    displayTitle: 'TALMAS Level 1 Easy - Drill 1A',
    promptSeq: [
      { type: 'number', value: '5' },
      { type: 'number', value: '3' },
      { type: 'number', value: '-6' },
      { type: 'number', value: '1' },
      { type: 'number', value: '-2' },
    ],
    answer: '1',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Easy - Drill 1B',
    promptSeq: [
      { type: 'number', value: '7' },
      { type: 'number', value: '1' },
      { type: 'number', value: '-3' },
      { type: 'number', value: '2' },
      { type: 'number', value: '-5' },
    ],
    answer: '2',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Easy - Drill 1C',
    promptSeq: [
      { type: 'number', value: '8' },
      { type: 'number', value: '-5' },
      { type: 'number', value: '-1' },
      { type: 'number', value: '7' },
      { type: 'number', value: '-6' },
    ],
    answer: '3',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Easy - Drill 1D',
    promptSeq: [
      { type: 'number', value: '4' },
      { type: 'number', value: '-2' },
      { type: 'number', value: '7' },
      { type: 'number', value: '-8' },
      { type: 'number', value: '6' },
    ],
    answer: '7',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Easy - Drill 1E',
    promptSeq: [
      { type: 'number', value: '7' },
      { type: 'number', value: '-5' },
      { type: 'number', value: '2' },
      { type: 'number', value: '-1' },
      { type: 'number', value: '6' },
    ],
    answer: '9',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Easy - Drill 1F',
    promptSeq: [
      { type: 'number', value: '3' },
      { type: 'number', value: '-1' },
      { type: 'number', value: '7' },
      { type: 'number', value: '-4' },
      { type: 'number', value: '2' },
    ],
    answer: '7',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Easy - Drill 1G',
    promptSeq: [
      { type: 'number', value: '6' },
      { type: 'number', value: '-1' },
      { type: 'number', value: '2' },
      { type: 'number', value: '-5' },
      { type: 'number', value: '6' },
    ],
    answer: '8',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Easy - Drill 1H',
    promptSeq: [
      { type: 'number', value: '7' },
      { type: 'number', value: '-5' },
      { type: 'number', value: '6' },
      { type: 'number', value: '-1' },
      { type: 'number', value: '-2' },
    ],
    answer: '5',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Easy - Drill 1I',
    promptSeq: [
      { type: 'number', value: '7' },
      { type: 'number', value: '-2' },
      { type: 'number', value: '3' },
      { type: 'number', value: '-6' },
      { type: 'number', value: '1' },
    ],
    answer: '3',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Easy - Drill 1J',
    promptSeq: [
      { type: 'number', value: '9' },
      { type: 'number', value: '-7' },
      { type: 'number', value: '5' },
      { type: 'number', value: '-2' },
      { type: 'number', value: '4' },
    ],
    answer: '9',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Easy - Drill 2A',
    promptSeq: [
      { type: 'number', value: '7' },
      { type: 'number', value: '-5' },
      { type: 'number', value: '2' },
      { type: 'number', value: '-1' },
      { type: 'number', value: '6' },
    ],
    answer: '9',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Easy - Drill 2B',
    promptSeq: [
      { type: 'number', value: '5' },
      { type: 'number', value: '2' },
      { type: 'number', value: '-6' },
      { type: 'number', value: '1' },
      { type: 'number', value: '7' },
    ],
    answer: '9',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Easy - Drill 2C',
    promptSeq: [
      { type: 'number', value: '9' },
      { type: 'number', value: '-4' },
      { type: 'number', value: '2' },
      { type: 'number', value: '-6' },
      { type: 'number', value: '-1' },
    ],
    answer: '0',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Easy - Drill 2D',
    promptSeq: [
      { type: 'number', value: '7' },
      { type: 'number', value: '-5' },
      { type: 'number', value: '6' },
      { type: 'number', value: '-5' },
      { type: 'number', value: '1' },
    ],
    answer: '4',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Easy - Drill 2E',
    promptSeq: [
      { type: 'number', value: '5' },
      { type: 'number', value: '2' },
      { type: 'number', value: '1' },
      { type: 'number', value: '-6' },
      { type: 'number', value: '7' },
    ],
    answer: '9',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Easy - Drill 2F',
    promptSeq: [
      { type: 'number', value: '6' },
      { type: 'number', value: '-5' },
      { type: 'number', value: '8' },
      { type: 'number', value: '-4' },
      { type: 'number', value: '2' },
    ],
    answer: '7',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Easy - Drill 2G',
    promptSeq: [
      { type: 'number', value: '4' },
      { type: 'number', value: '-2' },
      { type: 'number', value: '6' },
      { type: 'number', value: '-1' },
      { type: 'number', value: '-2' },
    ],
    answer: '5',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Easy - Drill 2H',
    promptSeq: [
      { type: 'number', value: '6' },
      { type: 'number', value: '1' },
      { type: 'number', value: '-2' },
      { type: 'number', value: '4' },
      { type: 'number', value: '-8' },
    ],
    answer: '1',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Easy - Drill 2I',
    promptSeq: [
      { type: 'number', value: '9' },
      { type: 'number', value: '-4' },
      { type: 'number', value: '2' },
      { type: 'number', value: '-6' },
      { type: 'number', value: '3' },
    ],
    answer: '4',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 Easy - Drill 2J',
    promptSeq: [
      { type: 'number', value: '8' },
      { type: 'number', value: '-1' },
      { type: 'number', value: '-2' },
      { type: 'number', value: '3' },
      { type: 'number', value: '-2' },
    ],
    answer: '6',
    timeLimitSeconds: 15,
  },
];

/**
 * Converts a question prompt sequence into standardized flashcard terms:
 * - Omits '+' signs completely for positive terms (e.g., '5', '3')
 * - Prefixes subtractive/negative terms with minus sign '-' before the number (e.g., '-2', '-6')
 * - Omits standalone '+' operator tokens
 */
export function convertPromptSeqToTerms(seq: FlashCardToken[]): FlashCardToken[] {
  if (!seq || seq.length === 0) return [];
  const terms: FlashCardToken[] = [];
  let currentOp: '+' | '-' = '+';

  for (const token of seq) {
    if (token.type === 'operator') {
      currentOp = token.value === '-' ? '-' : '+';
    } else {
      let numStr = (token.value || '').trim();
      if (numStr.startsWith('+')) {
        numStr = numStr.slice(1).trim();
      } else if (numStr.startsWith('-')) {
        currentOp = '-';
        numStr = numStr.slice(1).trim();
      } else if (numStr.startsWith('_')) {
        currentOp = '-';
        numStr = numStr.slice(1).trim();
      }

      const formattedValue = currentOp === '-' ? `-${numStr}` : numStr;
      terms.push({
        type: 'number',
        value: formattedValue,
      });

      currentOp = '+';
    }
  }

  return terms;
}

/**
 * Formats a prompt sequence into a clean space-separated string (e.g., "5 3 -6 1 -2")
 */
export function formatPromptSequenceText(seq: FlashCardToken[]): string {
  const terms = convertPromptSeqToTerms(seq);
  return terms.map((t) => t.value).join(' ');
}

// 20 Exact Questions for Level 0 (Starter / 1D 5R Excel Drill sheet)
// Organized as an Excel sheet where each row is a question drill:
// Columns B, C, D, E, F represent the sequential flash numbers.
// Column G represents the verified final sum (Answer).
export const TALMAS_LEVEL_0_BANK: Omit<Question, 'id'>[] = [
  // --- Table 1: Drills 01 to 10 ---
  {
    displayTitle: 'Level 0 Starter - Drill 01',
    promptSeq: [
      { type: 'number', value: '2' },
      { type: 'number', value: '2' },
      { type: 'number', value: '-1' },
      { type: 'number', value: '5' },
      { type: 'number', value: '-3' },
    ],
    answer: '5',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'Level 0 Starter - Drill 02',
    promptSeq: [
      { type: 'number', value: '1' },
      { type: 'number', value: '3' },
      { type: 'number', value: '5' },
      { type: 'number', value: '-2' },
      { type: 'number', value: '1' },
    ],
    answer: '8',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'Level 0 Starter - Drill 03',
    promptSeq: [
      { type: 'number', value: '4' },
      { type: 'number', value: '-2' },
      { type: 'number', value: '1' },
      { type: 'number', value: '5' },
      { type: 'number', value: '-3' },
    ],
    answer: '5',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'Level 0 Starter - Drill 04',
    promptSeq: [
      { type: 'number', value: '3' },
      { type: 'number', value: '1' },
      { type: 'number', value: '-2' },
      { type: 'number', value: '5' },
      { type: 'number', value: '2' },
    ],
    answer: '9',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'Level 0 Starter - Drill 05',
    promptSeq: [
      { type: 'number', value: '2' },
      { type: 'number', value: '5' },
      { type: 'number', value: '1' },
      { type: 'number', value: '-3' },
      { type: 'number', value: '4' },
    ],
    answer: '9',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'Level 0 Starter - Drill 06',
    promptSeq: [
      { type: 'number', value: '1' },
      { type: 'number', value: '2' },
      { type: 'number', value: '5' },
      { type: 'number', value: '-1' },
      { type: 'number', value: '-2' },
    ],
    answer: '5',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'Level 0 Starter - Drill 07',
    promptSeq: [
      { type: 'number', value: '4' },
      { type: 'number', value: '5' },
      { type: 'number', value: '-3' },
      { type: 'number', value: '2' },
      { type: 'number', value: '-1' },
    ],
    answer: '7',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'Level 0 Starter - Drill 08',
    promptSeq: [
      { type: 'number', value: '3' },
      { type: 'number', value: '-1' },
      { type: 'number', value: '2' },
      { type: 'number', value: '5' },
      { type: 'number', value: '-4' },
    ],
    answer: '5',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'Level 0 Starter - Drill 09',
    promptSeq: [
      { type: 'number', value: '2' },
      { type: 'number', value: '2' },
      { type: 'number', value: '-3' },
      { type: 'number', value: '5' },
      { type: 'number', value: '3' },
    ],
    answer: '9',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'Level 0 Starter - Drill 10',
    promptSeq: [
      { type: 'number', value: '1' },
      { type: 'number', value: '1' },
      { type: 'number', value: '2' },
      { type: 'number', value: '5' },
      { type: 'number', value: '-4' },
    ],
    answer: '5',
    timeLimitSeconds: 15,
  },
  // --- Table 2: Drills 11 to 20 ---
  {
    displayTitle: 'Level 0 Starter - Drill 11',
    promptSeq: [
      { type: 'number', value: '4' },
      { type: 'number', value: '-3' },
      { type: 'number', value: '2' },
      { type: 'number', value: '5' },
      { type: 'number', value: '1' },
    ],
    answer: '9',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'Level 0 Starter - Drill 12',
    promptSeq: [
      { type: 'number', value: '3' },
      { type: 'number', value: '5' },
      { type: 'number', value: '-2' },
      { type: 'number', value: '1' },
      { type: 'number', value: '-2' },
    ],
    answer: '5',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'Level 0 Starter - Drill 13',
    promptSeq: [
      { type: 'number', value: '2' },
      { type: 'number', value: '1' },
      { type: 'number', value: '5' },
      { type: 'number', value: '-3' },
      { type: 'number', value: '4' },
    ],
    answer: '9',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'Level 0 Starter - Drill 14',
    promptSeq: [
      { type: 'number', value: '1' },
      { type: 'number', value: '3' },
      { type: 'number', value: '-2' },
      { type: 'number', value: '5' },
      { type: 'number', value: '1' },
    ],
    answer: '8',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'Level 0 Starter - Drill 15',
    promptSeq: [
      { type: 'number', value: '4' },
      { type: 'number', value: '-1' },
      { type: 'number', value: '5' },
      { type: 'number', value: '-3' },
      { type: 'number', value: '2' },
    ],
    answer: '7',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'Level 0 Starter - Drill 16',
    promptSeq: [
      { type: 'number', value: '2' },
      { type: 'number', value: '2' },
      { type: 'number', value: '5' },
      { type: 'number', value: '-4' },
      { type: 'number', value: '1' },
    ],
    answer: '6',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'Level 0 Starter - Drill 17',
    promptSeq: [
      { type: 'number', value: '3' },
      { type: 'number', value: '1' },
      { type: 'number', value: '5' },
      { type: 'number', value: '-2' },
      { type: 'number', value: '-1' },
    ],
    answer: '6',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'Level 0 Starter - Drill 18',
    promptSeq: [
      { type: 'number', value: '1' },
      { type: 'number', value: '4' },
      { type: 'number', value: '-3' },
      { type: 'number', value: '2' },
      { type: 'number', value: '5' },
    ],
    answer: '9',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'Level 0 Starter - Drill 19',
    promptSeq: [
      { type: 'number', value: '2' },
      { type: 'number', value: '5' },
      { type: 'number', value: '-1' },
      { type: 'number', value: '3' },
      { type: 'number', value: '-4' },
    ],
    answer: '5',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'Level 0 Starter - Drill 20',
    promptSeq: [
      { type: 'number', value: '4' },
      { type: 'number', value: '-2' },
      { type: 'number', value: '1' },
      { type: 'number', value: '5' },
      { type: 'number', value: '-3' },
    ],
    answer: '5',
    timeLimitSeconds: 15,
  },
];

// History of previously served question indices for Level 0 across rounds & replays
let recentLevel0Indices: number[] = [];

/**
 * Returns count randomly selected questions from the 20-question TALMAS Level 0 bank (1D 5R) without replacement.
 * Uses unbiased Fisher-Yates shuffling and maintains replay memory so that consecutive games
 * (e.g. clicking "إعادة اللعب" or starting a new drill) draw different questions and in completely different order.
 */
export function getLevel0StandardQuestions(count = 5): Question[] {
  const total = TALMAS_LEVEL_0_BANK.length;
  const allIndices = Array.from({ length: total }, (_, i) => i);

  // Available indices excluding those served in the immediately preceding game
  let candidates = allIndices.filter((idx) => !recentLevel0Indices.includes(idx));

  // If not enough candidate questions remain to satisfy count, reset recent pool and shuffle all
  if (candidates.length < count) {
    recentLevel0Indices = [];
    candidates = allIndices;
  }

  // Shuffle candidate pool using Fisher-Yates
  const shuffledCandidates = shuffleArray(candidates);
  const pickedIndices = shuffledCandidates.slice(0, Math.min(count, total));

  // Remember picked indices to exclude in the next round/replay
  recentLevel0Indices = [...recentLevel0Indices, ...pickedIndices];
  if (recentLevel0Indices.length >= total) {
    recentLevel0Indices = [...pickedIndices];
  }

  return pickedIndices.map((origIdx, orderIdx) => {
    const q = TALMAS_LEVEL_0_BANK[origIdx];
    const drillNum = String(origIdx + 1).padStart(2, '0');
    return {
      ...q,
      promptSeq: convertPromptSeqToTerms(q.promptSeq),
      id: `talmas_lvl0_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_drill${drillNum}_${orderIdx}`,
      displayTitle: `المستوى 0 • تدريب #${drillNum} (سؤال ${orderIdx + 1} من ${pickedIndices.length})`,
    };
  });
}

export function getLevel0Questions(count = 5, _isComplex = false): Question[] {
  return getLevel0StandardQuestions(count);
}

// Memory of previously served indices across rounds for Level 1 Easy
let recentLevel1EasyIndices: number[] = [];

/**
 * Returns 5 randomly selected questions from the 20-question TALMAS Easy bank (1D 5R) without replacement.
 * Used for Level 1 Standard / Easy mode (المستوى الأول - الوضع السهل).
 */
export function getLevel1StandardQuestions(count = 5): Question[] {
  const total = TALMAS_LEVEL_1_EASY_BANK.length;
  const allIndices = Array.from({ length: total }, (_, i) => i);

  let candidates = allIndices.filter((idx) => !recentLevel1EasyIndices.includes(idx));
  if (candidates.length < count) {
    recentLevel1EasyIndices = [];
    candidates = allIndices;
  }

  const shuffledCandidates = shuffleArray(candidates);
  const pickedIndices = shuffledCandidates.slice(0, Math.min(count, total));

  recentLevel1EasyIndices = [...recentLevel1EasyIndices, ...pickedIndices];
  if (recentLevel1EasyIndices.length >= total) {
    recentLevel1EasyIndices = [...pickedIndices];
  }

  return pickedIndices.map((origIdx, orderIdx) => {
    const q = TALMAS_LEVEL_1_EASY_BANK[origIdx];
    return {
      ...q,
      promptSeq: convertPromptSeqToTerms(q.promptSeq),
      id: `talmas_lvl1_easy_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${origIdx}_${orderIdx}`,
      displayTitle: `المستوى 1 (سهل) • مسألة #${origIdx + 1} (سؤال ${orderIdx + 1} من ${pickedIndices.length})`,
    };
  });
}

// Backward-compatible alias
export function getLevel1Questions(count = 5, isComplex = false): Question[] {
  return isComplex ? getLevel1ComplexQuestions(count) : getLevel1StandardQuestions(count);
}

/**
 * General Question Selector supporting Level 0 (Starter), Level 1 (TALMAS) and other procedural levels.
 */
export function fetchQuestionsForLevel(level: number, isComplex = false, count = 5): Question[] {
  if (level === 0) {
    return getLevel0Questions(count, isComplex);
  }
  if (level === 1) {
    return isComplex ? getLevel1ComplexQuestions(count) : getLevel1StandardQuestions(count);
  }

  // Procedural levels for level >= 2
  return Array.from({ length: count }, (_, i) => {
    const numbersCount = isComplex ? 5 : 3;
    const seq: FlashCardToken[] = [];
    let currentAns = Math.floor(Math.random() * (level * 10 + 10)) + 5;
    seq.push({ type: 'number', value: String(currentAns) });

    for (let k = 1; k < numbersCount; k++) {
      const op = isComplex && k % 2 === 0 ? '-' : '+';
      const num = Math.floor(Math.random() * (level * 8 + 5)) + 1;
      if (op === '+') {
        currentAns += num;
      } else {
        if (currentAns - num < 1) {
          currentAns += num;
          seq.push({ type: 'operator', value: '+' });
        } else {
          currentAns -= num;
          seq.push({ type: 'operator', value: '-' });
        }
        seq.push({ type: 'number', value: String(num) });
        continue;
      }
      seq.push({ type: 'operator', value: op });
      seq.push({ type: 'number', value: String(num) });
    }

    return {
      id: `gen_lvl${level}_${Date.now()}_${i}`,
      displayTitle: `Level ${level} • Question ${i + 1}`,
      promptSeq: convertPromptSeqToTerms(seq),
      answer: String(currentAns),
      timeLimitSeconds: isComplex ? 12 : 18,
    };
  });
}
