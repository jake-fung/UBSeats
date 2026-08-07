import { TimeSlot } from "@/utils/hoursUtils";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  public: {
    Tables: {
      amenities: {
        Row: {
          icon: string;
          id: string;
          name: string;
        };
        Insert: {
          icon: string;
          id: string;
          name: string;
        };
        Update: {
          icon?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      building_hours: {
        Row: {
          building_uuid: string;
          closes_at: string | null;
          day_of_week: number;
          id: string;
          opens_at: string | null;
        };
        Insert: {
          building_uuid: string;
          closes_at?: string | null;
          day_of_week: number;
          id?: string;
          opens_at?: string | null;
        };
        Update: {
          building_uuid?: string;
          closes_at?: string | null;
          day_of_week?: number;
          id?: string;
          opens_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'building_hours_building_uuid_fkey';
            columns: ['building_uuid'];
            isOneToOne: false;
            referencedRelation: 'buildings';
            referencedColumns: ['uuid'];
          },
        ];
      };
      building_images: {
        Row: {
          building_uuid: string;
          id: string;
          image_url: string | null;
        };
        Insert: {
          building_uuid?: string;
          id?: string;
          image_url?: string | null;
        };
        Update: {
          building_uuid?: string;
          id?: string;
          image_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'building_images_building_uuid_fkey';
            columns: ['building_uuid'];
            isOneToOne: false;
            referencedRelation: 'buildings';
            referencedColumns: ['uuid'];
          },
        ];
      };
      building_rooms: {
        Row: {
          building_uuid: string;
          capacity: number | null;
          library_id: string | null;
          link: string | null;
          room_name: string | null;
          source_key: string | null;
          uuid: string;
        };
        Insert: {
          building_uuid?: string;
          capacity?: number | null;
          library_id?: string | null;
          link?: string | null;
          room_name?: string | null;
          source_key?: string | null;
          uuid?: string;
        };
        Update: {
          building_uuid?: string;
          capacity?: number | null;
          library_id?: string | null;
          link?: string | null;
          room_name?: string | null;
          source_key?: string | null;
          uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'building_rooms_building_uuid_fkey';
            columns: ['building_uuid'];
            isOneToOne: false;
            referencedRelation: 'buildings';
            referencedColumns: ['uuid'];
          },
          {
            foreignKeyName: 'building_rooms_library_id_fkey';
            columns: ['library_id'];
            isOneToOne: false;
            referencedRelation: 'libraries';
            referencedColumns: ['id'];
          },
        ];
      };
      buildings: {
        Row: {
          bldg_code: string;
          bldg_usage: string | null;
          lat: number;
          lng: number;
          name: string;
          primary_address: string | null;
          uuid: string;
        };
        Insert: {
          bldg_code: string;
          bldg_usage?: string | null;
          lat: number;
          lng: number;
          name: string;
          primary_address?: string | null;
          uuid?: string;
        };
        Update: {
          bldg_code?: string;
          bldg_usage?: string | null;
          lat?: number;
          lng?: number;
          name?: string;
          primary_address?: string | null;
          uuid?: string;
        };
        Relationships: [];
      };
      classroom_bookings: {
        Row: {
          ends_at: string;
          id: string;
          room_uuid: string;
          scraped_at: string;
          starts_at: string;
          title: string | null;
        };
        Insert: {
          ends_at: string;
          id?: string;
          room_uuid: string;
          scraped_at?: string;
          starts_at: string;
          title?: string | null;
        };
        Update: {
          ends_at?: string;
          id?: string;
          room_uuid?: string;
          scraped_at?: string;
          starts_at?: string;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'classroom_bookings_room_uuid_fkey';
            columns: ['room_uuid'];
            isOneToOne: false;
            referencedRelation: 'building_rooms';
            referencedColumns: ['uuid'];
          },
        ];
      };
      room_availability: {
        Row: {
          available_until: string | null;
          checked_at: string;
          is_available_now: boolean;
          next_available_at: string | null;
          room_uuid: string;
          slots?: TimeSlot[];
        };
        Insert: {
          available_until?: string | null;
          checked_at?: string;
          is_available_now: boolean;
          next_available_at?: string | null;
          room_uuid: string;
          slots?: string[];
        };
        Update: {
          available_until?: string | null;
          checked_at?: string;
          is_available_now?: boolean;
          next_available_at?: string | null;
          room_uuid?: string;
          slots?: string[];
        };
        Relationships: [
          {
            foreignKeyName: 'room_availability_room_uuid_fkey';
            columns: ['room_uuid'];
            isOneToOne: true;
            referencedRelation: 'building_rooms';
            referencedColumns: ['uuid'];
          },
        ];
      };
      room_images: {
        Row: {
          id: string;
          image_url: string;
          room_uuid: string;
        };
        Insert: {
          id?: string;
          image_url: string;
          room_uuid: string;
        };
        Update: {
          id?: string;
          image_url?: string;
          room_uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'cafe_images_room_uuid_fkey';
            columns: ['room_uuid'];
            isOneToOne: false;
            referencedRelation: 'building_rooms';
            referencedColumns: ['uuid'];
          },
        ];
      };
      categories: {
        Row: {
          color: string;
          icon: string;
          id: string;
          name: string;
        };
        Insert: {
          color: string;
          icon: string;
          id: string;
          name: string;
        };
        Update: {
          color?: string;
          icon?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      libraries: {
        Row: {
          building_uuid: string;
          id: string;
          name: string;
        };
        Insert: {
          building_uuid: string;
          id?: string;
          name: string;
        };
        Update: {
          building_uuid?: string;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'libraries_building_uuid_fkey';
            columns: ['building_uuid'];
            isOneToOne: false;
            referencedRelation: 'buildings';
            referencedColumns: ['uuid'];
          },
        ];
      };
      library_hours: {
        Row: {
          closes_at: string | null;
          day_of_week: number;
          id: string;
          library_id: string;
          opens_at: string | null;
        };
        Insert: {
          closes_at?: string | null;
          day_of_week: number;
          id?: string;
          library_id: string;
          opens_at?: string | null;
        };
        Update: {
          closes_at?: string | null;
          day_of_week?: number;
          id?: string;
          library_id?: string;
          opens_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'library_hours_library_id_fkey';
            columns: ['library_id'];
            isOneToOne: false;
            referencedRelation: 'libraries';
            referencedColumns: ['id'];
          },
        ];
      };
      library_images: {
        Row: {
          id: string;
          image_url: string;
          library_id: string;
        };
        Insert: {
          id?: string;
          image_url: string;
          library_id: string;
        };
        Update: {
          id?: string;
          image_url?: string;
          library_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'library_images_library_id_fkey';
            columns: ['library_id'];
            isOneToOne: false;
            referencedRelation: 'libraries';
            referencedColumns: ['id'];
          },
        ];
      };
      notes: {
        Row: {
          color: string | null;
          description: string | null;
          id: string;
          name: string;
        };
        Insert: {
          color?: string | null;
          description?: string | null;
          id: string;
          name: string;
        };
        Update: {
          color?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      room_categories: {
        Row: {
          categories_id: string | null;
          id: string;
          room_uuid: string;
        };
        Insert: {
          categories_id?: string | null;
          id?: string;
          room_uuid?: string;
        };
        Update: {
          categories_id?: string | null;
          id?: string;
          room_uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'room_amenities_room_uuid_fkey';
            columns: ['room_uuid'];
            isOneToOne: false;
            referencedRelation: 'building_rooms';
            referencedColumns: ['uuid'];
          },
          {
            foreignKeyName: 'room_categories_categories_id_fkey';
            columns: ['categories_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      room_notes: {
        Row: {
          id: string;
          note_id: string;
          room_uuid: string;
        };
        Insert: {
          id?: string;
          note_id: string;
          room_uuid: string;
        };
        Update: {
          id?: string;
          note_id?: string;
          room_uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'room_notes_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'notes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'room_notes_room_uuid_fkey';
            columns: ['room_uuid'];
            isOneToOne: false;
            referencedRelation: 'building_rooms';
            referencedColumns: ['uuid'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
