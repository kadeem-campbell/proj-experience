export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          emoji: string | null
          icon_image: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          emoji?: string | null
          icon_image?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          emoji?: string | null
          icon_image?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          airport_code: string | null
          country: string
          cover_image: string | null
          created_at: string | null
          flag_emoji: string | null
          flag_svg_url: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          launch_date: string | null
          longitude: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          airport_code?: string | null
          country?: string
          cover_image?: string | null
          created_at?: string | null
          flag_emoji?: string | null
          flag_svg_url?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          launch_date?: string | null
          longitude?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          airport_code?: string | null
          country?: string
          cover_image?: string | null
          created_at?: string | null
          flag_emoji?: string | null
          flag_svg_url?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          launch_date?: string | null
          longitude?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      collection_experiences: {
        Row: {
          collection_id: string
          created_at: string | null
          display_order: number | null
          experience_id: string
          id: string
        }
        Insert: {
          collection_id: string
          created_at?: string | null
          display_order?: number | null
          experience_id: string
          id?: string
        }
        Update: {
          collection_id?: string
          created_at?: string | null
          display_order?: number | null
          experience_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_experiences_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_experiences_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_items: {
        Row: {
          collection_id: string
          created_at: string | null
          id: string
          item_id: string
          item_type: string
          position: number | null
        }
        Insert: {
          collection_id: string
          created_at?: string | null
          id?: string
          item_id: string
          item_type?: string
          position?: number | null
        }
        Update: {
          collection_id?: string
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          city_id: string | null
          collection_type: string
          cover_image: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          tag: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          city_id?: string | null
          collection_type?: string
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          tag?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          city_id?: string | null
          collection_type?: string
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          tag?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          social_links: Json | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          social_links?: Json | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          social_links?: Json | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      experience_faqs: {
        Row: {
          answer: string
          created_at: string | null
          display_order: number | null
          experience_id: string
          id: string
          is_active: boolean | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          display_order?: number | null
          experience_id: string
          id?: string
          is_active?: boolean | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          display_order?: number | null
          experience_id?: string
          id?: string
          is_active?: boolean | null
          question?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experience_faqs_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          display_order: number | null
          experience_id: string
          id: string
          is_active: boolean | null
          updated_at: string | null
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          experience_id: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          experience_id?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_photos_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          best_time: string | null
          category: string
          city_id: string | null
          created_at: string | null
          creator: string
          creator_id: string | null
          description: string | null
          duration: string | null
          faqs: Json | null
          gallery: Json | null
          group_size: string | null
          highlights: Json | null
          id: string
          instagram_embed: string | null
          is_active: boolean | null
          like_count: number | null
          location: string
          meeting_points: Json | null
          price: string | null
          rating: number | null
          slug: string | null
          social_links: Json | null
          tiktok_videos: Json | null
          title: string
          updated_at: string | null
          video_thumbnail: string | null
          video_url: string | null
          view_count: number | null
          views: string | null
          weather: string | null
        }
        Insert: {
          best_time?: string | null
          category?: string
          city_id?: string | null
          created_at?: string | null
          creator?: string
          creator_id?: string | null
          description?: string | null
          duration?: string | null
          faqs?: Json | null
          gallery?: Json | null
          group_size?: string | null
          highlights?: Json | null
          id?: string
          instagram_embed?: string | null
          is_active?: boolean | null
          like_count?: number | null
          location?: string
          meeting_points?: Json | null
          price?: string | null
          rating?: number | null
          slug?: string | null
          social_links?: Json | null
          tiktok_videos?: Json | null
          title: string
          updated_at?: string | null
          video_thumbnail?: string | null
          video_url?: string | null
          view_count?: number | null
          views?: string | null
          weather?: string | null
        }
        Update: {
          best_time?: string | null
          category?: string
          city_id?: string | null
          created_at?: string | null
          creator?: string
          creator_id?: string | null
          description?: string | null
          duration?: string | null
          faqs?: Json | null
          gallery?: Json | null
          group_size?: string | null
          highlights?: Json | null
          id?: string
          instagram_embed?: string | null
          is_active?: boolean | null
          like_count?: number | null
          location?: string
          meeting_points?: Json | null
          price?: string | null
          rating?: number | null
          slug?: string | null
          social_links?: Json | null
          tiktok_videos?: Json | null
          title?: string
          updated_at?: string | null
          video_thumbnail?: string | null
          video_url?: string | null
          view_count?: number | null
          views?: string | null
          weather?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiences_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiences_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      itineraries: {
        Row: {
          active_trip_id: string | null
          collaborators: string[] | null
          cover_image: string | null
          created_at: string | null
          creator_id: string | null
          experiences: Json | null
          id: string
          is_public: boolean | null
          name: string
          start_date: string | null
          tag: string | null
          theme: string | null
          trips: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_trip_id?: string | null
          collaborators?: string[] | null
          cover_image?: string | null
          created_at?: string | null
          creator_id?: string | null
          experiences?: Json | null
          id?: string
          is_public?: boolean | null
          name?: string
          start_date?: string | null
          tag?: string | null
          theme?: string | null
          trips?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_trip_id?: string | null
          collaborators?: string[] | null
          cover_image?: string | null
          created_at?: string | null
          creator_id?: string | null
          experiences?: Json | null
          id?: string
          is_public?: boolean | null
          name?: string
          start_date?: string | null
          tag?: string | null
          theme?: string | null
          trips?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itineraries_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_experiences: {
        Row: {
          created_at: string | null
          display_order: number | null
          experience_id: string
          id: string
          itinerary_id: string | null
          notes: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          experience_id: string
          id?: string
          itinerary_id?: string | null
          notes?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          experience_id?: string
          id?: string
          itinerary_id?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_experiences_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_experiences_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "public_itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      public_itineraries: {
        Row: {
          city_id: string | null
          cover_image: string | null
          created_at: string | null
          creator_id: string | null
          description: string | null
          experiences: Json | null
          id: string
          is_active: boolean | null
          like_count: number | null
          name: string
          slug: string
          tag: string | null
          trips: Json | null
          updated_at: string | null
          url: string | null
          view_count: number | null
        }
        Insert: {
          city_id?: string | null
          cover_image?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          experiences?: Json | null
          id?: string
          is_active?: boolean | null
          like_count?: number | null
          name: string
          slug: string
          tag?: string | null
          trips?: Json | null
          updated_at?: string | null
          url?: string | null
          view_count?: number | null
        }
        Update: {
          city_id?: string | null
          cover_image?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          experiences?: Json | null
          id?: string
          is_active?: boolean | null
          like_count?: number | null
          name?: string
          slug?: string
          tag?: string | null
          trips?: Json | null
          updated_at?: string | null
          url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "public_itineraries_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_itineraries_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      user_likes: {
        Row: {
          created_at: string
          id: string
          item_data: Json
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_data?: Json
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_data?: Json
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "creator" | "traveler"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "creator", "traveler"],
    },
  },
} as const
