import { useState } from 'react';
import { User, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProfileModal({ profile, onSave, open, onClose }) {
  const [form, setForm] = useState(profile || { name: '', phone: '', emergencyContact: '' });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm fade-in" onClick={onClose}>
      <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl slide-up mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-card-foreground">Profile</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        
        <div className="space-y-4">
          {[
            { label: 'Name', key: 'name', placeholder: 'Your name' },
            { label: 'Phone', key: 'phone', placeholder: '+1 234 567 890' },
            { label: 'Emergency Contact', key: 'emergencyContact', placeholder: 'Emergency contact number' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">{label}</label>
              <input
                value={form[key] || ''}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full h-11 rounded-xl bg-muted px-4 text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
          ))}
        </div>
        
        <Button className="w-full mt-6 h-12 rounded-xl text-base font-semibold" onClick={() => { onSave(form); onClose(); }}>
          <Save className="w-4 h-4 mr-2" /> Save Profile
        </Button>
      </div>
    </div>
  );
}
