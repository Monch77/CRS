import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initializeAndSyncData, syncAllDataToSupabase } from './utils/localStorage';
import { AuthProvider } from './context/AuthContext';
import { checkSupabaseConnection } from './lib/supabase';

// Layout and Auth
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import RateDelivery from './pages/RateDelivery';

// Admin Pages
import OrderList from './pages/admin/OrderList';
import OrderForm from './pages/admin/OrderForm';
import OrderDetail from './pages/admin/OrderDetail';
import CourierList from './pages/admin/CourierList';
import ProfileSettings from './pages/admin/ProfileSettings';

// Courier Pages
import CourierOrders from './pages/courier/CourierOrders';
import RatingLink from './pages/courier/RatingLink';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Set the root path to the rating page */}
        <Route path="/" element={<Navigate to="/rate" replace />} />
        
        <Route path="/" element={<Layout />}>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Rating page accessible to everyone */}
          <Route path="/rate" element={<RateDelivery />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/orders" element={
            <ProtectedRoute requiredRole="admin">
              <OrderList />
            </ProtectedRoute>
          } />
          
          <Route path="/orders/new" element={
            <ProtectedRoute requiredRole="admin">
              <OrderForm />
            </ProtectedRoute>
          } />
          
          <Route path="/orders/:id" element={
            <ProtectedRoute requiredRole="admin">
              <OrderDetail />
            </ProtectedRoute>
          } />
          
          <Route path="/orders/:id/edit" element={
            <ProtectedRoute requiredRole="admin">
              <OrderForm />
            </ProtectedRoute>
          } />
          
          <Route path="/couriers" element={
            <ProtectedRoute requiredRole="admin">
              <CourierList />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          } />
          
          {/* Courier Routes */}
          <Route path="/courier-orders" element={
            <ProtectedRoute requiredRole="courier">
              <CourierOrders />
            </ProtectedRoute>
          } />
          
          <Route path="/rating-help" element={
            <ProtectedRoute requiredRole="courier">
              <RatingLink />
            </ProtectedRoute>
          } />
          
          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/rate" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  useEffect(() => {
    // Initialize local storage with mock data for fallback
    // This will clear existing data and set up fresh mock data
    initializeAndSyncData();
    
    // Проверяем соединение с Supabase перед синхронизацией
    const syncWithSupabase = async () => {
      const isConnected = await checkSupabaseConnection();
      if (isConnected) {
        console.log('Соединение с Supabase установлено, начинаем синхронизацию...');
        // Синхронизируем все данные с Supabase при запуске приложения
        await syncAllDataToSupabase();
      } else {
        console.warn('Нет соединения с Supabase, работаем с локальными данными');
      }
    };
    
    syncWithSupabase();
  }, []);

  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;