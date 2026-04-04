import { speak } from '@/lib/tts';



const PHRASES = [
  { text: 'Please wait', emoji: '⏳' },
  { text: 'Thank you', emoji: '🙏' },
  { text: 'I need help', emoji: '🆘' },
  { text: 'Come tomorrow', emoji: '📅' },
  { text: 'Yes, please', emoji: '✅' },
  { text: 'No, thank you', emoji: '❌' },
];

export function QuickPhrases({ onSpeak }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {PHRASES.map(p => (
        <button
          key={p.text}
          onClick={() => { speak(p.text); onSpeak(p.text); }}
          className="bg-card hover:bg-muted border border-border rounded-xl px-3 py-3 text-sm font-medium text-card-foreground transition-all hover:scale-[1.02] active:scale-[0.98] ripple-effect text-left"
        >
          <span className="mr-2">{p.emoji}</span>{p.text}
        </button>
      ))}
    </div>
  );
}
