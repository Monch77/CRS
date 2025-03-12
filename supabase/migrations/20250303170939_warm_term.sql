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

-- Отключаем все политики RLS для таблицы orders
DROP POLICY IF EXISTS "Admins can read all orders" ON orders;
DROP POLICY IF EXISTS "Couriers can read their assigned orders" ON orders;
DROP POLICY IF EXISTS "Admins can insert orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Couriers can update their assigned orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
DROP POLICY IF EXISTS "Anonymous users can update orders with rating" ON orders;
DROP POLICY IF EXISTS "Allow anonymous access to orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated access to orders" ON orders;

-- Создаем новую политику, разрешающую анонимный доступ ко всем операциям
CREATE POLICY "Allow anonymous access to orders" ON orders
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Создаем новую политику, разрешающую аутентифицированным пользователям доступ ко всем операциям
CREATE POLICY "Allow authenticated access to orders" ON orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);