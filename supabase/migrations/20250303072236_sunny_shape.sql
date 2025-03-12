/*
  # Create orders table

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `address` (text)
      - `phone_number` (text)
      - `delivery_time` (timestamp)
      - `comments` (text, nullable)
      - `courier_id` (uuid, foreign key to users, nullable)
      - `courier_name` (text, nullable)
      - `status` (text, one of: 'pending', 'assigned', 'in-progress', 'completed', 'cancelled')
      - `code` (text, nullable)
      - `created_at` (timestamp)
      - `completed_at` (timestamp, nullable)
      - `rating` (integer, nullable)
      - `is_positive` (boolean, nullable)
      - `feedback` (text, nullable)
  2. Security
    - Enable RLS on `orders` table
    - Add policies for admins to perform all operations
    - Add policies for couriers to read and update their assigned orders
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL,
  phone_number text NOT NULL,
  delivery_time timestamptz NOT NULL,
  comments text,
  courier_id uuid REFERENCES users(id),
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
CREATE INDEX IF NOT EXISTS orders_code_idx ON orders(code);

-- Create index on courier_id for faster lookups
CREATE INDEX IF NOT EXISTS orders_courier_id_idx ON orders(courier_id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy for admins to read all orders
CREATE POLICY "Admins can read all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Policy for couriers to read their assigned orders
CREATE POLICY "Couriers can read their assigned orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    courier_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Policy for admins to insert orders
CREATE POLICY "Admins can insert orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Policy for admins to update orders
CREATE POLICY "Admins can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Policy for couriers to update their assigned orders
CREATE POLICY "Couriers can update their assigned orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (courier_id = auth.uid())
  WITH CHECK (
    courier_id = auth.uid() AND
    (status = 'in-progress' OR status = 'completed')
  );

-- Policy for admins to delete orders
CREATE POLICY "Admins can delete orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Policy for anonymous users to update orders with rating
CREATE POLICY "Anonymous users can update orders with rating"
  ON orders
  FOR UPDATE
  TO anon
  USING (
    status = 'assigned' OR status = 'in-progress'
  )
  WITH CHECK (
    (status = 'completed') AND
    (rating IS NOT NULL) AND
    (completed_at IS NOT NULL)
  );