CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'courier')),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Отключаем все политики RLS для таблицы users
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Создаем новую политику, разрешающую анонимный доступ ко всем операциям
CREATE POLICY "Allow anonymous access to users" ON users
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Создаем новую политику, разрешающую аутентифицированным пользователям доступ ко всем операциям
CREATE POLICY "Allow authenticated access to users" ON users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert initial admin user
INSERT INTO users (username, password, role, name)
VALUES ('admin', 'admin123', 'admin', 'Admin User')
ON CONFLICT (username) DO NOTHING;

-- Insert initial courier users
INSERT INTO users (username, password, role, name)
VALUES 
  ('courier1', 'courier123', 'courier', 'John Doe'),
  ('courier2', 'courier123', 'courier', 'Jane Smith')
ON CONFLICT (username) DO NOTHING;