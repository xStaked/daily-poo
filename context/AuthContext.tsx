import apiClient from '@/api/client';
import { User } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('pooty_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (err) {
        console.error('Error loading user:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const { data } = await apiClient.post('/auth/login', {
        username,
        password,
      });

      // Map backend user to frontend User interface
      const user: User = {
        ...data.user,
        displayName: data.user.display_name
      };

      setUser(user);
      await AsyncStorage.setItem('pooty_user', JSON.stringify(user));
      await AsyncStorage.setItem('pooty_token', data.token);
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const register = async (username: string, password: string, displayName?: string) => {
    try {
      const { data } = await apiClient.post('/auth/register', {
        username,
        password,
        displayName,
      });

      // Map backend user to frontend User interface
      const user: User = {
        ...data.user,
        displayName: data.user.display_name
      };

      setUser(user);
      await AsyncStorage.setItem('pooty_user', JSON.stringify(user));
      await AsyncStorage.setItem('pooty_token', data.token);
    } catch (err) {
      console.error('Registration error:', err);
      throw err;
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('pooty_user');
    await AsyncStorage.removeItem('pooty_token');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
