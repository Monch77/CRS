import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Отсутствуют переменные окружения Supabase. Проверьте файл .env.');
}

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Проверяем соединение и логируем результат
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.warn('Ошибка соединения с Supabase:', error.message);
  } else {
    console.log('Соединение с Supabase успешно установлено');
    
    // Проверяем доступность таблиц
    supabase.from('users').select('count').then(({ data, error }) => {
      if (error) {
        console.warn('Ошибка доступа к таблице users:', error.message);
      } else {
        console.log('Таблица users доступна');
      }
    });
    
    supabase.from('orders').select('count').then(({ data, error }) => {
      if (error) {
        console.warn('Ошибка доступа к таблице orders:', error.message);
      } else {
        console.log('Таблица orders доступна');
      }
    });
  }
});

// Функция для проверки соединения с Supabase
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('users').select('count');
    return !error;
  } catch (e) {
    console.error('Ошибка при проверке соединения с Supabase:', e);
    return false;
  }
};