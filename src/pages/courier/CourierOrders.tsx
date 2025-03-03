import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOrdersByCourierId, updateOrder } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import { Order, OrderStatus } from '../../types';
import { Clock, CheckCircle, XCircle, AlertCircle, Star, Home, ExternalLink, MapPin, Phone, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const CourierOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const { user } = useAuth();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  
  useEffect(() => {
    const loadOrders = async () => {
      if (user) {
        setLoading(true);
        try {
          // Загружаем только заказы, назначенные текущему курьеру
          const courierOrders = await getOrdersByCourierId(user.id);
          setOrders(courierOrders);
          setFilteredOrders(courierOrders);
        } catch (error) {
          console.error('Ошибка при загрузке заказов:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadOrders();
  }, [user]);
  
  useEffect(() => {
    // Применяем фильтры
    if (statusFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === statusFilter));
    }
  }, [orders, statusFilter]);
  
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    const orderToUpdate = orders.find(order => order.id === orderId);
    
    if (orderToUpdate) {
      try {
        const updatedOrder: Order = {
          ...orderToUpdate,
          status: newStatus,
          // Если статус меняется на "завершен", добавляем дату завершения
          completedAt: newStatus === 'completed' ? new Date().toISOString() : orderToUpdate.completedAt
        };
        
        await updateOrder(updatedOrder);
        
        // Обновляем локальное состояние
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId ? updatedOrder : order
          )
        );
      } catch (error) {
        console.error('Ошибка при обновлении статуса заказа:', error);
        alert('Произошла ошибка при обновлении статуса заказа. Пожалуйста, попробуйте снова.');
      } finally {
        setUpdatingOrderId(null);
      }
    }
  };
  
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'assigned':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-purple-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };
  
  const getStatusClass = (order: Order) => {
    if (order.status !== 'completed') return '';
    return order.isPositive ? 'bg-green-50' : 'bg-red-50';
  };
  
  const renderRatingStars = (rating?: number) => {
    if (!rating) return 'Не оценено';
    
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={`h-4 w-4 ${i <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
        />
      );
    }
    
    return <div className="flex">{stars}</div>;
  };
  
  const toggleOrderExpand = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };
  
  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'assigned': return 'Назначен';
      case 'in-progress': return 'В процессе';
      case 'completed': return 'Завершен';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };
  
  const renderMobileOrderCard = (order: Order) => {
    const isExpanded = expandedOrderId === order.id;
    const isUpdating = updatingOrderId === order.id;
    
    return (
      <div 
        key={order.id} 
        className={`bg-white rounded-lg shadow mb-4 overflow-hidden ${getStatusClass(order)}`}
      >
        <div 
          className="p-4 flex justify-between items-center cursor-pointer"
          onClick={() => toggleOrderExpand(order.id)}
        >
          <div className="flex items-center">
            {getStatusIcon(order.status)}
            <span className="ml-2 font-medium">{getStatusText(order.status)}</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">#{order.id.slice(0, 6)}</div>
            <div className="text-xs text-gray-500">
              {format(new Date(order.createdAt), 'dd.MM.yyyy')}
            </div>
          </div>
        </div>
        
        {isExpanded && (
          <div className="border-t border-gray-100 p-4">
            <div className="space-y-3">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500 mb-1">Адрес доставки</div>
                  <div className="text-sm">{order.address}</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500 mb-1">Телефон клиента</div>
                  <a href={`tel:${order.phoneNumber}`} className="text-sm text-blue-600">
                    {order.phoneNumber}
                  </a>
                </div>
              </div>
              
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500 mb-1">Время доставки</div>
                  <div className="text-sm">
                    {order.deliveryTime ? format(new Date(order.deliveryTime), 'dd.MM.yyyy HH:mm') : '-'}
                  </div>
                </div>
              </div>
              
              {order.comments && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">Комментарии</div>
                  <div className="text-sm">{order.comments}</div>
                </div>
              )}
              
              {order.rating !== undefined && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">Оценка клиента</div>
                  <div>{renderRatingStars(order.rating)}</div>
                </div>
              )}
              
              {order.code && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">Оценка доставки</div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-700">Клиент может оценить доставку</span>
                    <Link to="/rating-help" className="text-blue-600 flex items-center text-sm ml-2">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Помощь
                    </Link>
                  </div>
                </div>
              )}
              
              <div className="mt-3 pt-3 border-t border-gray-100">
                {order.status === 'assigned' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(order.id, 'in-progress');
                    }}
                    disabled={isUpdating}
                    className={`w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${isUpdating ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isUpdating ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Обновление...
                      </span>
                    ) : 'Начать доставку'}
                  </button>
                )}
                
                {order.status === 'in-progress' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(order.id, 'completed');
                    }}
                    disabled={isUpdating}
                    className={`w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700 ${isUpdating ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isUpdating ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Обновление...
                      </span>
                    ) : 'Завершить доставку'}
                  </button>
                )}
                
                {order.status === 'completed' && (
                  <div className="text-center text-sm text-gray-500">
                    Завершено: {order.completedAt ? format(new Date(order.completedAt), 'dd.MM.yyyy HH:mm') : '-'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Мои заказы</h1>
        <div className="flex space-x-2">
          <Link to="/rating-help" className="flex items-center text-blue-600 hover:text-blue-800 text-sm">
            <Star className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Помощь с оценкой</span>
          </Link>
          <Link to="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 text-sm">
            <Home className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Главная</span>
          </Link>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
          Фильтр по статусу
        </label>
        <select
          id="statusFilter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">Все заказы</option>
          <option value="assigned">Назначенные</option>
          <option value="in-progress">В процессе</option>
          <option value="completed">Завершенные</option>
          <option value="cancelled">Отмененные</option>
        </select>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Мобильный вид (карточки) */}
          <div className="md:hidden">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-4 text-center text-gray-500">
                Заказы не найдены
              </div>
            ) : (
              filteredOrders.map(order => renderMobileOrderCard(order))
            )}
          </div>
          
          {/* Десктопный вид (таблица) */}
          <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Адрес
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Телефон
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Время доставки
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Создан
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Завершен
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Оценка
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        Заказы не найдены
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className={getStatusClass(order)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(order.status)}
                            <span className="ml-2 capitalize">
                              {getStatusText(order.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{order.address}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.phoneNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {order.deliveryTime ? format(new Date(order.deliveryTime), 'dd.MM.yyyy HH:mm') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {order.completedAt 
                            ? format(new Date(order.completedAt), 'dd.MM.yyyy HH:mm') 
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderRatingStars(order.rating)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {order.status === 'assigned' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'in-progress')}
                              disabled={updatingOrderId === order.id}
                              className={`text-blue-600 hover:text-blue-900 mr-2 ${updatingOrderId === order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {updatingOrderId === order.id ? 'Обновление...' : 'Начать доставку'}
                            </button>
                          )}
                          
                          {order.status === 'in-progress' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'completed')}
                              disabled={updatingOrderId === order.id}
                              className={`text-green-600 hover:text-green-900 ${updatingOrderId === order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {updatingOrderId === order.id ? 'Обновление...' : 'Завершить'}
                            </button>
                          )}
                          
                          {order.code && (
                            <Link 
                              to="/rating-help"
                              className="text-blue-600 hover:text-blue-800 flex items-center text-sm ml-2"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Помощь с оценкой
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      
      <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
        <h3 className="text-lg font-semibold mb-2">Информация</h3>
        <p className="text-gray-700 text-sm">
          После завершения доставки, статус заказа автоматически обновится в системе. Если клиент хочет оценить доставку, вы можете помочь ему, перейдя на страницу "Помощь с оценкой".
        </p>
      </div>
    </div>
  );
};

export default CourierOrders;