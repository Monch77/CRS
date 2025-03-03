import { User, Order } from '../types';
import { supabase } from '../lib/supabase';

// Mock data for initial setup
const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123', // In a real app, this would be hashed
    role: 'admin',
    name: 'Admin User'
  }
  // Removed demo courier profiles
];

// Generate proper UUIDs for mock users
const generateProperUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Convert simple IDs to proper UUIDs
const usersWithProperUUIDs = mockUsers.map(user => ({
  ...user,
  id: generateProperUUID()
}));

const mockOrders: Order[] = [];

// Storage keys
const STORAGE_KEYS = {
  USERS: 'courier_rating_users',
  ORDERS: 'courier_rating_orders',
  SYNC_TIMESTAMP: 'courier_rating_sync_timestamp',
  SHARED_DATA: 'courier_rating_shared_data'
};

// Clear all local storage data related to the application
const clearAllLocalData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.USERS);
  localStorage.removeItem(STORAGE_KEYS.ORDERS);
  localStorage.removeItem(STORAGE_KEYS.SYNC_TIMESTAMP);
};

// Initialize local storage with mock data if it doesn't exist
export const initializeLocalStorage = (): void => {
  // Clear existing data to ensure fresh start
  clearAllLocalData();
  
  // Set initial data
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersWithProperUUIDs));
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(mockOrders));
  
  // Проверяем и исправляем статусы заказов с кодами
  fixOrderStatuses();
};

// Check if a string is a valid UUID
const isValidUUID = (id: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

// Функция для исправления статусов заказов с кодами
const fixOrderStatuses = (): void => {
  const orders = getOrders();
  let hasChanges = false;
  
  const updatedOrders = orders.map(order => {
    // Если у заказа есть код, но статус не "assigned", исправляем
    if (order.code && order.status !== 'assigned' && order.status !== 'in-progress' && order.status !== 'completed') {
      hasChanges = true;
      return {
        ...order,
        status: 'assigned'
      };
    }
    return order;
  });
  
  if (hasChanges) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updatedOrders));
  }
};

// Функция для проверки существования пользователя в Supabase по username
const checkUserExistsByUsername = async (username: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username);
    
    if (error) {
      console.error('Ошибка при проверке пользователя по username в Supabase:', error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Ошибка при проверке пользователя по username:', error);
    return false;
  }
};

