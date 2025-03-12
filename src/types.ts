export type Role = 'admin' | 'courier';

export type User = {
  id: string;
  username: string;
  password: string; // In a real app, this would be hashed
  role: Role;
  name: string;
};

export type OrderStatus = 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';

export type Rating = 1 | 2 | 3 | 4 | 5;

export type Order = {
  id: string;
  address: string;
  phoneNumber: string;
  deliveryTime: string;
  comments?: string;
  courierId?: string;
  courierName?: string;
  status: OrderStatus;
  code?: string;
  createdAt: string;
  completedAt?: string;
  rating?: Rating;
  isPositive?: boolean;
  feedback?: string; // Added field for customer feedback
};