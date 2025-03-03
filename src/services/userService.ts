import { supabase } from '../lib/supabase';
import { User } from '../types';
import { getUsers as getLocalUsers, getUserById as getLocalUserById, getCouriers as getLocalCouriers, addUser as addLocalUser, updateUser as updateLocalUser, deleteUser as deleteLocalUser } from '../utils/localStorage';

// Generate a new UUID
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.error('Ошибка при получении пользователей из Supabase:', error);
      return getLocalUsers();
    }

    // Обновляем локальное хранилище данными из Supabase
    if (data && data.length > 0) {
      const users: User[] = data.map(user => ({
        id: user.id,
        username: user.username,
        password: user.password,
        role: user.role,
        name: user.name
      }));
      
      // Сохраняем пользователей в localStorage
      localStorage.setItem('courier_rating_users', JSON.stringify(users));
      
      return users;
    }

    return getLocalUsers();
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
    return getLocalUsers();
  }
};

export const getCouriers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'courier');

    if (error) {
      console.error('Ошибка при получении курьеров из Supabase:', error);
      return getLocalCouriers();
    }

    if (data && data.length > 0) {
      const couriers: User[] = data.map(user => ({
        id: user.id,
        username: user.username,
        password: user.password,
        role: user.role,
        name: user.name
      }));
      
      // Обновляем курьеров в localStorage
      const allUsers = getLocalUsers();
      const nonCouriers = allUsers.filter(user => user.role !== 'courier');
      const updatedUsers = [...nonCouriers, ...couriers];
      localStorage.setItem('courier_rating_users', JSON.stringify(updatedUsers));
      
      return couriers;
    }

    return getLocalCouriers();
  } catch (error) {
    console.error('Ошибка при получении курьеров:', error);
    return getLocalCouriers();
  }
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Ошибка при получении пользователя из Supabase:', error);
      return getLocalUserById(id);
    }

    const user = {
      id: data.id,
      username: data.username,
      password: data.password,
      role: data.role,
      name: data.name
    };
    
    // Обновляем пользователя в localStorage
    const localUsers = getLocalUsers();
    const updatedUsers = localUsers.map(u => u.id === user.id ? user : u);
    localStorage.setItem('courier_rating_users', JSON.stringify(updatedUsers));
    
    return user;
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    return getLocalUserById(id);
  }
};

export const addUser = async (user: User): Promise<void> => {
  try {
    // Проверяем, существует ли пользователь с таким username
    const { data, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('username', user.username);
    
    if (checkError) {
      console.error('Ошибка при проверке существования пользователя:', checkError);
      addLocalUser(user);
      return;
    }
    
    // Если пользователь с таким username уже существует, просто добавляем в localStorage
    if (data && data.length > 0) {
      console.warn(`Пользователь с username ${user.username} уже существует в Supabase`);
      addLocalUser(user);
      return;
    }
    
    // Проверяем, существует ли пользователь с таким ID
    const { data: idData, error: idCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id);
      
    if (idCheckError) {
      console.error('Ошибка при проверке существования пользователя по ID:', idCheckError);
    }
    
    // Если пользователь с таким ID уже существует, генерируем новый ID
    let userToAdd = user;
    if (idData && idData.length > 0) {
      userToAdd = { ...user, id: generateUUID() };
    }
    
    // Добавляем пользователя в Supabase
    const { error } = await supabase
      .from('users')
      .insert([{
        id: userToAdd.id,
        username: userToAdd.username,
        password: userToAdd.password,
        role: userToAdd.role,
        name: userToAdd.name
      }]);

    if (error) {
      console.error('Ошибка при добавлении пользователя в Supabase:', error);
    }
    
    // В любом случае добавляем в localStorage
    addLocalUser(userToAdd);
  } catch (error) {
    console.error('Ошибка при добавлении пользователя:', error);
    addLocalUser(user);
  }
};

export const updateUser = async (updatedUser: User): Promise<void> => {
  try {
    // Обновляем пользователя в Supabase
    const { error } = await supabase
      .from('users')
      .update({
        username: updatedUser.username,
        password: updatedUser.password,
        role: updatedUser.role,
        name: updatedUser.name
      })
      .eq('id', updatedUser.id);

    if (error) {
      console.error('Ошибка при обновлении пользователя в Supabase:', error);
    }
    
    // В любом случае обновляем в localStorage
    updateLocalUser(updatedUser);
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error);
    updateLocalUser(updatedUser);
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    // Удаляем пользователя из Supabase
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Ошибка при удалении пользователя из Supabase:', error);
    }
    
    // В любом случае удаляем из localStorage
    deleteLocalUser(id);
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error);
    deleteLocalUser(id);
  }
};