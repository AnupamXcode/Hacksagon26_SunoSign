import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/components/LoginPage';
import SunoSignApp from '@/components/SunoSignApp';

export default function Index() {
  const { user } = useAuth();
  const [loginCompleted, setLoginCompleted] = useState(!!user);

  if (!loginCompleted) {
    return <LoginPage onSuccess={() => setLoginCompleted(true)} />;
  }

  return <SunoSignApp />;
}
