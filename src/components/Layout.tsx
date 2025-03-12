import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Package, Home, Menu, X, Star, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, isAdmin, isCourier } = useAuth();
  const isRatingPage = location.pathname === '/rate';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className={`bg-blue-600 text-white shadow-md ${isRatingPage ? 'py-4' : ''}`}>
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          {user ? (
            <Link to="/dashboard" className="text-xl font-bold flex items-center">
              <Package className="mr-2" />
              <span className="hidden sm:inline">Courier Rating System</span>
              <span className="sm:hidden">CRS</span>
            </Link>
          ) : (
            <div className="text-xl font-bold flex items-center">
              <Package className="mr-2" />
              <span className="hidden sm:inline">Courier Rating System</span>
              <span className="sm:hidden">CRS</span>
            </div>
          )}
          
          {user && (
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center">
                <Link to="/profile" className="text-white hover:text-blue-200 mr-4 flex items-center">
                  <User className="h-5 w-5 mr-1" />
                  <span>{user.name}</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center text-white hover:text-blue-200"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  <span>Выход</span>
                </button>
              </div>
              
              <button 
                onClick={toggleMobileMenu}
                className="md:hidden text-white"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          )}
          
          {!user && !isRatingPage && (
            <Link to="/login" className="text-white hover:text-blue-200">
              Вход
            </Link>
          )}
        </div>
        
        {user && (
          <>
            {/* Desktop Navigation */}
            <nav className="bg-blue-700 hidden md:block">
              <div className="container mx-auto px-4">
                <ul className="flex space-x-4 overflow-x-auto py-2">
                  <li>
                    <Link to="/dashboard" className="text-white hover:text-blue-200 flex items-center px-2">
                      <Home className="w-4 h-4 mr-1" />
                      <span>Главная</span>
                    </Link>
                  </li>
                  
                  {isAdmin() && (
                    <>
                      <li>
                        <Link to="/orders" className="text-white hover:text-blue-200 flex items-center px-2">
                          <Package className="w-4 h-4 mr-1" />
                          <span>Заказы</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/couriers" className="text-white hover:text-blue-200 flex items-center px-2">
                          <User className="w-4 h-4 mr-1" />
                          <span>Курьеры</span>
                        </Link>
                      </li>
                    </>
                  )}
                  
                  {isCourier() && (
                    <>
                      <li>
                        <Link to="/courier-orders" className="text-white hover:text-blue-200 flex items-center px-2">
                          <Package className="w-4 h-4 mr-1" />
                          <span>Мои заказы</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/rate" className="text-white hover:text-blue-200 flex items-center px-2">
                          <Star className="w-4 h-4 mr-1" />
                          <span>Оценка доставки</span>
                        </Link>
                      </li>
                    </>
                  )}
                  
                  <li>
                    <Link to="/profile" className="text-white hover:text-blue-200 flex items-center px-2">
                      <Settings className="w-4 h-4 mr-1" />
                      <span>Профиль</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </nav>
            
            {/* Mobile Navigation */}
            {mobileMenuOpen && (
              <nav className="bg-blue-800 md:hidden">
                <div className="container mx-auto px-4">
                  <ul className="py-2 space-y-2">
                    <li>
                      <Link 
                        to="/profile" 
                        className="text-white hover:text-blue-200 flex items-center py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="w-5 h-5 mr-3" />
                        <span>{user.name}</span>
                      </Link>
                    </li>
                    
                    <li>
                      <Link 
                        to="/dashboard" 
                        className="text-white hover:text-blue-200 flex items-center py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Home className="w-5 h-5 mr-3" />
                        <span>Главная</span>
                      </Link>
                    </li>
                    
                    {isAdmin() && (
                      <>
                        <li>
                          <Link 
                            to="/orders" 
                            className="text-white hover:text-blue-200 flex items-center py-2"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Package className="w-5 h-5 mr-3" />
                            <span>Заказы</span>
                          </Link>
                        </li>
                        <li>
                          <Link 
                            to="/couriers" 
                            className="text-white hover:text-blue-200 flex items-center py-2"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <User className="w-5 h-5 mr-3" />
                            <span>Курьеры</span>
                          </Link>
                        </li>
                      </>
                    )}
                    
                    {isCourier() && (
                      <>
                        <li>
                          <Link 
                            to="/courier-orders" 
                            className="text-white hover:text-blue-200 flex items-center py-2"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Package className="w-5 h-5 mr-3" />
                            <span>Мои заказы</span>
                          </Link>
                        </li>
                        <li>
                          <Link 
                            to="/rate" 
                            className="text-white hover:text-blue-200 flex items-center py-2"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Star className="w-5 h-5 mr-3" />
                            <span>Оценка доставки</span>
                          </Link>
                        </li>
                      </>
                    )}
                    
                    <li>
                      <Link 
                        to="/profile" 
                        className="text-white hover:text-blue-200 flex items-center py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="w-5 h-5 mr-3" />
                        <span>Настройки профиля</span>
                      </Link>
                    </li>
                    
                    <li>
                      <button 
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="text-white hover:text-blue-200 flex items-center py-2 w-full text-left"
                      >
                        <LogOut className="w-5 h-5 mr-3" />
                        <span>Выход</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </nav>
            )}
          </>
        )}
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <Outlet />
      </main>
      
      <footer className="bg-gray-100 border-t">
        <div className="container mx-auto px-4 py-4 text-center text-gray-600">
          <p>&copy; 2025 Courier Rating System. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;