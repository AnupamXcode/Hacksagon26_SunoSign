import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const savedUser = localStorage.getItem('sunosign_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Failed to parse saved user:', err);
        localStorage.removeItem('sunosign_user');
      }
    }
    setIsLoading(false);
  }, []);

  const register = async (name, phone, email, password, image, description) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password, image, description })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error('Backend error response:', parseErr);
        throw new Error('Backend error: Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      const userData = data;
      const userToSave = {
        userId: userData.userId,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        image: userData.image,
        description: userData.description
      };
      
      setUser(userToSave);
      localStorage.setItem('sunosign_user', JSON.stringify(userToSave));
      return userToSave;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error('Backend error response:', parseErr);
        throw new Error('Backend error: Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const userData = data;
      const userToSave = {
        userId: userData.userId,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        image: userData.image,
        description: userData.description
      };
      
      setUser(userToSave);
      localStorage.setItem('sunosign_user', JSON.stringify(userToSave));
      return userToSave;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sunosign_user');
    setError(null);
  };

  const updateProfile = async (name, phone, description, image) => {
    if (!user) throw new Error('No user logged in');
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3001/api/auth/profile/${user.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, description, image })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error('Backend error response:', parseErr);
        throw new Error('Backend error: Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Update failed');
      }
      const updatedUser = {
        userId: user.userId,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        image: data.user.image,
        description: data.user.description
      };

      setUser(updatedUser);
      localStorage.setItem('sunosign_user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, register, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