// Функция для синхронизации пользователя с Supabase
const syncUserToSupabase = async (user: User): Promise<void> => {
  try {
    // Сначала проверяем существование пользователя по ID
    const { data: idData, error: idError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    
    if (idError && idError.code !== 'PGRST116') {
      console.error('Ошибка при проверке пользователя по ID в Supabase:', idError);
      return;
    }
    
    // Если пользователь с таким ID существует, обновляем его
    if (idData) {
      const { error } = await supabase
        .from('users')
        .update({
          username: user.username,
          password: user.password,
          role: user.role,
          name: user.name
        })
        .eq('id', user.id);
      
      if (error) {
        console.error('Ошибка при обновлении пользователя в Supabase:', error);
      }
      return;
    }
    
    // Если пользователя с таким ID нет, проверяем существование по username
    const usernameExists = await checkUserExistsByUsername(user.username);
    
    if (usernameExists) {
      // Если пользователь с таким username уже существует, пропускаем создание
      console.warn(`Пользователь с username ${user.username} уже существует в Supabase, пропускаем создание`);
      return;
    }
    
    // Если пользователя нет ни по ID, ни по username, создаем нового
    const { error } = await supabase
      .from('users')
      .insert([{
        id: user.id,
        username: user.username,
        password: user.password,
        role: user.role,
        name: user.name
      }]);
    
    if (error) {
      console.error('Ошибка при добавлении пользователя в Supabase:', error);
    }
  } catch (error) {
    console.error('Ошибка при синхронизации пользователя с Supabase:', error);
  }
};

// Функция для синхронизации заказа с Supabase
const syncOrderToSupabase = async (order: Order): Promise<void> => {
  try {
    // Проверяем существование заказа
    const { data, error: checkError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', order.id)
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Ошибка при проверке заказа в Supabase:', checkError);
      return;
    }
    
    if (data) {
      // Обновляем существующий заказ
      const { error } = await supabase
        .from('orders')
        .update({
          address: order.address,
          phone_number: order.phoneNumber,
          delivery_time: order.deliveryTime,
          comments: order.comments,
          courier_id: order.courierId,
          courier_name: order.courierName,
          status: order.status,
          code: order.code,
          completed_at: order.completedAt,
          rating: order.rating,
          is_positive: order.isPositive,
          feedback: order.feedback
        })
        .eq('id', order.id);
      
      if (error) {
        console.error('Ошибка при обновлении заказа в Supabase:', error);
      }
    } else {
      // Создаем новый заказ
      const { error } = await supabase
        .from('orders')
        .insert([{
          id: order.id,
          address: order.address,
          phone_number: order.phoneNumber,
          delivery_time: order.deliveryTime,
          comments: order.comments,
          courier_id: order.courierId,
          courier_name: order.courierName,
          status: order.status,
          code: order.code,
          created_at: order.createdAt,
          completed_at: order.completedAt,
          rating: order.rating,
          is_positive: order.isPositive,
          feedback: order.feedback
        }]);
      
      if (error) {
        console.error('Ошибка при добавлении заказа в Supabase:', error);
      }
    }
  } catch (error) {
    console.error('Ошибка при синхронизации заказа с Supabase:', error);
  }
};

// User-related functions
export const getUsers = (): User[] => {
  try {
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error('Error parsing users from localStorage:', error);
    return usersWithProperUUIDs; // Fallback to mock data with proper UUIDs
  }
};

export const getUserById = (id: string): User | undefined => {
  const users = getUsers();
  return users.find(user => user.id === id);
};

export const getCouriers = (): User[] => {
  const users = getUsers();
  return users.filter(user => user.role === 'courier');
};

export const addUser = (user: User): void => {
  // Ensure user has a proper UUID
  const userWithProperUUID = isValidUUID(user.id) ? 
    user : 
    { ...user, id: generateProperUUID() };
    
  const users = getUsers();
  users.push(userWithProperUUID);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  
  // Немедленно синхронизируем с Supabase
  syncUserToSupabase(userWithProperUUID);
};

export const updateUser = (updatedUser: User): void => {
  // Ensure user has a proper UUID
  const userWithProperUUID = isValidUUID(updatedUser.id) ? 
    updatedUser : 
    { ...updatedUser, id: generateProperUUID() };
    
  const users = getUsers();
  const index = users.findIndex(user => user.id === userWithProperUUID.id);
  
  if (index !== -1) {
    users[index] = userWithProperUUID;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    // Немедленно синхронизируем с Supabase
    syncUserToSupabase(userWithProperUUID);
  }
};

export const deleteUser = (id: string): void => {
  const users = getUsers();
  const filteredUsers = users.filter(user => user.id !== id);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filteredUsers));
  
  // Удаляем пользователя из Supabase
  try {
    supabase
      .from('users')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) {
          console.error('Ошибка при удалении пользователя из Supabase:', error);
        }
      });
  } catch (error) {
    console.error('Ошибка при удалении пользователя из Supabase:', error);
  }
};

// Order-related functions
export const getOrders = (): Order[] => {
  try {
    const orders = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return orders ? JSON.parse(orders) : [];
  } catch (error) {
    console.error('Error parsing orders from localStorage:', error);
    return []; // Fallback to empty array
  }
};

export const getOrderById = (id: string): Order | undefined => {
  const orders = getOrders();
  return orders.find(order => order.id === id);
};

export const getOrderByCode = (code: string): Order | undefined => {
  if (!code) return undefined;
  
  // Normalize the code to uppercase for consistent comparison
  const normalizedCode = code.toUpperCase();
  
  const orders = getOrders();
  return orders.find(order => 
    order.code && 
    order.code.toUpperCase() === normalizedCode && 
    (order.status === 'assigned' || order.status === 'in-progress')
  );
};

export const getOrdersByCourierId = (courierId: string): Order[] => {
  const orders = getOrders();
  return orders.filter(order => order.courierId === courierId);
};

