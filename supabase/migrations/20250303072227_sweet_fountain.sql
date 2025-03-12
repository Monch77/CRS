/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `password` (text)
      - `role` (text, either 'admin' or 'courier')
      - `name` (text)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on `users` table
    - Add policy for authenticated users to read their own data
    - Add policy for admins to read all users
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'courier')),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy for admins to read all users
CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Policy for admins to insert users
CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Policy for admins to update users
CREATE POLICY "Admins can update users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Policy for admins to delete users
CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

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