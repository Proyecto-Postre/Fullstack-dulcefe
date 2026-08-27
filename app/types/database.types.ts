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
      products: {
        Row: {
          id: number
          name: string
          price: number
          stock: number
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          price: number
          stock?: number
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          price?: number
          stock?: number
          image_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      raw_materials: {
        Row: {
          id: number
          name: string
          unit: string
          purchase_price: number
          purchase_quantity: number
          stock: number
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          unit: string
          purchase_price: number
          purchase_quantity: number
          stock?: number
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          unit?: string
          purchase_price?: number
          purchase_quantity?: number
          stock?: number
          created_at?: string
        }
        Relationships: []
      }
      recipe_items: {
        Row: {
          id: number
          product_id: number
          raw_material_id: number
          quantity_used: number
          created_at: string
        }
        Insert: {
          id?: number
          product_id: number
          raw_material_id: number
          quantity_used: number
          created_at?: string
        }
        Update: {
          id?: number
          product_id?: number
          raw_material_id?: number
          quantity_used?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_items_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          is_admin: boolean | null
          role: string | null
          phone: string | null
          points: number | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          is_admin?: boolean | null
          role?: string | null
          phone?: string | null
          points?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          is_admin?: boolean | null
          role?: string | null
          phone?: string | null
          points?: number | null
          created_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          profile_id: string | null
          customer_name: string
          customer_phone: string | null
          address: string | null
          total_amount: number
          status: string
          delivery_date: string | null
          delivery_time: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id?: string | null
          customer_name: string
          customer_phone?: string | null
          address?: string | null
          total_amount: number
          status?: string
          delivery_date?: string | null
          delivery_time?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          address?: string | null
          total_amount?: number
          status?: string
          delivery_date?: string | null
          delivery_time?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      order_items: {
        Row: {
          id: number
          order_id: string
          product_id: number
          quantity: number
          price_at_time: number
          created_at: string
        }
        Insert: {
          id?: number
          order_id: string
          product_id: number
          quantity: number
          price_at_time: number
          created_at?: string
        }
        Update: {
          id?: number
          order_id?: string
          product_id?: number
          quantity?: number
          price_at_time?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
