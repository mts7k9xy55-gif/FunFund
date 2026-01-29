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
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          goal_amount: number
          current_amount: number
          image_url: string | null
          category: string | null
          status: 'draft' | 'active' | 'completed' | 'cancelled'
          start_date: string | null
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          goal_amount: number
          current_amount?: number
          image_url?: string | null
          category?: string | null
          status?: 'draft' | 'active' | 'completed' | 'cancelled'
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          goal_amount?: number
          current_amount?: number
          image_url?: string | null
          category?: string | null
          status?: 'draft' | 'active' | 'completed' | 'cancelled'
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contributions: {
        Row: {
          id: string
          project_id: string
          user_id: string | null
          amount: number
          message: string | null
          is_anonymous: boolean
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id?: string | null
          amount: number
          message?: string | null
          is_anonymous?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string | null
          amount?: number
          message?: string | null
          is_anonymous?: boolean
          created_at?: string
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
