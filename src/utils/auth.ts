import { User } from '../types';
import { getUsers } from './localStorage';

// Store the current user in session storage
export const setCurrentUser = (user: User): void => {
  sessionStorage.setItem('currentUser', JSON.stringify(user));
};

// Get the current user from session storage
export const getCurrentUser = (): User | null => {
  const user = sessionStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
};

// Remove the current user from session storage
export const clearCurrentUser = (): void => {
  sessionStorage.removeItem('currentUser');
};

// Check if a user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getCurrentUser();
};

// Check if a user has admin role
export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return !!user && user.role === 'admin';
};

// Check if a user has courier role
export const isCourier = (): boolean => {
  const user = getCurrentUser();
  return !!user && user.role === 'courier';
};

// Authenticate a user
export const authenticateUser = (username: string, password: string): User | null => {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    setCurrentUser(user);
    return user;
  }
  
  return null;
};

// Logout a user
export const logout = (): void => {
  clearCurrentUser();
};