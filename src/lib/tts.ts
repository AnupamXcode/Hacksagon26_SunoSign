// Text-to-Speech module using Web SpeechSynthesis API

let isSpeaking = false;
let emergencyInterval: ReturnType<typeof setInterval> | null = null;

export function speak(text: string, options?: { rate?: number; volume?: number; pitch?: number }) {
  if (!text || !('speechSynthesis' in window)) return;
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options?.rate ?? 1;
  utterance.volume = options?.volume ?? 1;
  utterance.pitch = options?.pitch ?? 1;
  utterance.lang = 'en-US';
  
  utterance.onstart = () => { isSpeaking = true; };
  utterance.onend = () => { isSpeaking = false; };
  utterance.onerror = () => { isSpeaking = false; };
  
  window.speechSynthesis.speak(utterance);
}

export function speakEmergency(text: string) {
  stopEmergency();
  speak(text, { rate: 0.9, volume: 1 });
  emergencyInterval = setInterval(() => {
    speak(text, { rate: 0.9, volume: 1 });
  }, 3000);
}

export function stopEmergency() {
  if (emergencyInterval) {
    clearInterval(emergencyInterval);
    emergencyInterval = null;
  }
  window.speechSynthesis?.cancel();
  isSpeaking = false;
}

export function getIsSpeaking() {
  return isSpeaking;
}
