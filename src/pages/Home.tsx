import React from 'react';
import { Link } from 'react-router-dom';
import { Package, User, Clock, Star, ExternalLink, Share2, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const { isAdmin, isCourier, user } = useAuth();
  const [copied, setCopied] = React.useState(false);
  
  const handleCopyLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Добро пожаловать в систему оценки курьеров</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Эффективная платформа для управления доставками и обратной связью от клиентов
        </p>
        
        <div className="mt-4 flex justify-center">
          <button 
            onClick={handleCopyLink}
            className="flex items-center bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 transition-colors"
          >
            <Share2 className="h-4 w-4 mr-2" />
            {copied ? 'Ссылка скопирована!' : 'Поделиться ссылкой'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {isAdmin() && (
          <>
            <Link 
              to="/orders/new" 
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Создать новый заказ</h2>
              </div>
              <p className="text-gray-600">
                Создайте новый заказ на доставку и назначьте его доступному курьеру
              </p>
            </Link>
            
            <Link 
              to="/orders" 
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Управление заказами</h2>
              </div>
              <p className="text-gray-600">
                Просмотр и управление всеми заказами, отслеживание их статуса и оценок
              </p>
            </Link>
            
            <Link 
              to="/couriers" 
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-3 rounded-full mr-4">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Управление курьерами</h2>
              </div>
              <p className="text-gray-600">
                Добавление, редактирование или удаление курьеров из системы и просмотр их производительности
              </p>
            </Link>
            
            <Link 
              to="/profile" 
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="bg-indigo-100 p-3 rounded-full mr-4">
                  <Settings className="h-6 w-6 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Настройки профиля</h2>
              </div>
              <p className="text-gray-600">
                Управление личной информацией и настройками безопасности вашего аккаунта
              </p>
            </Link>
          </>
        )}
        
        {isCourier() && (
          <>
            <Link 
              to="/courier-orders" 
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Мои заказы</h2>
              </div>
              <p className="text-gray-600">
                Просмотр назначенных вам доставок и отслеживание ваших оценок производительности
              </p>
            </Link>
            
            <Link 
              to="/rate" 
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="bg-yellow-100 p-3 rounded-full mr-4">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Страница оценки</h2>
              </div>
              <p className="text-gray-600">
                Перейти на страницу оценки доставки для помощи клиентам с оценкой вашей работы
              </p>
              <div className="mt-3 flex items-center text-blue-600">
                <ExternalLink className="h-4 w-4 mr-1" />
                <span className="text-sm">Открывается в том же окне</span>
              </div>
            </Link>
            
            <Link 
              to="/profile" 
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow md:col-span-2"
            >
              <div className="flex items-center mb-4">
                <div className="bg-indigo-100 p-3 rounded-full mr-4">
                  <Settings className="h-6 w-6 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Настройки профиля</h2>
              </div>
              <p className="text-gray-600">
                Управление личной информацией и настройками безопасности вашего аккаунта
              </p>
            </Link>
          </>
        )}
        
        {!isAdmin() && !isCourier() && (
          <Link 
            to="/rate" 
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow md:col-span-2"
          >
            <div className="flex items-center mb-4">
              <div className="bg-yellow-100 p-3 rounded-full mr-4">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Оценить доставку</h2>
            </div>
            <p className="text-gray-600">
              Введите код, предоставленный курьером, чтобы оценить качество доставки
            </p>
          </Link>
        )}
      </div>
      
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Как это работает</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Администратор создает новый заказ на доставку и назначает курьера</li>
          <li>Система генерирует уникальный код для клиента</li>
          <li>Администратор предоставляет код клиенту</li>
          <li>Курьер доставляет посылку</li>
          <li>Клиент использует код для оценки своего опыта доставки</li>
          <li>Система обновляет статус заказа и записывает оценку</li>
        </ol>
        
        <div className="mt-6 bg-white p-4 rounded-lg border border-blue-100">
          <h3 className="font-semibold mb-2">Демо-аккаунт для входа:</h3>
          <div>
            <p className="font-medium">Администратор:</p>
            <p>Логин: <span className="font-mono bg-gray-100 px-1 rounded">admin</span></p>
            <p>Пароль: <span className="font-mono bg-gray-100 px-1 rounded">admin123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;