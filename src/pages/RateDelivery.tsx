import React, { useState, useEffect } from 'react';
import { getOrderByCode, updateOrder } from '../services/orderService';
import { invalidateCode, isCodeValid } from '../utils/codeGenerator';
import { SmilePlus, Smile, Meh, Frown, Frown as FrownPlus, Package, LogIn, ThumbsUp } from 'lucide-react';
import { Order, Rating } from '../types';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RateDelivery: React.FC = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  
  useEffect(() => {
    // Check if code is provided in URL query parameters
    const params = new URLSearchParams(location.search);
    const codeParam = params.get('code');
    
    if (codeParam) {
      setCode(codeParam);
      handleCodeValidation(codeParam);
    }
  }, [location]);
  
  const handleCodeValidation = async (codeToValidate: string) => {
    setError('');
    setLoading(true);
    
    try {
      if (!codeToValidate) {
        setError('Пожалуйста, введите код');
        setLoading(false);
        return;
      }
      
      // Normalize the code to uppercase
      const normalizedCode = codeToValidate.toUpperCase();
      
      // Get order by code directly from service
      const foundOrder = await getOrderByCode(normalizedCode);
      
      if (!foundOrder) {
        setError('Неверный или просроченный код');
        setLoading(false);
        return;
      }
      
      // Check if order status is valid for rating (assigned or in-progress)
      if (foundOrder.status !== 'assigned' && foundOrder.status !== 'in-progress') {
        setError('Этот код больше не действителен для оценки');
        setLoading(false);
        return;
      }
      
      setOrder(foundOrder);
    } catch (err) {
      console.error('Error validating code:', err);
      setError('Произошла ошибка при проверке кода');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCodeValidation(code);
  };
  
  const handleRatingSelect = (rating: Rating) => {
    setSelectedRating(rating);
  };
  
  const handleRatingSubmit = async () => {
    if (!order || selectedRating === null) return;
    
    setSubmitting(true);
    
    try {
      // Calculate if rating is positive (4-5) or negative (1-3)
      const isPositive = selectedRating >= 4;
      
      // Update order with rating
      const updatedOrder: Order = {
        ...order,
        status: 'completed',
        rating: selectedRating,
        isPositive,
        completedAt: new Date().toISOString(),
        feedback: feedback.trim() || undefined
      };
      
      await updateOrder(updatedOrder);
      invalidateCode(order.code || '');
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting rating:', err);
      setError('Произошла ошибка при отправке оценки');
    } finally {
      setSubmitting(false);
    }
  };
  
  const renderRatingForm = () => {
    const ratings = [
      { value: 1, icon: FrownPlus, label: 'Очень плохо', color: 'text-red-500' },
      { value: 2, icon: Frown, label: 'Плохо', color: 'text-orange-500' },
      { value: 3, icon: Meh, label: 'Средне', color: 'text-yellow-500' },
      { value: 4, icon: Smile, label: 'Хорошо', color: 'text-green-500' },
      { value: 5, icon: SmilePlus, label: 'Отлично', color: 'text-emerald-500' }
    ];
    
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Оцените вашу доставку</h2>
        
        {order && (
          <div className="mb-4 bg-blue-50 p-3 rounded-lg text-left">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Адрес доставки:</span> {order.address}
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-5 gap-1 mb-6">
          {ratings.map((rating) => {
            const Icon = rating.icon;
            const isSelected = selectedRating === rating.value;
            
            return (
              <button
                key={rating.value}
                onClick={() => handleRatingSelect(rating.value as Rating)}
                className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                  isSelected 
                    ? 'bg-blue-100 border-2 border-blue-500 transform scale-105' 
                    : 'hover:bg-gray-100 border-2 border-transparent'
                }`}
                disabled={submitting}
              >
                <Icon 
                  className={`h-8 w-8 mb-1 ${rating.color}`} 
                />
                <span className={`text-xs ${isSelected ? 'font-semibold' : ''}`}>
                  {rating.label}
                </span>
              </button>
            );
          })}
        </div>
        
        <div className="mb-6">
          <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2 text-left">
            Комментарий (необязательно)
          </label>
          <textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Расскажите подробнее о вашем опыте..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            disabled={submitting}
          />
        </div>
        
        <button
          onClick={handleRatingSubmit}
          disabled={selectedRating === null || submitting}
          className={`w-full py-3 rounded-md flex items-center justify-center ${
            selectedRating === null || submitting
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {submitting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Отправка...
            </span>
          ) : (
            <>
              <ThumbsUp className="h-5 w-5 mr-2" />
              Отправить оценку
            </>
          )}
        </button>
      </div>
    );
  };
  
  const renderThankYou = () => {
    return (
      <div className="text-center">
        <div className="bg-green-100 text-green-800 p-6 rounded-lg mb-6">
          <div className="flex justify-center mb-3">
            <div className="bg-green-200 p-3 rounded-full">
              <ThumbsUp className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Спасибо!</h2>
          <p>Ваша оценка успешно отправлена.</p>
          {selectedRating && (
            <div className="mt-3 flex justify-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  filled={i < selectedRating} 
                  className="mx-1" 
                />
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={() => {
            setCode('');
            setOrder(null);
            setSelectedRating(null);
            setSubmitted(false);
            setFeedback('');
          }}
          className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Оценить другую доставку
        </button>
      </div>
    );
  };
  
  // Simple star component for the thank you screen
  const Star = ({ filled, className }: { filled: boolean, className?: string }) => (
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill={filled ? "currentColor" : "none"} 
      stroke="currentColor" 
      strokeWidth="2" 
      className={`text-yellow-500 ${className || ''}`}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
  
  // Redirect if admin
  if (isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="max-w-md mx-auto px-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-3">
          <Package className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold">Оценка доставки</h1>
        <p className="text-gray-600 mt-1 text-sm">
          Пожалуйста, введите код, предоставленный курьером
        </p>
      </div>
      
      {!user && !isAdmin() && (
        <div className="absolute top-4 right-4">
          <Link to="/login" className="flex items-center bg-blue-700 text-white px-3 py-1 rounded-md hover:bg-blue-800 text-sm">
            <LogIn className="h-4 w-4 mr-1" />
            <span>Вход</span>
          </Link>
        </div>
      )}
      
      <div className="bg-white p-5 rounded-lg shadow-md">
        {!order && !submitted && (
          <form onSubmit={handleCodeSubmit} className="flex flex-col">
            <div className="mb-4">
              <label htmlFor="code" className="block text-gray-700 font-medium mb-2">
                Код доставки
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest"
                placeholder="A1"
                maxLength={2}
                autoFocus
                inputMode="text"
                autoCapitalize="characters"
                disabled={loading}
              />
              {error && (
                <div className="mt-2 bg-red-50 border-l-4 border-red-500 p-2">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>
            
            <button
              type="submit"
              className={`w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Проверка...
                </span>
              ) : (
                'Продолжить'
              )}
            </button>
          </form>
        )}
        
        {order && !submitted && renderRatingForm()}
        
        {submitted && renderThankYou()}
      </div>
      
      <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-base font-semibold mb-2">Как это работает</h3>
        <ol className="list-decimal list-inside space-y-1 text-gray-700 text-sm">
          <li>Введите код, предоставленный курьером</li>
          <li>Оцените качество доставки</li>
           <li>Оставьте комментарий (по желанию)</li>
          <li>Отправьте вашу оценку</li>
        </ol>
      </div>
    </div>
  );
};

export default RateDelivery;