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
          email: string | null
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          color: string
          icon: string | null
          default_aisle_order: number
          is_system: boolean
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          icon?: string | null
          default_aisle_order: number
          is_system?: boolean
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          icon?: string | null
          default_aisle_order?: number
          is_system?: boolean
          user_id?: string | null
          created_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      template_items: {
        Row: {
          id: string
          template_id: string
          item_name: string
          category_id: string | null
          quantity: string | null
          brand: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          template_id: string
          item_name: string
          category_id?: string | null
          quantity?: string | null
          brand?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          item_name?: string
          category_id?: string | null
          quantity?: string | null
          brand?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      shopping_lists: {
        Row: {
          id: string
          user_id: string
          name: string | null
          created_at: string
          completed_at: string | null
          total_items: number
          checked_items: number
          total_spent: number | null
          store_name: string | null
          receipt_date: string | null
          subtotal: number | null
          tax: number | null
          receipt_image_uri: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          created_at?: string
          completed_at?: string | null
          total_items?: number
          checked_items?: number
          total_spent?: number | null
          store_name?: string | null
          receipt_date?: string | null
          subtotal?: number | null
          tax?: number | null
          receipt_image_uri?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          created_at?: string
          completed_at?: string | null
          total_items?: number
          checked_items?: number
          total_spent?: number | null
          store_name?: string | null
          receipt_date?: string | null
          subtotal?: number | null
          tax?: number | null
          receipt_image_uri?: string | null
        }
      }
      list_items: {
        Row: {
          id: string
          list_id: string
          item_name: string
          category_id: string | null
          quantity: string | null
          brand: string | null
          notes: string | null
          checked: boolean
          checked_at: string | null
          created_at: string
          price: number | null
          added_from_receipt: boolean
        }
        Insert: {
          id?: string
          list_id: string
          item_name: string
          category_id?: string | null
          quantity?: string | null
          brand?: string | null
          notes?: string | null
          checked?: boolean
          checked_at?: string | null
          created_at?: string
          price?: number | null
          added_from_receipt?: boolean
        }
        Update: {
          id?: string
          list_id?: string
          item_name?: string
          category_id?: string | null
          quantity?: string | null
          brand?: string | null
          notes?: string | null
          checked?: boolean
          checked_at?: string | null
          created_at?: string
          price?: number | null
          added_from_receipt?: boolean
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          aisle_order: Json | null
          default_template_id: string | null
          theme: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          aisle_order?: Json | null
          default_template_id?: string | null
          theme?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          aisle_order?: Json | null
          default_template_id?: string | null
          theme?: string
          created_at?: string
          updated_at?: string
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
