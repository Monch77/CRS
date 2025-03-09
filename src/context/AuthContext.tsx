import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, shouldUseSupabase } from '../lib/supabase';
import { User } from '../types';
import { getUsers, syncDataWithServer } from '../utils/localStorage';
import { getUsers as getSupabaseUsers } from '../services/userService';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ user: User | null; error: string | null }>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
  isCourier: () => boolean;
  updateCurrentUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isValidUUID = (id: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

const generateProperUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (!isValidUUID(parsedUser.id)) {
          parsedUser.id = generateProperUUID();
          sessionStorage.setItem('currentUser', JSON.stringify(parsedUser));
        }
        setUser(parsedUser);
        if (parsedUser.role === 'admin') {
          navigate('/admin');
        } else if (parsedUser.role === 'courier') {
          navigate('/courier-dashboard');
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
        sessionStorage.removeItem('currentUser');
      }
    }

    if (shouldUseSupabase()) {
      getSupabaseUsers().then(() => {
        setLoading(false);
      }).catch(error => {
        console.error('Error fetching users:', error);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const signIn = async (username: string, password: string) => {
    try {
      if (shouldUseSupabase()) {
        await getSupabaseUsers();
      }
      
      const localUsers = getUsers();
      const localUser = localUsers.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password === password
      );
      
      if (localUser) {
        const userWithProperUUID = isValidUUID(localUser.id) ? 
          localUser : 
          { ...localUser, id: generateProperUUID() };
        setUser(userWithProperUUID);
        sessionStorage.setItem('currentUser', JSON.stringify(userWithProperUUID));
        return { user: userWithProperUUID, error: null };
      }

      if (shouldUseSupabase()) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .ilike('username', username)
          .eq('password', password)
          .single();

        if (error || !data) {
          return { user: null, error: 'Неверное имя пользователя или пароль' };
        }

        const userData: User = {
          id: data.id,
          username: data.username,
          password: data.password,
          role: data.role as 'admin' | 'courier',
          name: data.name
        };

        setUser(userData);
        sessionStorage.setItem('currentUser', JSON.stringify(userData));
        return { user: userData, error: null };
      }

      return { user: null, error: 'Неверное имя пользователя или пароль' };
    } catch (error) {
      console.error('Ошибка при входе:', error);
      return { user: null, error: 'Произошла ошибка при входе' };
    }
  };

  const signOut = async () => {
    setUser(null);
    sessionStorage.removeItem('currentUser');
  };

  const isAdmin = () => {
    return !!user && user.role === 'admin';
  };

  const isCourier = () => {
    return !!user && user.role === 'courier';
  };
  
  const updateCurrentUser = (updatedUser: User) => {
    setUser(updatedUser);
    sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, isAdmin, isCourier, updateCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};
