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

// 20 Exact Questions extracted from TALMAS Abacus Competition PDF
export const TALMAS_LEVEL_1_BANK: Omit<Question, 'id'>[] = [
  {
    displayTitle: 'TALMAS Level 1 - Drill 1A',
    promptSeq: [
      { type: 'number', value: '48' },
      { type: 'number', value: '51' },
      { type: 'number', value: '-74' },
      { type: 'number', value: '22' },
      { type: 'number', value: '10' },
    ],
    answer: '57',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 - Drill 1B',
    promptSeq: [
      { type: 'number', value: '64' },
      { type: 'number', value: '-52' },
      { type: 'number', value: '76' },
      { type: 'number', value: '-65' },
      { type: 'number', value: '12' },
    ],
    answer: '35',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 - Drill 1C',
    promptSeq: [
      { type: 'number', value: '67' },
      { type: 'number', value: '-56' },
      { type: 'number', value: '28' },
      { type: 'number', value: '-19' },
      { type: 'number', value: '15' },
    ],
    answer: '35',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 - Drill 1D',
    promptSeq: [
      { type: 'number', value: '73' },
      { type: 'number', value: '26' },
      { type: 'number', value: '-64' },
      { type: 'number', value: '12' },
      { type: 'number', value: '20' },
    ],
    answer: '67',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 - Drill 1E',
    promptSeq: [
      { type: 'number', value: '92' },
      { type: 'number', value: '-61' },
      { type: 'number', value: '58' },
      { type: 'number', value: '-27' },
      { type: 'number', value: '11' },
    ],
    answer: '73',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 - Drill 1F',
    promptSeq: [
      { type: 'number', value: '78' },
      { type: 'number', value: '-65' },
      { type: 'number', value: '86' },
      { type: 'number', value: '-73' },
      { type: 'number', value: '25' },
    ],
    answer: '51',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 - Drill 1G',
    promptSeq: [
      { type: 'number', value: '88' },
      { type: 'number', value: '-13' },
      { type: 'number', value: '-65' },
      { type: 'number', value: '76' },
      { type: 'number', value: '10' },
    ],
    answer: '96',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 - Drill 1H',
    promptSeq: [
      { type: 'number', value: '69' },
      { type: 'number', value: '20' },
      { type: 'number', value: '-72' },
      { type: 'number', value: '21' },
      { type: 'number', value: '15' },
    ],
    answer: '53',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 - Drill 1I',
    promptSeq: [
      { type: 'number', value: '62' },
      { type: 'number', value: '26' },
      { type: 'number', value: '-13' },
      { type: 'number', value: '-65' },
      { type: 'number', value: '30' },
    ],
    answer: '40',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 - Drill 1J',
    promptSeq: [
      { type: 'number', value: '62' },
      { type: 'number', value: '35' },
      { type: 'number', value: '-66' },
      { type: 'number', value: '17' },
      { type: 'number', value: '21' },
    ],
    answer: '69',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 - Drill 2A',
    promptSeq: [
      { type: 'number', value: '92' },
      { type: 'number', value: '-41' },
      { type: 'number', value: '38' },
      { type: 'number', value: '-74' },
      { type: 'number', value: '20' },
    ],
    answer: '35',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 - Drill 2B',
    promptSeq: [
      { type: 'number', value: '59' },
      { type: 'number', value: '10' },
      { type: 'number', value: '-67' },
      { type: 'number', value: '72' },
      { type: 'number', value: '11' },
    ],
    answer: '85',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 - Drill 2C',
    promptSeq: [
      { type: 'number', value: '61' },
      { type: 'number', value: '25' },
      { type: 'number', value: '13' },
      { type: 'number', value: '-87' },
      { type: 'number', value: '40' },
    ],
    answer: '52',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 - Drill 2D',
    promptSeq: [
      { type: 'number', value: '57' },
      { type: 'number', value: '31' },
      { type: 'number', value: '-25' },
      { type: 'number', value: '36' },
      { type: 'number', value: '10' },
    ],
    answer: '109',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 - Drill 2E',
    promptSeq: [
      { type: 'number', value: '64' },
      { type: 'number', value: '25' },
      { type: 'number', value: '-34' },
      { type: 'number', value: '42' },
      { type: 'number', value: '12' },
    ],
    answer: '109',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 - Drill 2F',
    promptSeq: [
      { type: 'number', value: '61' },
      { type: 'number', value: '25' },
      { type: 'number', value: '-71' },
      { type: 'number', value: '54' },
      { type: 'number', value: '15' },
    ],
    answer: '84',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 - Drill 2G',
    promptSeq: [
      { type: 'number', value: '74' },
      { type: 'number', value: '25' },
      { type: 'number', value: '-48' },
      { type: 'number', value: '26' },
      { type: 'number', value: '13' },
    ],
    answer: '90',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 - Drill 2H',
    promptSeq: [
      { type: 'number', value: '97' },
      { type: 'number', value: '-62' },
      { type: 'number', value: '54' },
      { type: 'number', value: '-15' },
      { type: 'number', value: '20' },
    ],
    answer: '94',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 - Drill 2I',
    promptSeq: [
      { type: 'number', value: '97' },
      { type: 'number', value: '-45' },
      { type: 'number', value: '31' },
      { type: 'number', value: '15' },
      { type: 'number', value: '-60' },
    ],
    answer: '38',
    timeLimitSeconds: 15,
  },
  {
    displayTitle: 'TALMAS Level 1 - Drill 2J',
    promptSeq: [
      { type: 'number', value: '74' },
      { type: 'number', value: '-23' },
      { type: 'number', value: '37' },
      { type: 'number', value: '-15' },
      { type: 'number', value: '12' },
    ],
    answer: '85',
    timeLimitSeconds: 15,
  },
];

/**
 * Returns 5 randomly selected questions from the 20-question TALMAS Level 1 bank (2D 4R abacus competition) without replacement.
 * This is used for Level 1 Complex / Advanced mode (المستوى الأول - الوضع المتقدم).
 */
export function getLevel1ComplexQuestions(count = 5): Question[] {
  // Shuffle copy of bank
  const shuffled = [...TALMAS_LEVEL_1_BANK].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((q, idx) => ({
    ...q,
    promptSeq: convertPromptSeqToTerms(q.promptSeq),
    id: `talmas_lvl1_complex_${Date.now()}_${idx}`,
    displayTitle: `Level 1 (Complex) • Question ${idx + 1} of ${selected.length}`,
  }));
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

/**
 * Returns 5 randomly selected questions from the 20-question TALMAS Easy bank (1D 5R) without replacement.
 * Used for Level 1 Standard / Easy mode (المستوى الأول - الوضع السهل).
 */
export function getLevel1StandardQuestions(count = 5): Question[] {
  const shuffled = [...TALMAS_LEVEL_1_EASY_BANK].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((q, idx) => ({
    ...q,
    promptSeq: convertPromptSeqToTerms(q.promptSeq),
    id: `talmas_lvl1_easy_${Date.now()}_${idx}`,
    displayTitle: `Level 1 Easy • Question ${idx + 1} of ${selected.length}`,
  }));
}

// Backward-compatible alias
export function getLevel1Questions(count = 5, isComplex = false): Question[] {
  return isComplex ? getLevel1ComplexQuestions(count) : getLevel1StandardQuestions(count);
}

/**
 * General Question Selector supporting Level 1 TALMAS and other procedural levels.
 */
export function fetchQuestionsForLevel(level: number, isComplex = false, count = 5): Question[] {
  if (level === 1 || level === 0) {
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
