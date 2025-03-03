import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  getOrderById, 
  addOrder, 
  updateOrder, 
  deleteOrder, 
  getCouriers 
} from '../../utils/localStorage';
import { 
  addOrder as addOrderToSupabase, 
  updateOrder as updateOrderInSupabase, 
  deleteOrder as deleteOrderFromSupabase,
  getOrderById as getSupabaseOrderById
} from '../../services/orderService';
import { getCouriers as getSupabaseCouriers } from '../../services/userService';
import { generateUniqueCode } from '../../utils/codeGenerator';
import { Order, User } from '../../types';
import { ArrowLeft, Save, Trash, AlertCircle, Lock } from 'lucide-react';
import { getCurrentUser } from '../../utils/auth';

const OrderForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [couriers, setCouriers] = useState<User[]>([]);
  const [formData, setFormData] = useState<Partial<Order>>({
    address: '',
    phoneNumber: '',
    deliveryTime: '',
    comments: '',
    courierId: '',
    status: 'pending'
  });
  const [error, setError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load couriers from Supabase
        const availableCouriers = await getSupabaseCouriers();
        setCouriers(availableCouriers);
        
        // If editing, load order data from Supabase
        if (isEditMode && id) {
          const order = await getSupabaseOrderById(id);
          
          if (order) {
            setFormData(order);
            if (order.code) {
              setGeneratedCode(order.code);
            }
          } else {
            setError('Order not found');
          }
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        // Fallback to localStorage
        const localCouriers = getCouriers();
        setCouriers(localCouriers);
        
        if (isEditMode && id) {
          const localOrder = getOrderById(id);
          if (localOrder) {
            setFormData(localOrder);
            if (localOrder.code) {
              setGeneratedCode(localOrder.code);
            }
          } else {
            setError('Order not found');
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [isEditMode, id]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCourierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    const selectedCourier = couriers.find(courier => courier.id === value);
    
    setFormData(prev => ({
      ...prev,
      courierId: value,
      courierName: selectedCourier ? selectedCourier.name : undefined
    }));
    
    // Automatically generate code when courier is assigned
    if (value && !generatedCode) {
      handleGenerateCode();
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!formData.address || !formData.phoneNumber || !formData.deliveryTime) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      if (isEditMode && id) {
        // Update existing order
        const existingOrder = await getSupabaseOrderById(id);
        
        if (!existingOrder) {
          setError('Order not found');
          return;
        }
        
        // If status is changing from pending to assigned, generate a code
        if (existingOrder.status === 'pending' && formData.status === 'assigned' && formData.courierId) {
          if (!generatedCode) {
            const code = generateUniqueCode();
            setFormData(prev => ({ ...prev, code }));
            setGeneratedCode(code);
          }
        }
        
        // Если есть код, убедимся, что статус "assigned"
        let updatedStatus = formData.status;
        if (generatedCode && updatedStatus === 'pending') {
          updatedStatus = 'assigned';
        }
        
        const updatedOrder: Order = {
          ...existingOrder,
          ...formData,
          status: updatedStatus,
          code: formData.status === 'assigned' ? (generatedCode || existingOrder.code) : existingOrder.code
        } as Order;
        
        await updateOrderInSupabase(updatedOrder);
      } else {
        // Create new order with automatic timestamp
        const newOrder: Order = {
          ...formData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(), // Automatically set creation time
          status: generatedCode ? 'assigned' : 'pending' // If code is generated, set status to assigned
        } as Order;
        
        await addOrderToSupabase(newOrder);
      }
      
      navigate('/orders');
    } catch (err) {
      setError('An error occurred while saving the order');
      console.error(err);
    }
  };
  
  const handleOpenDeleteModal = () => {
    if (isEditMode && id) {
      setShowDeleteModal(true);
      setDeleteError('');
      setDeletePassword('');
    }
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
    
    if (isEditMode && id) {
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
  
  const handleGenerateCode = () => {
    if (formData.courierId) {
      const code = generateUniqueCode();
      setFormData(prev => ({ ...prev, code, status: 'assigned' }));
      setGeneratedCode(code);
    } else {
      setError('Please select a courier first');
    }
  };
  
  if (loading) {
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
        <h1 className="text-2xl font-bold">
          {isEditMode ? 'Edit Order' : 'Create New Order'}
        </h1>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Address *
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Customer Phone Number *
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
              
              <div className="mt-4">
                <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Time *
                </label>
                <input
                  type="datetime-local"
                  id="deliveryTime"
                  name="deliveryTime"
                  value={formData.deliveryTime || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Comments
              </label>
              <textarea
                id="comments"
                name="comments"
                value={formData.comments || ''}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="courierId" className="block text-sm font-medium text-gray-700 mb-1">
                Assign Courier
              </label>
              <select
                id="courierId"
                name="courierId"
                value={formData.courierId || ''}
                onChange={handleCourierChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a courier</option>
                {couriers.map(courier => (
                  <option key={courier.id} value={courier.id}>
                    {courier.name}
                  </option>
                ))}
              </select>
              
              {isEditMode && (
                <div className="mt-4">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Order Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status || 'pending'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={!!generatedCode && formData.status === 'pending'}
                  >
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  {!!generatedCode && formData.status === 'pending' && (
                    <p className="text-xs text-orange-600 mt-1">
                      Статус автоматически изменен на "Назначен", так как заказ имеет код
                    </p>
                  )}
                </div>
              )}
              
              {formData.courierId && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Customer Code
                    </label>
                    {!generatedCode && (
                      <button
                        type="button"
                        onClick={handleGenerateCode}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Generate Code
                      </button>
                    )}
                  </div>
                  
                  {generatedCode ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-blue-800">{generatedCode}</span>
                        <p className="text-xs text-gray-600 mt-1">
                          Код будет доступен курьеру для передачи клиенту
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-500 text-sm">
                      No code generated yet
                    </div>
                  )}
                </div>
              )}
              
              {isEditMode && formData.createdAt && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created At (Automatic)
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-700">
                    {new Date(formData.createdAt).toLocaleString()}
                  </div>
                </div>
              )}
              
              {isEditMode && formData.completedAt && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Completed At (Automatic)
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-700">
                    {new Date(formData.completedAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 flex justify-between">
            <div>
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleOpenDeleteModal}
                  className="flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                >
                  <Trash className="h-5 w-5 mr-1" />
                  Delete Order
                </button>
              )}
            </div>
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate('/orders')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Save className="h-5 w-5 mr-1" />
                Save Order
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-600">Подтверждение удаления</h2>
            
            <p className="mb-4 text-gray-700">
              Вы уверены, что хотите удалить этот заказ? Это действие нельзя отменить.
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

export default OrderForm;