import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';
import { updateUser } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Save, User as UserIcon, Lock, ArrowLeft } from 'lucide-react';

const ProfileSettings: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<User>>({});
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [changePassword, setChangePassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        password: user.password
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name) {
      setError('Имя не может быть пустым');
      return false;
    }

    if (changePassword) {
      if (!currentPassword) {
        setError('Введите текущий пароль');
        return false;
      }

      if (currentPassword !== user?.password) {
        setError('Неверный текущий пароль');
        return false;
      }

      if (!newPassword) {
        setError('Введите новый пароль');
        return false;
      }

      if (newPassword.length < 6) {
        setError('Новый пароль должен содержать не менее 6 символов');
        return false;
      }

      if (newPassword !== confirmPassword) {
        setError('Пароли не совпадают');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Если меняем пароль, обновляем его в данных формы
      const dataToUpdate = {
        ...formData,
        password: changePassword ? newPassword : formData.password
      } as User;

      await updateUser(dataToUpdate);

      setSuccess('Профиль успешно обновлен');
      
      // Если пароль был изменен, выходим из системы
      if (changePassword) {
        setTimeout(() => {
          signOut();
          navigate('/login');
        }, 2000);
        setSuccess('Пароль изменен. Выполняется выход из системы...');
      }
      
      // Сбрасываем поля пароля
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setChangePassword(false);
    } catch (err) {
      console.error('Ошибка при обновлении профиля:', err);
      setError('Произошла ошибка при обновлении профиля');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
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
          onClick={() => navigate('/dashboard')}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Настройки профиля</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
              Личная информация
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Имя пользователя
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Имя пользователя нельзя изменить</p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Полное имя *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Роль
                </label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  value={formData.role === 'admin' ? 'Администратор' : 'Курьер'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Роль нельзя изменить</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <Lock className="h-5 w-5 mr-2 text-blue-600" />
                Изменение пароля
              </h2>
              <button
                type="button"
                onClick={() => setChangePassword(!changePassword)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {changePassword ? 'Отменить' : 'Изменить пароль'}
              </button>
            </div>

            {changePassword && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Текущий пароль *
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Новый пароль *
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Минимум 6 символов</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Подтверждение пароля *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                  <p className="text-sm text-yellow-800">
                    После изменения пароля вам потребуется войти в систему заново.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Сохранение...
                </span>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-1" />
                  Сохранить изменения
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;