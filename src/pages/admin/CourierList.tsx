import React, { useState, useEffect } from 'react';
import { getUsers, getCouriers, addUser, updateUser, deleteUser, getOrders } from '../../utils/localStorage';
import { User, Order } from '../../types';
import { Plus, Edit, Trash, Star, AlertCircle } from 'lucide-react';
import { addUser as addUserToSupabase, updateUser as updateUserInSupabase, deleteUser as deleteUserFromSupabase, getCouriers as getSupabaseCouriers } from '../../services/userService';

const CourierList: React.FC = () => {
  const [couriers, setCouriers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCourier, setCurrentCourier] = useState<Partial<User>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Load couriers and orders
    const loadData = async () => {
      setLoading(true);
      try {
        // Загружаем курьеров из Supabase
        const loadedCouriers = await getSupabaseCouriers();
        setCouriers(loadedCouriers);
        
        // Загружаем заказы из localStorage (они должны быть синхронизированы с Supabase)
        const loadedOrders = getOrders();
        setOrders(loadedOrders);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        // Fallback к локальным данным
        const localCouriers = getCouriers();
        setCouriers(localCouriers);
        const localOrders = getOrders();
        setOrders(localOrders);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  const getCourierStats = (courierId: string) => {
    const courierOrders = orders.filter(order => order.courierId === courierId);
    const completedOrders = courierOrders.filter(order => order.status === 'completed');
    const totalRatings = completedOrders.reduce((sum, order) => sum + (order.rating || 0), 0);
    const averageRating = completedOrders.length > 0 ? totalRatings / completedOrders.length : 0;
    
    return {
      totalOrders: courierOrders.length,
      completedOrders: completedOrders.length,
      averageRating: averageRating.toFixed(1)
    };
  };
  
  const handleOpenModal = (courier?: User) => {
    if (courier) {
      setCurrentCourier({ ...courier });
    } else {
      setCurrentCourier({
        role: 'courier'
      });
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentCourier({});
    setError('');
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentCourier(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!currentCourier.username || !currentCourier.password || !currentCourier.name) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      if (currentCourier.id) {
        // Update existing courier
        const updatedCourier = currentCourier as User;
        await updateUserInSupabase(updatedCourier);
        
        // Обновляем локальное состояние
        setCouriers(prevCouriers => 
          prevCouriers.map(courier => 
            courier.id === updatedCourier.id ? updatedCourier : courier
          )
        );
      } else {
        // Create new courier
        const users = getUsers();
        
        // Check if username already exists
        if (users.some(user => user.username === currentCourier.username)) {
          setError('Username already exists');
          return;
        }
        
        // Add new courier
        const newCourier: User = {
          ...currentCourier,
          id: crypto.randomUUID(),
          role: 'courier'
        } as User;
        
        await addUserToSupabase(newCourier);
        
        // Обновляем локальное состояние
        setCouriers(prevCouriers => [...prevCouriers, newCourier]);
      }
      
      handleCloseModal();
    } catch (err) {
      setError('An error occurred while saving the courier');
      console.error(err);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this courier?')) {
      // Check if courier has orders
      const courierOrders = orders.filter(order => order.courierId === id);
      
      if (courierOrders.length > 0) {
        alert('Cannot delete courier with assigned orders');
        return;
      }
      
      try {
        await deleteUserFromSupabase(id);
        
        // Обновляем локальное состояние
        setCouriers(couriers.filter(courier => courier.id !== id));
      } catch (error) {
        console.error('Ошибка при удалении курьера:', error);
        alert('Error deleting courier. Please try again.');
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
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Couriers</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-1" />
          Add Courier
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {couriers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No couriers found
                  </td>
                </tr>
              ) : (
                couriers.map((courier) => {
                  const stats = getCourierStats(courier.id);
                  
                  return (
                    <tr key={courier.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {courier.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {courier.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {stats.totalOrders}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {stats.completedOrders}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          {stats.averageRating}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleOpenModal(courier)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(courier.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Courier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {currentCourier.id ? 'Edit Courier' : 'Add New Courier'}
            </h2>
            
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <p>{error}</p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={currentCourier.name || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={currentCourier.username || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={currentCourier.password || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourierList;