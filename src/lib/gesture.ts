// Re-export from enhanced gesture engine for backward compatibility
export { classifyGesture, type GestureResult, type GestureType } from './gestureEngine';
export { getDomainWords as getWordSuggestions, getDomainPhrases as getLetterPhrases, wordToSentence, isEmergencyWord } from './domainData';

// Backward-compatible wrappers
import { getDomainWords, getDomainPhrases } from './domainData';

export function getLetterWords(letter: string): string[] {
  return getDomainWords(letter, 'general');
}
