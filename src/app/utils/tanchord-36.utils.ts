// TanChord 36 V2 maps 5 pairs of Bopomofo symbols to a single physical key
// (encoded in tangent-cc-lib's keyboard layout data as a combined 2-symbol
// string, e.g. "ㄍㄐ"). Disambiguation rules, from
// https://andy23512.github.io/blog/tangent-s-progress-for-finding-a-bopomofo-solution-on-master-forge/#A-TanChord-36-symbol-choosing-rules :
//
// - ㄍ-ㄐ, ㄎ-ㄑ, ㄏ-ㄒ, ㄜ-ㄝ: choose the second symbol when the buffer's
//   medial is ㄧ or ㄩ (the first symbol never combines with those medials),
//   otherwise choose the first symbol.
// - ㄥ-ㄦ: ㄦ never combines with any consonant or medial, so choose ㄥ when
//   the buffer already has a consonant or medial, otherwise choose ㄦ.
//
// Because the rule depends on the rest of the buffer, a symbol chosen at
// keypress time can become wrong once a later keypress changes the buffer
// (e.g. picking ㄍ before a medial is typed, then needing to become ㄐ once
// ㄧ arrives). Rather than resolve once at input time, callers should keep
// the raw pair string in the buffer slot and re-resolve on every read.

const CONSONANT_PAIRS: Record<string, { withIOrU: string; otherwise: string }> = {
  ㄍㄐ: { otherwise: 'ㄍ', withIOrU: 'ㄐ' },
  ㄎㄑ: { otherwise: 'ㄎ', withIOrU: 'ㄑ' },
  ㄏㄒ: { otherwise: 'ㄏ', withIOrU: 'ㄒ' },
};

const RHYME_PAIRS: Record<string, { withIOrU: string; otherwise: string }> = {
  ㄜㄝ: { otherwise: 'ㄜ', withIOrU: 'ㄝ' },
};

const ERR_PAIR = 'ㄥㄦ';

export const TANCHORD_36_CONSONANT_PAIRS = Object.keys(CONSONANT_PAIRS);
export const TANCHORD_36_RHYME_PAIRS = [...Object.keys(RHYME_PAIRS), ERR_PAIR];

function isIOrUUmlaut(medial: string | null): boolean {
  return medial === 'ㄧ' || medial === 'ㄩ';
}

export function resolveTanChord36Consonant(
  rawConsonant: string | null,
  medial: string | null,
): string | null {
  if (rawConsonant === null) {
    return null;
  }
  const pair = CONSONANT_PAIRS[rawConsonant];
  if (!pair) {
    return rawConsonant;
  }
  return isIOrUUmlaut(medial) ? pair.withIOrU : pair.otherwise;
}

export function resolveTanChord36Rhyme(
  rawRhyme: string | null,
  consonant: string | null,
  medial: string | null,
): string | null {
  if (rawRhyme === null) {
    return null;
  }
  if (rawRhyme === ERR_PAIR) {
    return consonant !== null || medial !== null ? 'ㄥ' : 'ㄦ';
  }
  const pair = RHYME_PAIRS[rawRhyme];
  if (!pair) {
    return rawRhyme;
  }
  return isIOrUUmlaut(medial) ? pair.withIOrU : pair.otherwise;
}
