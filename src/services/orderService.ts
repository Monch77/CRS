import { supabase } from '../lib/supabase';
import { Order, OrderStatus, Rating } from '../types';
import { generateUniqueCode } from '../utils/codeGenerator';
import { getOrders as getLocalOrders, getOrderById as getLocalOrderById, getOrderByCode as getLocalOrderByCode, getOrdersByCourierId as getLocalOrdersByCourierId, addOrder as addLocalOrder, updateOrder as updateLocalOrder, deleteOrder as deleteLocalOrder } from '../utils/localStorage';

// Check if a string is a valid UUID
const isValidUUID = (id: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

// Generate a new UUID
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const getOrders = async (): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка при получении заказов из Supabase:', error);
      return getLocalOrders();
    }

    // Обновляем локальное хранилище данными из Supabase
    if (data && data.length > 0) {
      const orders = data.map(order => ({
        id: order.id,
        address: order.address,
        phoneNumber: order.phone_number,
        deliveryTime: order.delivery_time,
        comments: order.comments,
        courierId: order.courier_id,
        courierName: order.courier_name,
        status: order.status as OrderStatus,
        code: order.code,
        createdAt: order.created_at,
        completedAt: order.completed_at,
        rating: order.rating as Rating | undefined,
        isPositive: order.is_positive,
        feedback: order.feedback
      }));
      
      // Сохраняем заказы в localStorage
      localStorage.setItem('courier_rating_orders', JSON.stringify(orders));
      
      return orders;
    }

    return getLocalOrders();
  } catch (error) {
    console.error('Ошибка при получении заказов:', error);
    return getLocalOrders();
  }
};

export const getOrderById = async (id: string): Promise<Order | null> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Ошибка при получении заказа из Supabase:', error);
      return getLocalOrderById(id) || null;
    }

    if (!data) {
      return getLocalOrderById(id) || null;
    }

    const order = {
      id: data.id,
      address: data.address,
      phoneNumber: data.phone_number,
      deliveryTime: data.delivery_time,
      comments: data.comments,
      courierId: data.courier_id,
      courierName: data.courier_name,
      status: data.status as OrderStatus,
      code: data.code,
      createdAt: data.created_at,
      completedAt: data.completed_at,
      rating: data.rating as Rating | undefined,
      isPositive: data.is_positive,
      feedback: data.feedback
    };
    
    // Обновляем заказ в localStorage
    const localOrders = getLocalOrders();
    const updatedOrders = localOrders.map(o => o.id === order.id ? order : o);
    localStorage.setItem('courier_rating_orders', JSON.stringify(updatedOrders));
    
    return order;
  } catch (error) {
    console.error('Ошибка при получении заказа:', error);
    return getLocalOrderById(id) || null;
  }
};

export const getOrderByCode = async (code: string): Promise<Order | null> => {
  if (!code) return null;
  
  // Нормализуем код к верхнему регистру для согласованного сравнения
  const normalizedCode = code.toUpperCase();
  
  try {
    // Сначала пробуем получить заказ из Supabase
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .ilike('code', normalizedCode)
      .in('status', ['assigned', 'in-progress'])
      .maybeSingle();

    if (error) {
      console.error('Ошибка при получении заказа по коду из Supabase:', error);
      // Если в Supabase не найдено, пробуем localStorage
      return getLocalOrderByCode(normalizedCode) || null;
    }

    if (!data) {
      // Если данные не найдены в Supabase, пробуем localStorage
      return getLocalOrderByCode(normalizedCode) || null;
    }

    const order = {
      id: data.id,
      address: data.address,
      phoneNumber: data.phone_number,
      deliveryTime: data.delivery_time,
      comments: data.comments,
      courierId: data.courier_id,
      courierName: data.courier_name,
      status: data.status as OrderStatus,
      code: data.code,
      createdAt: data.created_at,
      completedAt: data.completed_at,
      rating: data.rating as Rating | undefined,
      isPositive: data.is_positive,
      feedback: data.feedback
    };
    
    // Обновляем заказ в localStorage
    const localOrders = getLocalOrders();
    const updatedOrders = localOrders.map(o => o.id === order.id ? order : o);
    localStorage.setItem('courier_rating_orders', JSON.stringify(updatedOrders));
    
    return order;
  } catch (error) {
    console.error('Ошибка при получении заказа по коду:', error);
    return getLocalOrderByCode(normalizedCode) || null;
  }
};

