export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      amenities: {
        Row: {
          icon: string
          id: string
          name: string
        }
        Insert: {
          icon: string
          id: string
          name: string
        }
        Update: {
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          color: string
          icon: string
          id: string
          name: string
        }
        Update: {
          color?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      peak_hours: {
        Row: {
          id: string
          spot_id: string
          time_range: string
        }
        Insert: {
          id?: string
          spot_id: string
          time_range: string
        }
        Update: {
          id?: string
          spot_id?: string
          time_range?: string
        }
        Relationships: [
          {
            foreignKeyName: "peak_hours_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "study_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          amenities_rating: number
          comfort_rating: number
          content: string
          date: string
          helpful: number
          id: string
          noise_rating: number
          rating: number
          spot_id: string
          user_avatar: string
          user_name: string
        }
        Insert: {
          amenities_rating: number
          comfort_rating: number
          content: string
          date: string
          helpful?: number
          id: string
          noise_rating: number
          rating: number
          spot_id: string
          user_avatar: string
          user_name: string
        }
        Update: {
          amenities_rating?: number
          comfort_rating?: number
          content?: string
          date?: string
          helpful?: number
          id?: string
          noise_rating?: number
          rating?: number
          spot_id?: string
          user_avatar?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "study_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      spot_amenities: {
        Row: {
          amenity_id: string
          id: string
          spot_id: string
        }
        Insert: {
          amenity_id: string
          id?: string
          spot_id: string
        }
        Update: {
          amenity_id?: string
          id?: string
          spot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spot_amenities_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spot_amenities_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "study_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      spot_categories: {
        Row: {
          category_id: string
          id: string
          spot_id: string
        }
        Insert: {
          category_id: string
          id?: string
          spot_id: string
        }
        Update: {
          category_id?: string
          id?: string
          spot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spot_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spot_categories_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "study_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      spot_images: {
        Row: {
          id: string
          spot_id: string
          url: string
        }
        Insert: {
          id?: string
          spot_id: string
          url: string
        }
        Update: {
          id?: string
          spot_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "spot_images_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "study_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      study_spots: {
        Row: {
          description: string
          hours_close: string
          hours_open: string
          id: string
          location_address: string
          location_lat: number
          location_lng: number
          name: string
          noise: number
          rating: number
          review_count: number
          seating: number
          wifi: number
        }
        Insert: {
          description: string
          hours_close: string
          hours_open: string
          id: string
          location_address: string
          location_lat: number
          location_lng: number
          name: string
          noise: number
          rating: number
          review_count: number
          seating: number
          wifi: number
        }
        Update: {
          description?: string
          hours_close?: string
          hours_open?: string
          id?: string
          location_address?: string
          location_lat?: number
          location_lng?: number
          name?: string
          noise?: number
          rating?: number
          review_count?: number
          seating?: number
          wifi?: number
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
