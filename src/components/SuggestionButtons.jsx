import { speak } from '@/lib/tts';



const SUGGESTIONS = [
  'I want this',
  'How much is this?',
  'Give discount',
  'Can you show me more?',
];

export function SuggestionButtons({ onSpeak }) {
  return (
    <div className="bg-accent/10 rounded-2xl p-4 border border-accent/20 slide-up">
      <p className="text-xs font-semibold text-accent mb-3 uppercase tracking-wider">👆 Pointing detected — What do you mean?</p>
      <div className="grid grid-cols-2 gap-2">
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => { speak(s); onSpeak(s); }}
            className="bg-accent text-accent-foreground rounded-xl px-3 py-2.5 text-sm font-medium hover:opacity-90 transition-all active:scale-95"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
