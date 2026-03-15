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
      activity_types: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          emoji: string | null
          icon_image: string | null
          id: string
          is_active: boolean | null
          legacy_category_id: string | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          emoji?: string | null
          icon_image?: string | null
          id?: string
          is_active?: boolean | null
          legacy_category_id?: string | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          emoji?: string | null
          icon_image?: string | null
          id?: string
          is_active?: boolean | null
          legacy_category_id?: string | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_types_legacy_category_id_fkey"
            columns: ["legacy_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          cover_image: string | null
          created_at: string | null
          description: string | null
          destination_id: string
          display_order: number | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          destination_id: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          destination_id?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "areas_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_intents: {
        Row: {
          created_at: string | null
          id: string
          intent_type: string | null
          metadata: Json | null
          option_id: string | null
          product_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          intent_type?: string | null
          metadata?: Json | null
          option_id?: string | null
          product_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          intent_type?: string | null
          metadata?: Json | null
          option_id?: string | null
          product_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_intents_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_intents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      canonical_decisions: {
        Row: {
          canonical_url: string
          decided_at: string | null
          decided_by: string | null
          entity_id: string
          entity_type: string
          id: string
          is_indexable: boolean | null
          reason: string | null
        }
        Insert: {
          canonical_url: string
          decided_at?: string | null
          decided_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_indexable?: boolean | null
          reason?: string | null
        }
        Update: {
          canonical_url?: string
          decided_at?: string | null
          decided_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_indexable?: boolean | null
          reason?: string | null
        }
        Relationships: []
      }
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
      content_sources: {
        Row: {
          confidence: number | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          source_type: string | null
          source_url: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          source_type?: string | null
          source_url?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          source_type?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      countries: {
        Row: {
          created_at: string | null
          flag_emoji: string | null
          flag_svg_url: string | null
          id: string
          is_active: boolean | null
          iso_code: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          flag_emoji?: string | null
          flag_svg_url?: string | null
          id?: string
          is_active?: boolean | null
          iso_code: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          flag_emoji?: string | null
          flag_svg_url?: string | null
          id?: string
          is_active?: boolean | null
          iso_code?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crawl_observations: {
        Row: {
          crawler: string | null
          id: string
          observed_at: string | null
          status_code: number | null
          url: string
        }
        Insert: {
          crawler?: string | null
          id?: string
          observed_at?: string | null
          status_code?: number | null
          url: string
        }
        Update: {
          crawler?: string | null
          id?: string
          observed_at?: string | null
          status_code?: number | null
          url?: string
        }
        Relationships: []
      }
      creator_categories: {
        Row: {
          category_id: string
          created_at: string | null
          creator_id: string
          id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          creator_id: string
          id?: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          creator_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_categories_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
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
      destinations: {
        Row: {
          airport_code: string | null
          country_id: string | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          latitude: number | null
          legacy_city_id: string | null
          longitude: number | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          airport_code?: string | null
          country_id?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          legacy_city_id?: string | null
          longitude?: number | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          airport_code?: string | null
          country_id?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          legacy_city_id?: string | null
          longitude?: number | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "destinations_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "destinations_legacy_city_id_fkey"
            columns: ["legacy_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_aliases: {
        Row: {
          alias: string
          alias_type: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          alias: string
          alias_type?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          alias?: string
          alias_type?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      entity_funnel_metrics: {
        Row: {
          booking_intents: number | null
          created_at: string | null
          detail_views: number | null
          entity_id: string
          entity_type: string
          id: string
          impressions: number | null
          period_end: string
          period_start: string
          saves: number | null
        }
        Insert: {
          booking_intents?: number | null
          created_at?: string | null
          detail_views?: number | null
          entity_id: string
          entity_type: string
          id?: string
          impressions?: number | null
          period_end: string
          period_start: string
          saves?: number | null
        }
        Update: {
          booking_intents?: number | null
          created_at?: string | null
          detail_views?: number | null
          entity_id?: string
          entity_type?: string
          id?: string
          impressions?: number | null
          period_end?: string
          period_start?: string
          saves?: number | null
        }
        Relationships: []
      }
      entity_merges: {
        Row: {
          id: string
          merged_at: string | null
          merged_by: string | null
          reason: string | null
          source_id: string
          source_type: string
          target_id: string
          target_type: string
        }
        Insert: {
          id?: string
          merged_at?: string | null
          merged_by?: string | null
          reason?: string | null
          source_id: string
          source_type: string
          target_id: string
          target_type: string
        }
        Update: {
          id?: string
          merged_at?: string | null
          merged_by?: string | null
          reason?: string | null
          source_id?: string
          source_type?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      entity_slug_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          entity_id: string
          entity_type: string
          id: string
          new_slug: string
          old_slug: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          new_slug: string
          old_slug: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          new_slug?: string
          old_slug?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          host_id: string | null
          id: string
          is_active: boolean | null
          product_id: string | null
          slug: string
          start_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          host_id?: string | null
          id?: string
          is_active?: boolean | null
          product_id?: string | null
          slug: string
          start_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          host_id?: string | null
          id?: string
          is_active?: boolean | null
          product_id?: string | null
          slug?: string
          start_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
      external_entity_contracts: {
        Row: {
          contract_version: number | null
          created_at: string | null
          entity_type: string
          field_mappings: Json | null
          id: string
          is_active: boolean | null
          partner: string
          updated_at: string | null
        }
        Insert: {
          contract_version?: number | null
          created_at?: string | null
          entity_type: string
          field_mappings?: Json | null
          id?: string
          is_active?: boolean | null
          partner: string
          updated_at?: string | null
        }
        Update: {
          contract_version?: number | null
          created_at?: string | null
          entity_type?: string
          field_mappings?: Json | null
          id?: string
          is_active?: boolean | null
          partner?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      feed_issue_logs: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          feed_type: string
          id: string
          issue_type: string
          message: string | null
          resolved: boolean | null
          severity: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          feed_type: string
          id?: string
          issue_type: string
          message?: string | null
          resolved?: boolean | null
          severity?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          feed_type?: string
          id?: string
          issue_type?: string
          message?: string | null
          resolved?: boolean | null
          severity?: string | null
        }
        Relationships: []
      }
      host_locations: {
        Row: {
          address: string | null
          created_at: string | null
          google_place_id: string | null
          host_id: string
          id: string
          is_primary: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          google_place_id?: string | null
          host_id: string
          id?: string
          is_primary?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          google_place_id?: string | null
          host_id?: string
          id?: string
          is_primary?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "host_locations_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
        ]
      }
      hosts: {
        Row: {
          area_id: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          destination_id: string | null
          display_name: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          latitude: number | null
          legacy_creator_id: string | null
          longitude: number | null
          slug: string
          social_links: Json | null
          updated_at: string | null
          username: string
        }
        Insert: {
          area_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          destination_id?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          legacy_creator_id?: string | null
          longitude?: number | null
          slug: string
          social_links?: Json | null
          updated_at?: string | null
          username: string
        }
        Update: {
          area_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          destination_id?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          legacy_creator_id?: string | null
          longitude?: number | null
          slug?: string
          social_links?: Json | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "hosts_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hosts_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hosts_legacy_creator_id_fkey"
            columns: ["legacy_creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_resolution_links: {
        Row: {
          confidence: number | null
          created_at: string | null
          entity_id_a: string
          entity_id_b: string
          entity_type_a: string
          entity_type_b: string
          id: string
          resolution_method: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          entity_id_a: string
          entity_id_b: string
          entity_type_a: string
          entity_type_b: string
          id?: string
          resolution_method?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          entity_id_a?: string
          entity_id_b?: string
          entity_type_a?: string
          entity_type_b?: string
          id?: string
          resolution_method?: string | null
        }
        Relationships: []
      }
      interaction_events: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          event_type: string
          id: string
          metadata: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          event_type: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      itinerary_days: {
        Row: {
          created_at: string | null
          date: string | null
          day_number: number
          description: string | null
          id: string
          itinerary_id: string
          title: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          day_number?: number
          description?: string | null
          id?: string
          itinerary_id: string
          title?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          day_number?: number
          description?: string | null
          id?: string
          itinerary_id?: string
          title?: string | null
        }
        Relationships: []
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
      itinerary_items: {
        Row: {
          created_at: string | null
          day_id: string
          display_order: number | null
          id: string
          item_type: string | null
          notes: string | null
          poi_id: string | null
          product_id: string | null
          time_slot: string | null
        }
        Insert: {
          created_at?: string | null
          day_id: string
          display_order?: number | null
          id?: string
          item_type?: string | null
          notes?: string | null
          poi_id?: string | null
          product_id?: string | null
          time_slot?: string | null
        }
        Update: {
          created_at?: string | null
          day_id?: string
          display_order?: number | null
          id?: string
          item_type?: string | null
          notes?: string | null
          poi_id?: string | null
          product_id?: string | null
          time_slot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_items_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "itinerary_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_items_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "pois"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string | null
          display_order: number | null
          entity_id: string
          entity_type: string
          id: string
          is_active: boolean | null
          media_type: string | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          entity_id: string
          entity_type: string
          id?: string
          is_active?: boolean | null
          media_type?: string | null
          url: string
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_active?: boolean | null
          media_type?: string | null
          url?: string
        }
        Relationships: []
      }
      moderation_actions: {
        Row: {
          action_type: string
          entity_id: string
          entity_type: string
          id: string
          performed_at: string | null
          performed_by: string | null
          reason: string | null
        }
        Insert: {
          action_type: string
          entity_id: string
          entity_type: string
          id?: string
          performed_at?: string | null
          performed_by?: string | null
          reason?: string | null
        }
        Update: {
          action_type?: string
          entity_id?: string
          entity_type?: string
          id?: string
          performed_at?: string | null
          performed_by?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      options: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          duration: string | null
          format_type: string | null
          group_size: string | null
          id: string
          is_active: boolean | null
          name: string
          product_id: string
          slug: string
          tier: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration?: string | null
          format_type?: string | null
          group_size?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          product_id: string
          slug: string
          tier?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration?: string | null
          format_type?: string | null
          group_size?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          product_id?: string
          slug?: string
          tier?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "options_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pois: {
        Row: {
          area_id: string | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          destination_id: string | null
          google_place_id: string | null
          id: string
          is_active: boolean | null
          is_public_page: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          poi_type: string | null
          slug: string
          updated_at: string | null
          wikidata_id: string | null
        }
        Insert: {
          area_id?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          destination_id?: string | null
          google_place_id?: string | null
          id?: string
          is_active?: boolean | null
          is_public_page?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          poi_type?: string | null
          slug: string
          updated_at?: string | null
          wikidata_id?: string | null
        }
        Update: {
          area_id?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          destination_id?: string | null
          google_place_id?: string | null
          id?: string
          is_active?: boolean | null
          is_public_page?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          poi_type?: string | null
          slug?: string
          updated_at?: string | null
          wikidata_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pois_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pois_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      price_options: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          display_order: number | null
          id: string
          is_active: boolean | null
          label: string
          option_id: string
          original_amount: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          currency?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          label?: string
          option_id: string
          original_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          label?: string
          option_id?: string
          original_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_options_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "options"
            referencedColumns: ["id"]
          },
        ]
      }
      product_destinations: {
        Row: {
          created_at: string | null
          destination_id: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string | null
          destination_id: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string | null
          destination_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_destinations_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_destinations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_hosts: {
        Row: {
          created_at: string | null
          display_order: number | null
          host_id: string
          id: string
          is_primary: boolean | null
          product_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          host_id: string
          id?: string
          is_primary?: boolean | null
          product_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          host_id?: string
          id?: string
          is_primary?: boolean | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_hosts_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_hosts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_pois: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          poi_id: string
          product_id: string
          relationship_type: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          poi_id: string
          product_id: string
          relationship_type?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          poi_id?: string
          product_id?: string
          relationship_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_pois_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "pois"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_pois_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_themes: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          theme_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          theme_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_themes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_themes_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          activity_type_id: string | null
          area_id: string | null
          best_time: string | null
          canonical_url: string | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          destination_id: string | null
          duration: string | null
          format_type: string | null
          gallery: Json | null
          highlights: Json | null
          id: string
          is_active: boolean | null
          is_indexable: boolean | null
          latitude: number | null
          legacy_experience_id: string | null
          like_count: number | null
          longitude: number | null
          meeting_points: Json | null
          publish_score: number | null
          rating: number | null
          slug: string
          tier: string | null
          title: string
          updated_at: string | null
          video_url: string | null
          view_count: number | null
          weather: string | null
        }
        Insert: {
          activity_type_id?: string | null
          area_id?: string | null
          best_time?: string | null
          canonical_url?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          destination_id?: string | null
          duration?: string | null
          format_type?: string | null
          gallery?: Json | null
          highlights?: Json | null
          id?: string
          is_active?: boolean | null
          is_indexable?: boolean | null
          latitude?: number | null
          legacy_experience_id?: string | null
          like_count?: number | null
          longitude?: number | null
          meeting_points?: Json | null
          publish_score?: number | null
          rating?: number | null
          slug: string
          tier?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
          weather?: string | null
        }
        Update: {
          activity_type_id?: string | null
          area_id?: string | null
          best_time?: string | null
          canonical_url?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          destination_id?: string | null
          duration?: string | null
          format_type?: string | null
          gallery?: Json | null
          highlights?: Json | null
          id?: string
          is_active?: boolean | null
          is_indexable?: boolean | null
          latitude?: number | null
          legacy_experience_id?: string | null
          like_count?: number | null
          longitude?: number | null
          meeting_points?: Json | null
          publish_score?: number | null
          rating?: number | null
          slug?: string
          tier?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
          weather?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_activity_type_id_fkey"
            columns: ["activity_type_id"]
            isOneToOne: false
            referencedRelation: "activity_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_legacy_experience_id_fkey"
            columns: ["legacy_experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
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
      publish_validation_results: {
        Row: {
          checks: Json | null
          entity_id: string
          entity_type: string
          id: string
          is_publishable: boolean | null
          publish_score: number | null
          validated_at: string | null
        }
        Insert: {
          checks?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          is_publishable?: boolean | null
          publish_score?: number | null
          validated_at?: string | null
        }
        Update: {
          checks?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_publishable?: boolean | null
          publish_score?: number | null
          validated_at?: string | null
        }
        Relationships: []
      }
      review_aggregates: {
        Row: {
          average_rating: number | null
          entity_id: string
          entity_type: string
          id: string
          last_updated: string | null
          rating_distribution: Json | null
          total_reviews: number | null
        }
        Insert: {
          average_rating?: number | null
          entity_id: string
          entity_type: string
          id?: string
          last_updated?: string | null
          rating_distribution?: Json | null
          total_reviews?: number | null
        }
        Update: {
          average_rating?: number | null
          entity_id?: string
          entity_type?: string
          id?: string
          last_updated?: string | null
          rating_distribution?: Json | null
          total_reviews?: number | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string | null
          host_id: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          product_id: string | null
          rating: number
          source: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          host_id?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          product_id?: string | null
          rating: number
          source?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          host_id?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          product_id?: string | null
          rating?: number
          source?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_generation_logs: {
        Row: {
          entity_id: string
          entity_type: string
          generated_at: string | null
          id: string
          is_valid: boolean | null
          schema_payload: Json
          schema_type: string
          schema_version: number | null
          validation_errors: Json | null
        }
        Insert: {
          entity_id: string
          entity_type: string
          generated_at?: string | null
          id?: string
          is_valid?: boolean | null
          schema_payload?: Json
          schema_type: string
          schema_version?: number | null
          validation_errors?: Json | null
        }
        Update: {
          entity_id?: string
          entity_type?: string
          generated_at?: string | null
          id?: string
          is_valid?: boolean | null
          schema_payload?: Json
          schema_type?: string
          schema_version?: number | null
          validation_errors?: Json | null
        }
        Relationships: []
      }
      search_performance_snapshots: {
        Row: {
          clicks: number | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          impressions: number | null
          position: number | null
          snapshot_date: string
          url: string
        }
        Insert: {
          clicks?: number | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          impressions?: number | null
          position?: number | null
          snapshot_date: string
          url: string
        }
        Update: {
          clicks?: number | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          impressions?: number | null
          position?: number | null
          snapshot_date?: string
          url?: string
        }
        Relationships: []
      }
      sync_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_log: Json | null
          id: string
          job_type: string
          records_failed: number | null
          records_processed: number | null
          source_system: string
          started_at: string | null
          status: string | null
          target_system: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          id?: string
          job_type: string
          records_failed?: number | null
          records_processed?: number | null
          source_system: string
          started_at?: string | null
          status?: string | null
          target_system: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          id?: string
          job_type?: string
          records_failed?: number | null
          records_processed?: number | null
          source_system?: string
          started_at?: string | null
          status?: string | null
          target_system?: string
        }
        Relationships: []
      }
      themes: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          emoji: string | null
          id: string
          is_active: boolean | null
          is_public_page: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          is_public_page?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          is_public_page?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      travellers: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string
          is_indexed: boolean | null
          is_public: boolean | null
          updated_at: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_indexed?: boolean | null
          is_public?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_indexed?: boolean | null
          is_public?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
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
