import { useState, useEffect } from 'react';

export interface Profile {
  name: string;
  phone: string;
  emergencyContact: string;
}

const DEFAULT: Profile = { name: '', phone: '', emergencyContact: '' };
const KEY = 'signvoice-profile';

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '') || DEFAULT; } catch { return DEFAULT; }
  });

  const save = (p: Profile) => {
    setProfile(p);
    localStorage.setItem(KEY, JSON.stringify(p));
  };

  return { profile, save };
}
