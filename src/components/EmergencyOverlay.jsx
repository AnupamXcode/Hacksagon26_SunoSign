import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';



export function EmergencyOverlay({ onDismiss }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center emergency-flash">
      <div className="text-center text-destructive-foreground space-y-6 p-8">
        <AlertTriangle className="w-24 h-24 mx-auto animate-bounce" />
        <h1 className="text-5xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>EMERGENCY</h1>
        <p className="text-2xl font-medium opacity-90">Help is needed!</p>
        <p className="text-lg opacity-75">Speaking alert repeatedly...</p>
        <Button
          variant="outline"
          size="lg"
          onClick={onDismiss}
          className="mt-4 bg-card/20 border-destructive-foreground/30 text-destructive-foreground hover:bg-card/30 rounded-xl h-14 px-8 text-lg"
        >
          <X className="w-5 h-5 mr-2" /> Dismiss Emergency
        </Button>
      </div>
    </div>
  );
}
