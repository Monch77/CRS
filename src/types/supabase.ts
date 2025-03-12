export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          password: string // В реальном приложении это должно быть хешировано
          role: 'admin' | 'courier'
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          password: string
          role: 'admin' | 'courier'
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          password?: string
          role?: 'admin' | 'courier'
          name?: string
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          address: string
          phone_number: string
          delivery_time: string
          comments?: string
          courier_id?: string
          courier_name?: string
          status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled'
          code?: string
          created_at: string
          completed_at?: string
          rating?: number
          is_positive?: boolean
          feedback?: string
        }
        Insert: {
          id?: string
          address: string
          phone_number: string
          delivery_time: string
          comments?: string
          courier_id?: string
          courier_name?: string
          status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled'
          code?: string
          created_at?: string
          completed_at?: string
          rating?: number
          is_positive?: boolean
          feedback?: string
        }
        Update: {
          id?: string
          address?: string
          phone_number?: string
          delivery_time?: string
          comments?: string
          courier_id?: string
          courier_name?: string
          status?: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled'
          code?: string
          created_at?: string
          completed_at?: string
          rating?: number
          is_positive?: boolean
          feedback?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}