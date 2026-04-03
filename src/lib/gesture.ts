// Re-export from enhanced gesture engine for backward compatibility
export { classifyGesture, type GestureResult, type GestureType } from './gestureEngine';
export { wordToSentence, isEmergencyWord } from './domainData';

import { getDomainWords, getDomainPhrases } from './domainData';

export function getWordSuggestions(prefix: string): string[] {
  if (!prefix || prefix.length < 1) return [];
  const upper = prefix.toUpperCase();
  if (upper.length === 1) {
    return getDomainWords(upper, 'general').slice(0, 6);
  }
  return [];
}

export function getLetterWords(letter: string): string[] {
  return getDomainWords(letter, 'general');
}

export function getLetterPhrases(letter: string): string[] {
  return getDomainPhrases(letter, 'general');
}