export const addOrder = (order: Order): void => {
  // Если у заказа есть код, убедимся, что статус "assigned"
  const orderToAdd = order.code ? { ...order, status: 'assigned' } : order;
  
  // Ensure order has a proper UUID
  const orderWithProperUUID = isValidUUID(orderToAdd.id) ? 
    orderToAdd : 
    { ...orderToAdd, id: generateProperUUID() };
  
  const orders = getOrders();
  orders.push(orderWithProperUUID);
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  
  // Немедленно синхронизируем с Supabase
  syncOrderToSupabase(orderWithProperUUID);
};

export const updateOrder = (updatedOrder: Order): void => {
  // Если у заказа есть код и статус не "completed" или "in-progress", 
  // убедимся, что статус "assigned"
  let orderToUpdate = updatedOrder;
  if (
    orderToUpdate.code && 
    orderToUpdate.status !== 'completed' && 
    orderToUpdate.status !== 'in-progress' && 
    orderToUpdate.status !== 'cancelled'
  ) {
    orderToUpdate = { ...updatedOrder, status: 'assigned' };
  }
  
  // Ensure order has a proper UUID
  const orderWithProperUUID = isValidUUID(orderToUpdate.id) ? 
    orderToUpdate : 
    { ...orderToUpdate, id: generateProperUUID() };
  
  const orders = getOrders();
  const index = orders.findIndex(order => order.id === orderWithProperUUID.id);
  
  if (index !== -1) {
    orders[index] = orderWithProperUUID;
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    
    // Немедленно синхронизируем с Supabase
    syncOrderToSupabase(orderWithProperUUID);
  }
};

export const deleteOrder = (id: string): void => {
  const orders = getOrders();
  const filteredOrders = orders.filter(order => order.id !== id);
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(filteredOrders));
  
  // Удаляем заказ из Supabase
  try {
    supabase
      .from('orders')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) {
          console.error('Ошибка при удалении заказа из Supabase:', error);
        }
      });
  } catch (error) {
    console.error('Ошибка при удалении заказа из Supabase:', error);
  }
};

// Функция для синхронизации данных между устройствами
export const syncDataWithServer = async (): Promise<void> => {
  try {
    // Attempt to fetch data from Supabase first
    const { data: usersData, error: usersError } = await fetch('/api/users')
      .then(res => res.json())
      .catch(() => ({ data: null, error: true }));
    
    const { data: ordersData, error: ordersError } = await fetch('/api/orders')
      .then(res => res.json())
      .catch(() => ({ data: null, error: true }));
    
    // If we couldn't get data from Supabase, initialize with mock data
    if (usersError || ordersError) {
      console.log('Using mock data due to API errors');
      initializeLocalStorage();
      return;
    }
    
    // If we got data from Supabase, use it
    if (usersData && ordersData) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersData));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(ordersData));
      return;
    }
    
    // If we reach here, we need to initialize with mock data
    initializeLocalStorage();
  } catch (error) {
    console.error('Error syncing data with server:', error);
    // In case of any error, initialize with mock data
    initializeLocalStorage();
  }
};

// Экспортируем функцию для использования в других модулях
export const initializeAndSyncData = (): void => {
  // Always start fresh with mock data
  initializeLocalStorage();
};

// Функция для синхронизации всех локальных данных с Supabase
export const syncAllDataToSupabase = async (): Promise<void> => {
  try {
    // Получаем данные из Supabase для проверки существующих записей
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('username');
    
    if (usersError) {
      console.error('Ошибка при получении пользователей из Supabase:', usersError);
      return;
    }
    
    // Создаем множество существующих имен пользователей для быстрой проверки
    const existingUsernames = new Set(existingUsers?.map(user => user.username.toLowerCase()) || []);
    
    // Получаем локальных пользователей
    const users = getUsers();
    const orders = getOrders();
    
    // Синхронизируем пользователей, пропуская тех, чьи имена уже существуют
    for (const user of users) {
      // Проверяем, существует ли пользователь с таким именем
      if (!existingUsernames.has(user.username.toLowerCase())) {
        await syncUserToSupabase(user);
      } else {
        console.log(`Пользователь ${user.username} уже существует в Supabase, пропускаем`);
      }
    }
    
    // Синхронизируем все заказы
    for (const order of orders) {
      await syncOrderToSupabase(order);
    }
    
    console.log('Все данные успешно синхронизированы с Supabase');
  } catch (error) {
    console.error('Ошибка при синхронизации всех данных с Supabase:', error);
  }
};