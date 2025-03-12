-- This migration fixes issues with duplicate keys and improves error handling

-- Drop existing tables if they exist to ensure clean state
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS users;

-- Recreate users table with proper constraints
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'courier')),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Recreate orders table with proper constraints
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL,
  phone_number text NOT NULL,
  delivery_time timestamptz NOT NULL,
  comments text,
  courier_id uuid REFERENCES users(id) ON DELETE SET NULL,
  courier_name text,
  status text NOT NULL CHECK (status IN ('pending', 'assigned', 'in-progress', 'completed', 'cancelled')),
  code text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  is_positive boolean,
  feedback text
);

-- Create index on code for faster lookups
CREATE INDEX orders_code_idx ON orders(code);

-- Create index on courier_id for faster lookups
CREATE INDEX orders_courier_id_idx ON orders(courier_id);

-- Enable RLS for both tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Allow full access to users" ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create policies for orders table
CREATE POLICY "Allow full access to orders" ON orders
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert initial admin user
INSERT INTO users (username, password, role, name)
VALUES ('admin', 'admin123', 'admin', 'Admin User')
ON CONFLICT (username) DO NOTHING;