export const getOrdersByCourierId = async (courierId: string): Promise<Order[]> => {
  try {
    // Validate if courierId is a valid UUID before making the request
    const isValidUUIDFormat = isValidUUID(courierId);
    
    if (!isValidUUIDFormat) {
      console.warn('Invalid UUID format for courierId:', courierId);
      // Fall back to localStorage if UUID is invalid
      return getLocalOrdersByCourierId(courierId);
    }
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('courier_id', courierId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка при получении заказов курьера из Supabase:', error);
      return getLocalOrdersByCourierId(courierId);
    }

    if (data && data.length > 0) {
      const orders = data.map(order => ({
        id: order.id,
        address: order.address,
        phoneNumber: order.phone_number,
        deliveryTime: order.delivery_time,
        comments: order.comments,
        courierId: order.courier_id,
        courierName: order.courier_name,
        status: order.status as OrderStatus,
        code: order.code,
        createdAt: order.created_at,
        completedAt: order.completed_at,
        rating: order.rating as Rating | undefined,
        isPositive: order.is_positive,
        feedback: order.feedback
      }));
      
      // Обновляем заказы курьера в localStorage
      const localOrders = getLocalOrders();
      const otherOrders = localOrders.filter(o => o.courierId !== courierId);
      const updatedOrders = [...otherOrders, ...orders];
      localStorage.setItem('courier_rating_orders', JSON.stringify(updatedOrders));
      
      return orders;
    }

    return getLocalOrdersByCourierId(courierId);
  } catch (error) {
    console.error('Ошибка при получении заказов курьера:', error);
    return getLocalOrdersByCourierId(courierId);
  }
};

export const addOrder = async (order: Order): Promise<void> => {
  // Если у заказа есть код, убедимся, что статус "assigned"
  const status = order.code ? 'assigned' : order.status;
  
  try {
    // Проверяем, существует ли заказ с таким ID в Supabase
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', order.id)
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Ошибка при проверке существования заказа:', checkError);
    }
    
    // Если заказ с таким ID уже существует, генерируем новый ID
    let orderToAdd = { ...order, status };
    if (existingOrder) {
      orderToAdd = { ...orderToAdd, id: generateUUID() };
    }
    
    // Сначала добавляем в localStorage для надежности
    addLocalOrder(orderToAdd);
    
    // Затем добавляем в Supabase
    const { error } = await supabase
      .from('orders')
      .insert([{
        id: orderToAdd.id,
        address: orderToAdd.address,
        phone_number: orderToAdd.phoneNumber,
        delivery_time: orderToAdd.deliveryTime,
        comments: orderToAdd.comments,
        courier_id: orderToAdd.courierId,
        courier_name: orderToAdd.courierName,
        status: orderToAdd.status,
        code: orderToAdd.code,
        created_at: orderToAdd.createdAt,
        completed_at: orderToAdd.completedAt,
        rating: orderToAdd.rating,
        is_positive: orderToAdd.isPositive,
        feedback: orderToAdd.feedback
      }]);

    if (error) {
      console.error('Ошибка при добавлении заказа в Supabase:', error);
    }
  } catch (error) {
    console.error('Ошибка при добавлении заказа:', error);
  }
};

export const updateOrder = async (updatedOrder: Order): Promise<void> => {
  // Если у заказа есть код и статус не "completed", "in-progress" или "cancelled",
  // убедимся, что статус "assigned"
  let status = updatedOrder.status;
  if (
    updatedOrder.code && 
    status !== 'completed' && 
    status !== 'in-progress' && 
    status !== 'cancelled'
  ) {
    status = 'assigned';
  }
  
  try {
    // Сначала обновляем в localStorage для надежности
    updateLocalOrder({
      ...updatedOrder,
      status
    });
    
    // Затем обновляем в Supabase
    const { error } = await supabase
      .from('orders')
      .update({
        address: updatedOrder.address,
        phone_number: updatedOrder.phoneNumber,
        delivery_time: updatedOrder.deliveryTime,
        comments: updatedOrder.comments,
        courier_id: updatedOrder.courierId,
        courier_name: updatedOrder.courierName,
        status: status,
        code: updatedOrder.code,
        completed_at: updatedOrder.completedAt,
        rating: updatedOrder.rating,
        is_positive: updatedOrder.isPositive,
        feedback: updatedOrder.feedback
      })
      .eq('id', updatedOrder.id);

    if (error) {
      console.error('Ошибка при обновлении заказа в Supabase:', error);
    }
  } catch (error) {
    console.error('Ошибка при обновлении заказа:', error);
  }
};

export const deleteOrder = async (id: string): Promise<void> => {
  try {
    // Сначала удаляем из localStorage для надежности
    deleteLocalOrder(id);
    
    // Затем удаляем из Supabase
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Ошибка при удалении заказа из Supabase:', error);
    }
  } catch (error) {
    console.error('Ошибка при удалении заказа:', error);
  }
};

export const generateOrderCode = async (): Promise<string> => {
  // Генерируем уникальный код
  let code = generateUniqueCode();
  let isUnique = false;
  
  // Убеждаемся, что код уникален в базе данных
  while (!isUnique) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('code')
        .eq('code', code);
      
      if (error) {
        console.error('Ошибка при проверке уникальности кода:', error);
        return code; // В случае ошибки просто возвращаем сгенерированный код
      }
      
      if (data && data.length === 0) {
        isUnique = true;
      } else {
        code = generateUniqueCode();
      }
    } catch (error) {
      console.error('Ошибка при генерации кода заказа:', error);
      return code; // В случае ошибки просто возвращаем сгенерированный код
    }
  }
  
  return code;
};