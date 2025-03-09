import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { getUsers, syncDataWithServer } from '../utils/localStorage';
import { getUsers as getSupabaseUsers } from '../services/userService';

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

// Check if a string is a valid UUID
const isValidUUID = (id: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

// Generate a proper UUID
const generateProperUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем наличие пользователя в session storage при начальной загрузке
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // Ensure user has a proper UUID
        if (!isValidUUID(parsedUser.id)) {
          parsedUser.id = generateProperUUID();
          sessionStorage.setItem('currentUser', JSON.stringify(parsedUser));
        }
        
        setUser(parsedUser);
      } catch (e) {
        console.error('Error parsing stored user:', e);
        sessionStorage.removeItem('currentUser');
      }
    }
    
    // Fetch users from Supabase to ensure we have the latest data
    getSupabaseUsers().then(() => {
      setLoading(false);
    }).catch(error => {
      console.error('Error fetching users during auth initialization:', error);
      setLoading(false);
    });
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      // Fetch the latest users from Supabase first
      await getSupabaseUsers();
      
      // Now get users from localStorage (which should be updated with Supabase data)
      const localUsers = getUsers();
      const localUser = localUsers.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password === password
      );
      
      if (localUser) {
        // Ensure user has a proper UUID
        const userWithProperUUID = isValidUUID(localUser.id) ? 
          localUser : 
          { ...localUser, id: generateProperUUID() };
          
        // Сохраняем пользователя в состоянии и session storage
        setUser(userWithProperUUID);
        sessionStorage.setItem('currentUser', JSON.stringify(userWithProperUUID));
        return { user: userWithProperUUID, error: null };
      }

      // Если локальная аутентификация не удалась, пробуем через Supabase
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .ilike('username', username)
          .eq('password', password)
          .single();

        if (error || !data) {
          return { user: null, error: 'Неверное имя пользователя или пароль' };
        }

        // Преобразуем данные из Supabase в наш тип User
        const userData: User = {
          id: data.id,
          username: data.username,
          password: data.password,
          role: data.role as 'admin' | 'courier',
          name: data.name
        };

        // Сохраняем пользователя в состоянии и session storage
        setUser(userData);
        sessionStorage.setItem('currentUser', JSON.stringify(userData));

        return { user: userData, error: null };
      } catch (supabaseError) {
        console.error('Ошибка при аутентификации через Supabase:', supabaseError);
        return { user: null, error: 'Произошла ошибка при входе в систему' };
      }
    } catch (error) {
      console.error('Непредвиденная ошибка при входе:', error);
      return { user: null, error: 'Произошла ошибка при входе в систему' };
    }
  };

  const signOut = async () => {
    // Очищаем пользователя из состояния и session storage
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
