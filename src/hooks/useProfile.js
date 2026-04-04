import { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:3001/api';
const DEFAULT = {
  id: 'user',
  name: '',
  phone: '',
  emergencyContact: '',
  settings: {
    voiceEnabled: true
  }
};

export function useProfile() {
  const [profile, setProfile] = useState(DEFAULT);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/profile/user`);
      if (res.ok) {
        const data = await res.json();
        if (data) setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const save = async (newProfile) => {
    try {
      const response = await fetch(`${API_BASE}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProfile, id: 'user' })
      });
      if (response.ok) {
        setProfile(newProfile);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  return { profile, save };
}
