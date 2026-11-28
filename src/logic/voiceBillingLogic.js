import { smartMatch } from './erpLogic.js';

export const DEFAULT_AUDIO_REPLACEMENTS = [
  { pattern: /\bgulaab ka paudha\b/gi, replacement: 'rose' },
  { pattern: /\baam ka ped\b/gi, replacement: 'mango' },
  { pattern: /\btulsi ji\b/gi, replacement: 'tulsi' },
  { pattern: /\bphool\b/gi, replacement: 'flower' },
  { pattern: /\bdo\b/gi, replacement: '2' },
  { pattern: /\bek\b/gi, replacement: '1' },
  { pattern: /\bteen\b/gi, replacement: '3' }
];

const WORD_NUMS = {
  one: 1, 'एक': 1, two: 2, 'दो': 2, three: 3, 'तीन': 3,
  four: 4, char: 4, 'चार': 4, five: 5, paanch: 5, 'पांच': 5, ten: 10, das: 10, 'दस': 10
};
const STOP_WORDS = new Set(['add', 'bill', 'karo', 'jodo', 'daalo', 'aur', 'and', 'plus', 'pcs', 'plant', 'plants', 'जोड़ो', 'और', 'दे', 'दो', 'बिल', 'बनाओ']);

export function applyCustomPromptReplacements(transcript = '', customReplacements = []) {
  let out = String(transcript || '').trim();
  const rules = [...DEFAULT_AUDIO_REPLACEMENTS, ...customReplacements];
  for (const r of rules) {
    if (!r.pattern) continue;
    const regex = r.pattern instanceof RegExp ? r.pattern : new RegExp(String(r.pattern), 'gi');
    out = out.replace(regex, r.replacement ?? '');
  }
  return out.replace(/\s+/g, ' ').trim();
}

/**
 * Restricts auto-cart addition STRICTLY to precise full names.
 * Generic/partial spoken names (matching >1 varieties or partial token only)
 * return an ambiguity selection list so the cashier chooses the exact variety.
 */
export function resolveVoiceOrder(rawTranscript, products, customReplacements = []) {
  const normalized = applyCustomPromptReplacements(rawTranscript, customReplacements);
  const lower = normalized.toLowerCase();
  const triggerCheckout = /\b(checkout|invoice|generate bill|bill banao|बिल बनाओ)\b/i.test(lower);
  const clauses = lower.split(/\s*(?:,|and|aur|और|\+)\s*/i).filter(Boolean);

  const exactMatches = [];
  const ambiguousChoices = [];
  const unmatched = [];

  clauses.forEach((clause) => {
    const tokens = clause.replace(/[।.!?]/g, ' ').split(/\s+/).filter(Boolean);
    let qty = 1;
    const queryTokens = [];
    tokens.forEach((tk) => {
      if (/^\d+$/.test(tk)) qty = Math.max(1, parseInt(tk, 10));
      else if (WORD_NUMS[tk] !== undefined) qty = WORD_NUMS[tk];
      else if (!STOP_WORDS.has(tk)) queryTokens.push(tk);
    });

    const query = queryTokens.join(' ').trim();
    if (!query) return;

    // 1. Check strict full-name match (precise full English or full Hindi name)
    const preciseMatch = products.find(
      (p) => p.nameEn.toLowerCase() === query || (p.nameHi && p.nameHi.toLowerCase() === query)
    );
    if (preciseMatch) {
      exactMatches.push({ product: preciseMatch, qty });
      return;
    }

    // 2. Otherwise gather all matching varieties for disambiguation selection list
    const candidates = products.filter((p) => smartMatch(p, query));
    if (candidates.length > 0) {
      ambiguousChoices.push({ spokenQuery: query, qty, candidates });
    } else {
      unmatched.push(clause);
    }
  });

  return { normalizedTranscript: normalized, exactMatches, ambiguousChoices, unmatched, triggerCheckout };
}

export function createSpeechRecognitionSession({ onInterim, onFinal, onError }) {
  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!SR) return null;
  const recognition = new SR();
  recognition.lang = 'hi-IN'; // Captures Hindi, Hinglish & Indian English live
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onresult = (event) => {
    let interim = '';
    let finalText = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalText += text + ' ';
      else interim += text;
    }
    if (interim && onInterim) onInterim(interim.trim());
    if (finalText.trim() && onFinal) onFinal(finalText.trim());
  };
  recognition.onerror = (err) => onError && onError(err);
  return recognition;
}
