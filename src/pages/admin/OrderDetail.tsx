import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOrderById, deleteOrder } from '../../utils/localStorage';
import { getOrderById as getSupabaseOrderById, deleteOrder as deleteOrderFromSupabase } from '../../services/orderService';
import { Order } from '../../types';
import { 
  ArrowLeft, 
  Edit, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MapPin,
  Phone,
  Calendar,
  MessageSquare,
  User,
  Star,
  ExternalLink,
  Copy,
  Check,
  Trash,
  Lock
} from 'lucide-react';
import { format } from 'date-fns';
import { getCurrentUser } from '../../utils/auth';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadOrder = async () => {
      if (id) {
        setLoading(true);
        try {
          // Try to get order from Supabase
          const foundOrder = await getSupabaseOrderById(id);
          
          if (foundOrder) {
            setOrder(foundOrder);
          } else {
            // Fallback to localStorage
            const localOrder = getOrderById(id);
            if (localOrder) {
              setOrder(localOrder);
            } else {
              setError('Order not found');
            }
          }
        } catch (error) {
          console.error('Ошибка при загрузке заказа:', error);
          // Fallback to localStorage
          const localOrder = getOrderById(id);
          if (localOrder) {
            setOrder(localOrder);
          } else {
            setError('Order not found');
          }
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadOrder();
  }, [id]);
  
  const getStatusIcon = () => {
    if (!order) return null;
    
    switch (order.status) {
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case 'assigned':
        return <AlertCircle className="h-6 w-6 text-blue-500" />;
      case 'in-progress':
        return <Clock className="h-6 w-6 text-purple-500" />;
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return null;
    }
  };
  
  const getStatusClass = () => {
    if (!order) return '';
    if (order.status !== 'completed') return 'bg-gray-100';
    return order.isPositive ? 'bg-green-100' : 'bg-red-100';
  };
  
  const renderRatingStars = () => {
    if (!order?.rating) return null;
    
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={`h-5 w-5 ${i <= order.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
        />
      );
    }
    
    return (
      <div className="flex items-center">
        {stars}
        <span className="ml-2 text-gray-700">{order.rating}/5</span>
      </div>
    );
  };
  
  const handleCopyCode = () => {
    if (order?.code) {
      navigator.clipboard.writeText(order.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleCopyLink = () => {
    if (order?.code) {
      const ratingUrl = `${window.location.origin}/rate?code=${order.code}`;
      navigator.clipboard.writeText(ratingUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };
  
  const handleOpenDeleteModal = () => {
    setShowDeleteModal(true);
    setDeleteError('');
    setDeletePassword('');
  };
  
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteError('');
    setDeletePassword('');
  };
  
  const handleDeleteConfirm = async () => {
    if (!deletePassword) {
      setDeleteError('Пожалуйста, введите пароль');
      return;
    }
    
    const currentUser = getCurrentUser();
    
    if (!currentUser || currentUser.password !== deletePassword) {
      setDeleteError('Неверный пароль');
      return;
    }
    
    if (id) {
      try {
        await deleteOrderFromSupabase(id);
        setShowDeleteModal(false);
        navigate('/orders');
      } catch (error) {
        console.error('Ошибка при удалении заказа:', error);
        setDeleteError('Ошибка при удалении заказа. Пожалуйста, попробуйте снова.');
      }
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <p>{error}</p>
        </div>
        <button
          onClick={() => navigate('/orders')}
          className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back to Orders
        </button>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/orders')}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Order Details</h1>
        
        <div className="ml-auto flex items-center space-x-4">
          {(order.status === 'pending' || order.status === 'assigned') && (
            <Link 
              to={`/orders/${order.id}/edit`} 
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <Edit className="h-5 w-5 mr-1" />
              Edit Order
            </Link>
          )}
          
          <button
            onClick={handleOpenDeleteModal}
            className="flex items-center text-red-600 hover:text-red-800"
          >
            <Trash className="h-5 w-5 mr-1" />
            Delete
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className={`p-2 rounded-full ${getStatusClass()}`}>
                  {getStatusIcon()}
                </div>
                <div className="ml-3">
                  <h2 className="text-lg font-semibold">
                    Order #{order.id.slice(0, 8)}
                  </h2>
                  <p className="text-gray-500 capitalize">{order.status}</p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Delivery Address</p>
                      <p className="mt-1">{order.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Customer Phone</p>
                      <p className="mt-1">{order.phoneNumber}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Delivery Time</p>
                      <p className="mt-1">
                        {order.deliveryTime ? format(new Date(order.deliveryTime), 'dd/MM/yyyy HH:mm') : '-'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <User className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Assigned Courier</p>
                      <p className="mt-1">{order.courierName || 'Not assigned'}</p>
                    </div>
                  </div>
                </div>
                
                {order.comments && (
                  <div className="mt-4 flex items-start">
                    <MessageSquare className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Additional Comments</p>
                      <p className="mt-1">{order.comments}</p>
                    </div>
                  </div>
                )}
                
                {order.feedback && (
                  <div className="mt-4 flex items-start">
                    <MessageSquare className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Customer Feedback</p>
                      <p className="mt-1 p-2 bg-gray-50 rounded border border-gray-100">{order.feedback}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Order Information</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Created At</p>
                <p className="mt-1">
                  {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              
              {order.completedAt && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Completed At</p>
                  <p className="mt-1">
                    {format(new Date(order.completedAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              )}
              
              {order.code && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Customer Code</p>
                  <div className="mt-1 bg-blue-50 border border-blue-200 rounded-md p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-blue-800">{order.code}</span>
                      <button 
                        onClick={handleCopyCode}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Копировать код"
                      >
                        {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Предоставьте этот код клиенту для оценки доставки
                    </p>
                    
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <p className="text-xs font-medium text-gray-600 mb-1">Ссылка для оценки:</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-blue-800 truncate">
                          {window.location.origin}/rate?code={order.code}
                        </span>
                        <button 
                          onClick={handleCopyLink}
                          className="text-blue-600 hover:text-blue-800 p-1 ml-2 flex-shrink-0"
                          title="Копировать ссылку"
                        >
                          {copiedLink ? <Check className="h-5 w-5" /> : <ExternalLink className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {order.rating && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Customer Rating</p>
                  <div className="mt-1">
                    {renderRatingStars()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-600">Подтверждение удаления</h2>
            
            <p className="mb-4 text-gray-700">
              Вы уверены, что хотите удалить заказ #{order.id.slice(0, 8)}? Это действие нельзя отменить.
            </p>
            
            <div className="mb-4">
              <label htmlFor="deletePassword" className="block text-sm font-medium text-gray-700 mb-1">
                Введите ваш пароль для подтверждения
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  id="deletePassword"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Введите пароль"
                />
              </div>
              
              {deleteError && (
                <p className="mt-2 text-red-600 text-sm">{deleteError}</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Отмена
              </button>
              
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;