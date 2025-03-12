import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOrders, deleteOrder } from '../../utils/localStorage';
import { getOrders as getSupabaseOrders, deleteOrder as deleteOrderFromSupabase } from '../../services/orderService';
import { Order, OrderStatus } from '../../types';
import { Plus, Filter, Download, Clock, CheckCircle, XCircle, AlertCircle, Trash, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { getCurrentUser } from '../../utils/auth';

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [courierFilter, setCourierFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Load orders from Supabase
    const loadOrders = async () => {
      setLoading(true);
      try {
        const loadedOrders = await getSupabaseOrders();
        setOrders(loadedOrders);
        setFilteredOrders(loadedOrders);
      } catch (error) {
        console.error('Ошибка при загрузке заказов из Supabase:', error);
        // Fallback to localStorage
        const localOrders = getOrders();
        setOrders(localOrders);
        setFilteredOrders(localOrders);
      } finally {
        setLoading(false);
      }
    };
    
    loadOrders();
  }, []);
  
  useEffect(() => {
    // Apply filters
    let result = orders;
    
    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }
    
    // Filter by date
    if (dateFilter) {
      const filterDate = new Date(dateFilter).toDateString();
      result = result.filter(order => {
        const orderDate = new Date(order.createdAt).toDateString();
        return orderDate === filterDate;
      });
    }
    
    // Filter by courier
    if (courierFilter) {
      result = result.filter(order => 
        order.courierName?.toLowerCase().includes(courierFilter.toLowerCase())
      );
    }
    
    setFilteredOrders(result);
  }, [orders, statusFilter, dateFilter, courierFilter]);
  
  const handleExport = () => {
    // Create CSV content
    const headers = ['ID', 'Address', 'Phone', 'Delivery Time', 'Courier', 'Status', 'Rating', 'Created', 'Completed'];
    
    const csvContent = [
      headers.join(','),
      ...filteredOrders.map(order => [
        order.id,
        `"${order.address.replace(/"/g, '""')}"`,
        order.phoneNumber,
        order.deliveryTime,
        order.courierName || '',
        order.status,
        order.rating || '',
        order.createdAt,
        order.completedAt || ''
      ].join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
  
  const handleOpenDeleteModal = (order: Order) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
    setDeleteError('');
    setDeletePassword('');
  };
  
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setOrderToDelete(null);
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
    
    if (orderToDelete) {
      try {
        await deleteOrderFromSupabase(orderToDelete.id);
        
        // Update local state
        setOrders(prevOrders => prevOrders.filter(order => order.id !== orderToDelete.id));
        
        setShowDeleteModal(false);
        setOrderToDelete(null);
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
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Link 
          to="/orders/new" 
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-1" />
          New Order
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              id="dateFilter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="courierFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Courier Name
            </label>
            <input
              type="text"
              id="courierFilter"
              value={courierFilter}
              onChange={(e) => setCourierFilter(e.target.value)}
              placeholder="Search by courier name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleExport}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <Download className="h-5 w-5 mr-1" />
            Export to CSV
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Courier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className={getStatusClass(order)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(order.status)}
                        <span className="ml-2 capitalize">{order.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.code || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{order.address}</div>
                      <div className="text-sm text-gray-500">{order.phoneNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.courierName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.completedAt 
                        ? format(new Date(order.completedAt), 'dd/MM/yyyy HH:mm') 
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.rating ? `${order.rating}/5` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <Link 
                          to={`/orders/${order.id}`} 
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        
                        {(order.status === 'pending' || order.status === 'assigned') && (
                          <Link 
                            to={`/orders/${order.id}/edit`} 
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </Link>
                        )}
                        
                        <button
                          onClick={() => handleOpenDeleteModal(order)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && orderToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-600">Подтверждение удаления</h2>
            
            <p className="mb-4 text-gray-700">
              Вы уверены, что хотите удалить заказ #{orderToDelete.id.slice(0, 8)}? Это действие нельзя отменить.
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

export default OrderList;