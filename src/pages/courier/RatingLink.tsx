import React, { useState, useEffect } from 'react';
import { getOrdersByCourierId } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import { Order } from '../../types';
import { Star, Package, AlertCircle, ExternalLink, Copy, Check } from 'lucide-react';

const RatingLink: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { user } = useAuth();
  const [ratingMode, setRatingMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  useEffect(() => {
    const loadOrders = async () => {
      if (user) {
        try {
          // Загружаем только заказы, назначенные текущему курьеру со статусом assigned
          const courierOrders = await getOrdersByCourierId(user.id);
          const assignedOrders = courierOrders.filter(order => 
            order.status === 'assigned' && order.code
          );
          setOrders(assignedOrders);
        } catch (error) {
          console.error('Ошибка при загрузке заказов:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadOrders();
  }, [user]);
  
  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setRatingMode(true);
  };
  
  const handleBackToList = () => {
    setSelectedOrder(null);
    setRatingMode(false);
  };
  
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Помощь клиенту с оценкой доставки</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        !ratingMode ? (
          <>
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 mb-6">
              <div className="flex items-start">
                <AlertCircle className="h-6 w-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Инструкция для курьера</h3>
                  <p className="text-gray-700 mb-3">
                    Клиент должен самостоятельно оценить доставку. Вы можете только помочь ему открыть страницу оценки:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-2">
                    <li>Выберите заказ из списка ниже</li>
                    <li>Покажите клиенту страницу оценки</li>
                    <li>Клиент должен сам ввести код, который знает только администратор</li>
                    <li>Клиент самостоятельно выбирает оценку и отправляет её</li>
                  </ol>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Выберите заказ для оценки</h2>
              </div>
              
              {orders.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  У вас нет активных заказов, доступных для оценки
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {orders.map(order => (
                    <div key={order.id} className="p-6 hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center mb-2">
                            <Package className="h-5 w-5 text-blue-600 mr-2" />
                            <h3 className="font-medium">Заказ #{order.id.slice(0, 8)}</h3>
                          </div>
                          <p className="text-gray-600 mb-2">{order.address}</p>
                        </div>
                        <button
                          onClick={() => handleSelectOrder(order)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Показать страницу оценки
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          selectedOrder && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <button
                onClick={handleBackToList}
                className="text-blue-600 hover:text-blue-800 mb-6 flex items-center"
              >
                ← Назад к списку заказов
              </button>
              
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold">Оценка доставки для клиента</h2>
                <p className="text-gray-600 mt-2">
                  Заказ #{selectedOrder.id.slice(0, 8)} • {selectedOrder.address}
                </p>
              </div>
              
              <div className="border-t border-b border-gray-200 py-6 my-6">
                <iframe 
                  src={`/rate`} 
                  className="w-full h-[500px] border-0"
                  title="Форма оценки доставки"
                />
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">
                    Важно! Клиент должен самостоятельно ввести код, который ему сообщил администратор при оформлении заказа. Курьер не должен знать этот код и не должен вводить его за клиента.
                  </p>
                </div>
              </div>
            </div>
          )
        )
      )}
    </div>
  );
};

export default RatingLink;