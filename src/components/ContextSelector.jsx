// Context mode selector Mode vs Retailer Mode with domain picker
import { useState } from 'react';
import { User, Store, ChevronDown } from 'lucide-react';
import { DOMAINS } from '@/lib/domainData';



export function ContextSelector({ context, domain, onContextChange, onDomainChange }) {
  const [showDomains, setShowDomains] = useState(false);
  const activeDomain = DOMAINS.find(d => d.id === domain);

  return (
    <div className="flex items-center gap-2">
      {/* User / Retailer toggle */}
      <div className="flex bg-muted rounded-xl p-0.5">
        <button
          onClick={() => { onContextChange('user'); onDomainChange('general'); }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
            context === 'user'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <User className="w-3 h-3" />
          <span className="hidden sm:inline">User</span>
        </button>
        <button
          onClick={() => { onContextChange('retailer'); setShowDomains(true); }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
            context === 'retailer'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Store className="w-3 h-3" />
          <span className="hidden sm:inline">Retailer</span>
        </button>
      </div>

      {/* Domain selector (only in retailer mode) */}
      {context === 'retailer' && (
        <div className="relative">
          <button
            onClick={() => setShowDomains(s => !s)}
            className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-xl text-[11px] font-semibold hover:bg-secondary/80 transition-colors"
          >
            <span>{activeDomain?.emoji}</span>
            <span className="hidden sm:inline">{activeDomain?.label}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showDomains && (
            <div className="absolute top-full mt-1 right-0 bg-card border border-border rounded-xl shadow-lg z-50 min-w-[180px] py-1 fade-in">
              {DOMAINS.filter(d => d.id !== 'general').map(d => (
                <button
                  key={d.id}
                  onClick={() => { onDomainChange(d.id); setShowDomains(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted/50 transition-colors ${
                    domain === d.id ? 'text-primary font-bold' : 'text-foreground'
                  }`}
                >
                  <span className="text-base">{d.emoji}</span>
                  <div className="text-left">
                    <div className="font-semibold">{d.label}</div>
                    <div className="text-[10px] text-muted-foreground">{d.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
