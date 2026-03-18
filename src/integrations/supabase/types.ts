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
      admin_audit_log: {
        Row: {
          action_type: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      agent_grounding_checks: {
        Row: {
          conflicts_json: Json | null
          created_at: string | null
          facts_used_json: Json | null
          grounding_score: number | null
          id: string
          message_id: string | null
          passed: boolean | null
        }
        Insert: {
          conflicts_json?: Json | null
          created_at?: string | null
          facts_used_json?: Json | null
          grounding_score?: number | null
          id?: string
          message_id?: string | null
          passed?: boolean | null
        }
        Update: {
          conflicts_json?: Json | null
          created_at?: string | null
          facts_used_json?: Json | null
          grounding_score?: number | null
          id?: string
          message_id?: string | null
          passed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_grounding_checks_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "agent_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_messages: {
        Row: {
          agent_session_id: string
          content_json: Json | null
          content_text: string | null
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          agent_session_id: string
          content_json?: Json | null
          content_text?: string | null
          created_at?: string | null
          id?: string
          role?: string
        }
        Update: {
          agent_session_id?: string
          content_json?: Json | null
          content_text?: string | null
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_messages_agent_session_id_fkey"
            columns: ["agent_session_id"]
            isOneToOne: false
            referencedRelation: "agent_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_sessions: {
        Row: {
          context_window_json: Json | null
          created_at: string | null
          id: string
          long_term_memory_refs_json: Json | null
          planner_session_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          context_window_json?: Json | null
          created_at?: string | null
          id?: string
          long_term_memory_refs_json?: Json | null
          planner_session_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          context_window_json?: Json | null
          created_at?: string | null
          id?: string
          long_term_memory_refs_json?: Json | null
          planner_session_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_sessions_planner_session_id_fkey"
            columns: ["planner_session_id"]
            isOneToOne: false
            referencedRelation: "planner_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tool_calls: {
        Row: {
          agent_session_id: string
          created_at: string | null
          id: string
          latency_ms: number | null
          token_cost_estimate: number | null
          tool_args_json: Json | null
          tool_name: string
          tool_result_json: Json | null
        }
        Insert: {
          agent_session_id: string
          created_at?: string | null
          id?: string
          latency_ms?: number | null
          token_cost_estimate?: number | null
          tool_args_json?: Json | null
          tool_name: string
          tool_result_json?: Json | null
        }
        Update: {
          agent_session_id?: string
          created_at?: string | null
          id?: string
          latency_ms?: number | null
          token_cost_estimate?: number | null
          tool_args_json?: Json | null
          tool_name?: string
          tool_result_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_tool_calls_agent_session_id_fkey"
            columns: ["agent_session_id"]
            isOneToOne: false
            referencedRelation: "agent_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      answers: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_best: boolean | null
          question_id: string
          updated_at: string | null
          user_id: string
          vote_count: number | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_best?: boolean | null
          question_id: string
          updated_at?: string | null
          user_id: string
          vote_count?: number | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_best?: boolean | null
          question_id?: string
          updated_at?: string | null
          user_id?: string
          vote_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
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
          indexability_state: string | null
          is_active: boolean | null
          latitude: number | null
          launch_profile_id: string | null
          launch_status: string | null
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
          indexability_state?: string | null
          is_active?: boolean | null
          latitude?: number | null
          launch_profile_id?: string | null
          launch_status?: string | null
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
          indexability_state?: string | null
          is_active?: boolean | null
          latitude?: number | null
          launch_profile_id?: string | null
          launch_status?: string | null
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
          {
            foreignKeyName: "areas_launch_profile_id_fkey"
            columns: ["launch_profile_id"]
            isOneToOne: false
            referencedRelation: "geo_launch_profiles"
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
      bulk_action_jobs: {
        Row: {
          action_type: string
          actor_user_id: string | null
          completed_at: string | null
          created_at: string | null
          dry_run_flag: boolean | null
          filter_json: Json | null
          id: string
          proposed_changes_json: Json | null
          result_json: Json | null
          status: string | null
          target_entity_type: string
        }
        Insert: {
          action_type: string
          actor_user_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          dry_run_flag?: boolean | null
          filter_json?: Json | null
          id?: string
          proposed_changes_json?: Json | null
          result_json?: Json | null
          status?: string | null
          target_entity_type: string
        }
        Update: {
          action_type?: string
          actor_user_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          dry_run_flag?: boolean | null
          filter_json?: Json | null
          id?: string
          proposed_changes_json?: Json | null
          result_json?: Json | null
          status?: string | null
          target_entity_type?: string
        }
        Relationships: []
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
      collection_destinations: {
        Row: {
          collection_id: string
          created_at: string | null
          destination_id: string
          id: string
        }
        Insert: {
          collection_id: string
          created_at?: string | null
          destination_id: string
          id?: string
        }
        Update: {
          collection_id?: string
          created_at?: string | null
          destination_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_destinations_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_destinations_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
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
          content_type: string | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          home_display_order: number | null
          id: string
          indexability_state: string | null
          is_active: boolean | null
          name: string
          show_on_home: boolean | null
          slug: string
          tag: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          city_id?: string | null
          collection_type?: string
          content_type?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          home_display_order?: number | null
          id?: string
          indexability_state?: string | null
          is_active?: boolean | null
          name: string
          show_on_home?: boolean | null
          slug: string
          tag?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          city_id?: string | null
          collection_type?: string
          content_type?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          home_display_order?: number | null
          id?: string
          indexability_state?: string | null
          is_active?: boolean | null
          name?: string
          show_on_home?: boolean | null
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
      compare_sets: {
        Row: {
          context: string | null
          created_at: string | null
          entity_ids: string[]
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string | null
          entity_ids?: string[]
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string | null
          entity_ids?: string[]
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
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
      custom_itinerary_items: {
        Row: {
          created_at: string | null
          created_by_user_id: string | null
          day_number: number | null
          display_order: number | null
          external_link: string | null
          id: string
          itinerary_id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by_user_id?: string | null
          day_number?: number | null
          display_order?: number | null
          external_link?: string | null
          id?: string
          itinerary_id: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string | null
          day_number?: number | null
          display_order?: number | null
          external_link?: string | null
          id?: string
          itinerary_id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          title?: string
        }
        Relationships: []
      }
      defer_register: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          deferred_to_phase: string | null
          id: string
          item_name: string
          reason: string | null
          resolved_at: string | null
          severity: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          deferred_to_phase?: string | null
          id?: string
          item_name: string
          reason?: string | null
          resolved_at?: string | null
          severity?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          deferred_to_phase?: string | null
          id?: string
          item_name?: string
          reason?: string | null
          resolved_at?: string | null
          severity?: string | null
        }
        Relationships: []
      }
      demand_keywords: {
        Row: {
          activity_type_id: string | null
          area_id: string | null
          destination_id: string | null
          id: string
          imported_at: string | null
          keyword: string
          monthly_volume: number | null
          seasonality_json: Json | null
          source_type: string | null
        }
        Insert: {
          activity_type_id?: string | null
          area_id?: string | null
          destination_id?: string | null
          id?: string
          imported_at?: string | null
          keyword: string
          monthly_volume?: number | null
          seasonality_json?: Json | null
          source_type?: string | null
        }
        Update: {
          activity_type_id?: string | null
          area_id?: string | null
          destination_id?: string | null
          id?: string
          imported_at?: string | null
          keyword?: string
          monthly_volume?: number | null
          seasonality_json?: Json | null
          source_type?: string | null
        }
        Relationships: []
      }
      deploy_gates: {
        Row: {
          created_at: string | null
          criteria: Json
          evaluated_by: string | null
          gate_name: string
          gate_type: string
          id: string
          is_passed: boolean | null
          last_evaluated_at: string | null
          notes: string | null
        }
        Insert: {
          created_at?: string | null
          criteria?: Json
          evaluated_by?: string | null
          gate_name: string
          gate_type?: string
          id?: string
          is_passed?: boolean | null
          last_evaluated_at?: string | null
          notes?: string | null
        }
        Update: {
          created_at?: string | null
          criteria?: Json
          evaluated_by?: string | null
          gate_name?: string
          gate_type?: string
          id?: string
          is_passed?: boolean | null
          last_evaluated_at?: string | null
          notes?: string | null
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
          flag_emoji: string | null
          flag_svg_url: string | null
          id: string
          indexability_state: string | null
          is_active: boolean | null
          is_marketplace_enabled: boolean | null
          is_partner_feed_enabled: boolean | null
          latitude: number | null
          launch_profile_id: string | null
          launch_status: string | null
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
          flag_emoji?: string | null
          flag_svg_url?: string | null
          id?: string
          indexability_state?: string | null
          is_active?: boolean | null
          is_marketplace_enabled?: boolean | null
          is_partner_feed_enabled?: boolean | null
          latitude?: number | null
          launch_profile_id?: string | null
          launch_status?: string | null
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
          flag_emoji?: string | null
          flag_svg_url?: string | null
          id?: string
          indexability_state?: string | null
          is_active?: boolean | null
          is_marketplace_enabled?: boolean | null
          is_partner_feed_enabled?: boolean | null
          latitude?: number | null
          launch_profile_id?: string | null
          launch_status?: string | null
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
            foreignKeyName: "destinations_launch_profile_id_fkey"
            columns: ["launch_profile_id"]
            isOneToOne: false
            referencedRelation: "geo_launch_profiles"
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
      dim_entities: {
        Row: {
          activity_type: string | null
          area_id: string | null
          area_name: string | null
          created_at: string | null
          destination_id: string | null
          destination_name: string | null
          entity_id: string
          entity_type: string
          host_id: string | null
          host_name: string | null
          indexability_state: string | null
          publish_score: number | null
          quality_score: number | null
          slug: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          activity_type?: string | null
          area_id?: string | null
          area_name?: string | null
          created_at?: string | null
          destination_id?: string | null
          destination_name?: string | null
          entity_id: string
          entity_type: string
          host_id?: string | null
          host_name?: string | null
          indexability_state?: string | null
          publish_score?: number | null
          quality_score?: number | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_type?: string | null
          area_id?: string | null
          area_name?: string | null
          created_at?: string | null
          destination_id?: string | null
          destination_name?: string | null
          entity_id?: string
          entity_type?: string
          host_id?: string | null
          host_name?: string | null
          indexability_state?: string | null
          publish_score?: number | null
          quality_score?: number | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      entity_aliases: {
        Row: {
          alias: string
          alias_normalized: string | null
          alias_type: string | null
          confidence: number | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          is_searchable: boolean | null
          source: string | null
        }
        Insert: {
          alias: string
          alias_normalized?: string | null
          alias_type?: string | null
          confidence?: number | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_searchable?: boolean | null
          source?: string | null
        }
        Update: {
          alias?: string
          alias_normalized?: string | null
          alias_type?: string | null
          confidence?: number | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_searchable?: boolean | null
          source?: string | null
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
      entity_scores: {
        Row: {
          computed_at: string | null
          entity_id: string
          entity_type: string
          explanation_json: Json | null
          id: string
          score_type: string
          score_value: number
          scoring_version: number | null
        }
        Insert: {
          computed_at?: string | null
          entity_id: string
          entity_type: string
          explanation_json?: Json | null
          id?: string
          score_type: string
          score_value?: number
          scoring_version?: number | null
        }
        Update: {
          computed_at?: string | null
          entity_id?: string
          entity_type?: string
          explanation_json?: Json | null
          id?: string
          score_type?: string
          score_value?: number
          scoring_version?: number | null
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
          is_current: boolean | null
          new_slug: string
          old_slug: string
          reason: string | null
          redirect_to_slug: string | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_current?: boolean | null
          new_slug: string
          old_slug: string
          reason?: string | null
          redirect_to_slug?: string | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_current?: boolean | null
          new_slug?: string
          old_slug?: string
          reason?: string | null
          redirect_to_slug?: string | null
        }
        Relationships: []
      }
      entity_suggestions: {
        Row: {
          converted_entity_id: string | null
          converted_entity_type: string | null
          created_at: string | null
          detected_area_id: string | null
          detected_destination_id: string | null
          evidence_links: Json | null
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          review_status: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          converted_entity_id?: string | null
          converted_entity_type?: string | null
          created_at?: string | null
          detected_area_id?: string | null
          detected_destination_id?: string | null
          evidence_links?: Json | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          review_status?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          converted_entity_id?: string | null
          converted_entity_type?: string | null
          created_at?: string | null
          detected_area_id?: string | null
          detected_destination_id?: string | null
          evidence_links?: Json | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          review_status?: string | null
          title?: string
          user_id?: string | null
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
      experience_relationships: {
        Row: {
          created_at: string | null
          id: string
          relationship_type: string
          score: number | null
          source_id: string
          source_type: string
          target_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          relationship_type?: string
          score?: number | null
          source_id: string
          source_type?: string
          target_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          relationship_type?: string
          score?: number | null
          source_id?: string
          source_type?: string
          target_id?: string
        }
        Relationships: []
      }
      experience_tags: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          tag: string
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type?: string
          id?: string
          tag: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          tag?: string
        }
        Relationships: []
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
      export_contracts: {
        Row: {
          contract_version: number
          created_at: string | null
          deep_link_template: string | null
          feed_type: string
          field_exposure: Json
          id: string
          is_active: boolean | null
          min_description_length: number | null
          partner: string
          requires_geo: boolean | null
          requires_image: boolean | null
          requires_pricing: boolean | null
          updated_at: string | null
        }
        Insert: {
          contract_version?: number
          created_at?: string | null
          deep_link_template?: string | null
          feed_type?: string
          field_exposure?: Json
          id?: string
          is_active?: boolean | null
          min_description_length?: number | null
          partner: string
          requires_geo?: boolean | null
          requires_image?: boolean | null
          requires_pricing?: boolean | null
          updated_at?: string | null
        }
        Update: {
          contract_version?: number
          created_at?: string | null
          deep_link_template?: string | null
          feed_type?: string
          field_exposure?: Json
          id?: string
          is_active?: boolean | null
          min_description_length?: number | null
          partner?: string
          requires_geo?: boolean | null
          requires_image?: boolean | null
          requires_pricing?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
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
      fact_booking_intents: {
        Row: {
          created_at: string
          id: string
          intent_stage: string
          metadata: Json | null
          option_id: string | null
          product_id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          intent_stage?: string
          metadata?: Json | null
          option_id?: string | null
          product_id: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          intent_stage?: string
          metadata?: Json | null
          option_id?: string | null
          product_id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      fact_pageviews: {
        Row: {
          anonymous_id: string | null
          created_at: string
          device_type: string | null
          entity_id: string
          entity_type: string
          id: string
          locale: string | null
          page_url: string
          referrer: string | null
          session_id: string
          user_id: string | null
          viewport: string | null
        }
        Insert: {
          anonymous_id?: string | null
          created_at?: string
          device_type?: string | null
          entity_id: string
          entity_type: string
          id?: string
          locale?: string | null
          page_url: string
          referrer?: string | null
          session_id: string
          user_id?: string | null
          viewport?: string | null
        }
        Update: {
          anonymous_id?: string | null
          created_at?: string
          device_type?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          locale?: string | null
          page_url?: string
          referrer?: string | null
          session_id?: string
          user_id?: string | null
          viewport?: string | null
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
      geo_launch_profiles: {
        Row: {
          created_at: string | null
          default_output_policy_json: Json | null
          id: string
          min_host_readiness_to_publish: number | null
          min_itinerary_readiness_to_publish: number | null
          min_product_readiness_to_index: number | null
          min_product_readiness_to_publish: number | null
          profile_key: string
        }
        Insert: {
          created_at?: string | null
          default_output_policy_json?: Json | null
          id?: string
          min_host_readiness_to_publish?: number | null
          min_itinerary_readiness_to_publish?: number | null
          min_product_readiness_to_index?: number | null
          min_product_readiness_to_publish?: number | null
          profile_key: string
        }
        Update: {
          created_at?: string | null
          default_output_policy_json?: Json | null
          id?: string
          min_host_readiness_to_publish?: number | null
          min_itinerary_readiness_to_publish?: number | null
          min_product_readiness_to_index?: number | null
          min_product_readiness_to_publish?: number | null
          profile_key?: string
        }
        Relationships: []
      }
      geo_shapes: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          shape_json: Json | null
          source_type: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          shape_json?: Json | null
          source_type?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          shape_json?: Json | null
          source_type?: string | null
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
          indexability_state: string | null
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
          indexability_state?: string | null
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
          indexability_state?: string | null
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
      identity_map: {
        Row: {
          anonymous_id: string
          first_seen_at: string | null
          id: string
          last_seen_at: string | null
          user_id: string
        }
        Insert: {
          anonymous_id: string
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          user_id: string
        }
        Update: {
          anonymous_id?: string
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      ingestion_jobs: {
        Row: {
          committed_at: string | null
          created_at: string | null
          created_by: string | null
          error_log: Json | null
          error_rows: number | null
          id: string
          job_type: string
          processed_rows: number | null
          source_name: string | null
          status: string | null
          target_entity_type: string
          total_rows: number | null
        }
        Insert: {
          committed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_log?: Json | null
          error_rows?: number | null
          id?: string
          job_type?: string
          processed_rows?: number | null
          source_name?: string | null
          status?: string | null
          target_entity_type: string
          total_rows?: number | null
        }
        Update: {
          committed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_log?: Json | null
          error_rows?: number | null
          id?: string
          job_type?: string
          processed_rows?: number | null
          source_name?: string | null
          status?: string | null
          target_entity_type?: string
          total_rows?: number | null
        }
        Relationships: []
      }
      ingestion_rows: {
        Row: {
          created_at: string | null
          id: string
          job_id: string
          normalised_row_json: Json | null
          raw_data_json: Json
          row_number: number
          status: string | null
          target_entity_id: string | null
          validation_errors: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id: string
          normalised_row_json?: Json | null
          raw_data_json: Json
          row_number: number
          status?: string | null
          target_entity_id?: string | null
          validation_errors?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string
          normalised_row_json?: Json | null
          raw_data_json?: Json
          row_number?: number
          status?: string | null
          target_entity_id?: string | null
          validation_errors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_rows_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "ingestion_jobs"
            referencedColumns: ["id"]
          },
        ]
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
          copied_from: string | null
          copy_count: number | null
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
          copied_from?: string | null
          copy_count?: number | null
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
          copied_from?: string | null
          copy_count?: number | null
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
      itinerary_lineage: {
        Row: {
          child_itinerary_id: string
          created_at: string | null
          id: string
          parent_itinerary_id: string
          relationship_type: string
        }
        Insert: {
          child_itinerary_id: string
          created_at?: string | null
          id?: string
          parent_itinerary_id: string
          relationship_type?: string
        }
        Update: {
          child_itinerary_id?: string
          created_at?: string | null
          id?: string
          parent_itinerary_id?: string
          relationship_type?: string
        }
        Relationships: []
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
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          title?: string
          type?: string
          user_id?: string
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
      page_route_registry: {
        Row: {
          canonical_url: string
          conflict_group_key: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          generated_from_rule: string | null
          id: string
          indexability_state: string
          page_type: string
          redirect_target_url: string | null
          resolved_path: string
          route_priority: number
          status: string
          supersedes_route_id: string | null
          updated_at: string | null
        }
        Insert: {
          canonical_url: string
          conflict_group_key?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          generated_from_rule?: string | null
          id?: string
          indexability_state?: string
          page_type: string
          redirect_target_url?: string | null
          resolved_path: string
          route_priority?: number
          status?: string
          supersedes_route_id?: string | null
          updated_at?: string | null
        }
        Update: {
          canonical_url?: string
          conflict_group_key?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          generated_from_rule?: string | null
          id?: string
          indexability_state?: string
          page_type?: string
          redirect_target_url?: string | null
          resolved_path?: string
          route_priority?: number
          status?: string
          supersedes_route_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      partner_export_rows: {
        Row: {
          created_at: string | null
          export_id: string
          id: string
          payload_json: Json
          product_id: string
          validation_errors_json: Json | null
        }
        Insert: {
          created_at?: string | null
          export_id: string
          id?: string
          payload_json?: Json
          product_id: string
          validation_errors_json?: Json | null
        }
        Update: {
          created_at?: string | null
          export_id?: string
          id?: string
          payload_json?: Json
          product_id?: string
          validation_errors_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_export_rows_export_id_fkey"
            columns: ["export_id"]
            isOneToOne: false
            referencedRelation: "partner_exports"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_exports: {
        Row: {
          created_at: string | null
          error_json: Json | null
          export_type: string
          finished_at: string | null
          id: string
          partner_key: string
          record_count: number | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          error_json?: Json | null
          export_type?: string
          finished_at?: string | null
          id?: string
          partner_key: string
          record_count?: number | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          error_json?: Json | null
          export_type?: string
          finished_at?: string | null
          id?: string
          partner_key?: string
          record_count?: number | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      place_relationships: {
        Row: {
          id: string
          relationship_type: string
          source_id: string
          source_origin: string | null
          source_type: string
          strength: number | null
          target_id: string
          target_type: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          relationship_type?: string
          source_id: string
          source_origin?: string | null
          source_type: string
          strength?: number | null
          target_id: string
          target_type: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          relationship_type?: string
          source_id?: string
          source_origin?: string | null
          source_type?: string
          strength?: number | null
          target_id?: string
          target_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      planner_sessions: {
        Row: {
          context_json: Json | null
          created_at: string | null
          current_area_id: string | null
          current_destination_id: string | null
          id: string
          session_id: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          context_json?: Json | null
          created_at?: string | null
          current_area_id?: string | null
          current_destination_id?: string | null
          id?: string
          session_id: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          context_json?: Json | null
          created_at?: string | null
          current_area_id?: string | null
          current_destination_id?: string | null
          id?: string
          session_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
          indexability_state: string | null
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
          indexability_state?: string | null
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
          indexability_state?: string | null
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
      preference_dimensions: {
        Row: {
          allowed_values_json: Json | null
          created_at: string | null
          default_weight: number | null
          description: string | null
          id: string
          key: string
          value_type: string
        }
        Insert: {
          allowed_values_json?: Json | null
          created_at?: string | null
          default_weight?: number | null
          description?: string | null
          id?: string
          key: string
          value_type?: string
        }
        Update: {
          allowed_values_json?: Json | null
          created_at?: string | null
          default_weight?: number | null
          description?: string | null
          id?: string
          key?: string
          value_type?: string
        }
        Relationships: []
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
      principles: {
        Row: {
          created_at: string | null
          description: string
          enforcement_payload_json: Json | null
          enforcement_type: string
          principle_key: string
        }
        Insert: {
          created_at?: string | null
          description: string
          enforcement_payload_json?: Json | null
          enforcement_type?: string
          principle_key: string
        }
        Update: {
          created_at?: string | null
          description?: string
          enforcement_payload_json?: Json | null
          enforcement_type?: string
          principle_key?: string
        }
        Relationships: []
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
      product_formats: {
        Row: {
          created_at: string | null
          format_type: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string | null
          format_type: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string | null
          format_type?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_formats_product_id_fkey"
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
      product_vibe_scores: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          product_id: string
          score: number
          vibe_dimension: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          product_id: string
          score?: number
          vibe_dimension: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          product_id?: string
          score?: number
          vibe_dimension?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_vibe_scores_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          activity_type_id: string | null
          area_id: string | null
          best_for: string[] | null
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
          indexability_state: string | null
          is_active: boolean | null
          is_indexable: boolean | null
          latitude: number | null
          legacy_experience_id: string | null
          like_count: number | null
          longitude: number | null
          meeting_points: Json | null
          pair_with_ids: string[] | null
          publish_score: number | null
          publish_state: string | null
          rating: number | null
          slug: string
          tier: string | null
          title: string
          updated_at: string | null
          video_url: string | null
          view_count: number | null
          visibility_output_state: string | null
          weather: string | null
        }
        Insert: {
          activity_type_id?: string | null
          area_id?: string | null
          best_for?: string[] | null
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
          indexability_state?: string | null
          is_active?: boolean | null
          is_indexable?: boolean | null
          latitude?: number | null
          legacy_experience_id?: string | null
          like_count?: number | null
          longitude?: number | null
          meeting_points?: Json | null
          pair_with_ids?: string[] | null
          publish_score?: number | null
          publish_state?: string | null
          rating?: number | null
          slug: string
          tier?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
          visibility_output_state?: string | null
          weather?: string | null
        }
        Update: {
          activity_type_id?: string | null
          area_id?: string | null
          best_for?: string[] | null
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
          indexability_state?: string | null
          is_active?: boolean | null
          is_indexable?: boolean | null
          latitude?: number | null
          legacy_experience_id?: string | null
          like_count?: number | null
          longitude?: number | null
          meeting_points?: Json | null
          pair_with_ids?: string[] | null
          publish_score?: number | null
          publish_state?: string | null
          rating?: number | null
          slug?: string
          tier?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
          visibility_output_state?: string | null
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
          copy_count: number | null
          cover_image: string | null
          created_at: string | null
          creator_id: string | null
          description: string | null
          experiences: Json | null
          id: string
          indexability_state: string | null
          is_active: boolean | null
          like_count: number | null
          name: string
          save_count: number | null
          slug: string
          tag: string | null
          trips: Json | null
          updated_at: string | null
          url: string | null
          view_count: number | null
        }
        Insert: {
          city_id?: string | null
          copy_count?: number | null
          cover_image?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          experiences?: Json | null
          id?: string
          indexability_state?: string | null
          is_active?: boolean | null
          like_count?: number | null
          name: string
          save_count?: number | null
          slug: string
          tag?: string | null
          trips?: Json | null
          updated_at?: string | null
          url?: string | null
          view_count?: number | null
        }
        Update: {
          city_id?: string | null
          copy_count?: number | null
          cover_image?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          experiences?: Json | null
          id?: string
          indexability_state?: string | null
          is_active?: boolean | null
          like_count?: number | null
          name?: string
          save_count?: number | null
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
      public_surfaces: {
        Row: {
          created_at: string | null
          entity_type: string
          is_indexable_candidate: boolean | null
          min_readiness_score_to_index: number | null
          min_readiness_score_to_publish: number | null
          requires_schema_jsonld: boolean | null
          requires_ssr: boolean | null
          route_pattern: string
          surface_key: string
        }
        Insert: {
          created_at?: string | null
          entity_type: string
          is_indexable_candidate?: boolean | null
          min_readiness_score_to_index?: number | null
          min_readiness_score_to_publish?: number | null
          requires_schema_jsonld?: boolean | null
          requires_ssr?: boolean | null
          route_pattern: string
          surface_key: string
        }
        Update: {
          created_at?: string | null
          entity_type?: string
          is_indexable_candidate?: boolean | null
          min_readiness_score_to_index?: number | null
          min_readiness_score_to_publish?: number | null
          requires_schema_jsonld?: boolean | null
          requires_ssr?: boolean | null
          route_pattern?: string
          surface_key?: string
        }
        Relationships: []
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
      quality_scores: {
        Row: {
          computed_at: string | null
          conversion_score: number | null
          entity_id: string
          entity_type: string
          id: string
          media_score: number | null
          metadata_score: number | null
          overall_score: number | null
          pairing_score: number | null
          question_score: number | null
          relation_score: number | null
          schema_score: number | null
          title_score: number | null
        }
        Insert: {
          computed_at?: string | null
          conversion_score?: number | null
          entity_id: string
          entity_type: string
          id?: string
          media_score?: number | null
          metadata_score?: number | null
          overall_score?: number | null
          pairing_score?: number | null
          question_score?: number | null
          relation_score?: number | null
          schema_score?: number | null
          title_score?: number | null
        }
        Update: {
          computed_at?: string | null
          conversion_score?: number | null
          entity_id?: string
          entity_type?: string
          id?: string
          media_score?: number | null
          metadata_score?: number | null
          overall_score?: number | null
          pairing_score?: number | null
          question_score?: number | null
          relation_score?: number | null
          schema_score?: number | null
          title_score?: number | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          body: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          is_pinned: boolean | null
          status: string
          updated_at: string | null
          user_id: string
          vote_count: number | null
        }
        Insert: {
          body: string
          created_at?: string | null
          entity_id: string
          entity_type?: string
          id?: string
          is_pinned?: boolean | null
          status?: string
          updated_at?: string | null
          user_id: string
          vote_count?: number | null
        }
        Update: {
          body?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_pinned?: boolean | null
          status?: string
          updated_at?: string | null
          user_id?: string
          vote_count?: number | null
        }
        Relationships: []
      }
      readiness_scores: {
        Row: {
          analytics_score: number | null
          blockers_json: Json | null
          canonical_score: number | null
          commerce_score: number | null
          computed_at: string | null
          content_score: number | null
          entity_id: string
          entity_type: string
          feed_score: number | null
          geo_score: number | null
          graph_score: number | null
          id: string
          is_publishable: boolean | null
          media_score: number | null
          overall_score: number | null
          qa_score: number | null
          recommended_state: string | null
          route_score: number | null
          taxonomy_score: number | null
        }
        Insert: {
          analytics_score?: number | null
          blockers_json?: Json | null
          canonical_score?: number | null
          commerce_score?: number | null
          computed_at?: string | null
          content_score?: number | null
          entity_id: string
          entity_type: string
          feed_score?: number | null
          geo_score?: number | null
          graph_score?: number | null
          id?: string
          is_publishable?: boolean | null
          media_score?: number | null
          overall_score?: number | null
          qa_score?: number | null
          recommended_state?: string | null
          route_score?: number | null
          taxonomy_score?: number | null
        }
        Update: {
          analytics_score?: number | null
          blockers_json?: Json | null
          canonical_score?: number | null
          commerce_score?: number | null
          computed_at?: string | null
          content_score?: number | null
          entity_id?: string
          entity_type?: string
          feed_score?: number | null
          geo_score?: number | null
          graph_score?: number | null
          id?: string
          is_publishable?: boolean | null
          media_score?: number | null
          overall_score?: number | null
          qa_score?: number | null
          recommended_state?: string | null
          route_score?: number | null
          taxonomy_score?: number | null
        }
        Relationships: []
      }
      recommendation_candidate_sets: {
        Row: {
          context_json: Json
          generated_at: string | null
          id: string
          set_type: string
        }
        Insert: {
          context_json?: Json
          generated_at?: string | null
          id?: string
          set_type?: string
        }
        Update: {
          context_json?: Json
          generated_at?: string | null
          id?: string
          set_type?: string
        }
        Relationships: []
      }
      recommendation_candidates: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          rank: number | null
          reason_json: Json | null
          score: number | null
          set_id: string
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          rank?: number | null
          reason_json?: Json | null
          score?: number | null
          set_id: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          rank?: number | null
          reason_json?: Json | null
          score?: number | null
          set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_candidates_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "recommendation_candidate_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      redirect_registry: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          source_path: string
          status_code: number | null
          target_path: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          source_path: string
          status_code?: number | null
          target_path: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          source_path?: string
          status_code?: number | null
          target_path?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          area_id: string | null
          created_at: string | null
          cuisine_type: string | null
          destination_id: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
        }
        Insert: {
          area_id?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          destination_id?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
        }
        Update: {
          area_id?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          destination_id?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
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
      robots_policies: {
        Row: {
          created_at: string | null
          directive: string
          id: string
          is_active: boolean | null
          route_family: string
          user_agent: string
        }
        Insert: {
          created_at?: string | null
          directive?: string
          id?: string
          is_active?: boolean | null
          route_family: string
          user_agent?: string
        }
        Update: {
          created_at?: string | null
          directive?: string
          id?: string
          is_active?: boolean | null
          route_family?: string
          user_agent?: string
        }
        Relationships: []
      }
      route_families: {
        Row: {
          created_at: string | null
          entity_type: string
          family_key: string
          is_indexable_candidate: boolean | null
          is_public: boolean | null
          pattern_template: string
        }
        Insert: {
          created_at?: string | null
          entity_type: string
          family_key: string
          is_indexable_candidate?: boolean | null
          is_public?: boolean | null
          pattern_template: string
        }
        Update: {
          created_at?: string | null
          entity_type?: string
          family_key?: string
          is_indexable_candidate?: boolean | null
          is_public?: boolean | null
          pattern_template?: string
        }
        Relationships: []
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
      search_documents: {
        Row: {
          aliases_text: string | null
          area_id: string | null
          destination_id: string | null
          entity_id: string
          entity_type: string
          id: string
          popularity_score: number | null
          readiness_score: number | null
          search_vector: unknown
          title: string
          updated_at: string | null
        }
        Insert: {
          aliases_text?: string | null
          area_id?: string | null
          destination_id?: string | null
          entity_id: string
          entity_type: string
          id?: string
          popularity_score?: number | null
          readiness_score?: number | null
          search_vector?: unknown
          title: string
          updated_at?: string | null
        }
        Update: {
          aliases_text?: string | null
          area_id?: string | null
          destination_id?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          popularity_score?: number | null
          readiness_score?: number | null
          search_vector?: unknown
          title?: string
          updated_at?: string | null
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
      search_queries: {
        Row: {
          clicked_entity_id: string | null
          clicked_entity_type: string | null
          created_at: string | null
          detected_dimensions_json: Json | null
          detected_location_json: Json | null
          id: string
          normalised_query: string | null
          raw_query: string
          result_count: number | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          clicked_entity_id?: string | null
          clicked_entity_type?: string | null
          created_at?: string | null
          detected_dimensions_json?: Json | null
          detected_location_json?: Json | null
          id?: string
          normalised_query?: string | null
          raw_query: string
          result_count?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_entity_id?: string | null
          clicked_entity_type?: string | null
          created_at?: string | null
          detected_dimensions_json?: Json | null
          detected_location_json?: Json | null
          id?: string
          normalised_query?: string | null
          raw_query?: string
          result_count?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      search_term_metrics: {
        Row: {
          day: string
          id: string
          itinerary_add_rate: number | null
          query_count: number | null
          save_rate: number | null
          term: string
          trend_score: number | null
          zero_result_count: number | null
        }
        Insert: {
          day: string
          id?: string
          itinerary_add_rate?: number | null
          query_count?: number | null
          save_rate?: number | null
          term: string
          trend_score?: number | null
          zero_result_count?: number | null
        }
        Update: {
          day?: string
          id?: string
          itinerary_add_rate?: number | null
          query_count?: number | null
          save_rate?: number | null
          term?: string
          trend_score?: number | null
          zero_result_count?: number | null
        }
        Relationships: []
      }
      seasonality_profiles: {
        Row: {
          confidence_score: number | null
          entity_id: string
          entity_type: string
          id: string
          monthly_scores: Json
          source_type: string | null
          updated_at: string | null
        }
        Insert: {
          confidence_score?: number | null
          entity_id: string
          entity_type: string
          id?: string
          monthly_scores?: Json
          source_type?: string | null
          updated_at?: string | null
        }
        Update: {
          confidence_score?: number | null
          entity_id?: string
          entity_type?: string
          id?: string
          monthly_scores?: Json
          source_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      semantic_place_profiles: {
        Row: {
          budget_score: number | null
          chill_score: number | null
          coastal_score: number | null
          confidence_score: number | null
          culture_score: number | null
          energetic_score: number | null
          entity_id: string
          entity_type: string
          family_score: number | null
          food_score: number | null
          id: string
          localness_score: number | null
          luxury_score: number | null
          nature_score: number | null
          nightlife_score: number | null
          source_breakdown_json: Json | null
          touristiness_score: number | null
          updated_at: string | null
          urban_score: number | null
          walkability_score: number | null
        }
        Insert: {
          budget_score?: number | null
          chill_score?: number | null
          coastal_score?: number | null
          confidence_score?: number | null
          culture_score?: number | null
          energetic_score?: number | null
          entity_id: string
          entity_type: string
          family_score?: number | null
          food_score?: number | null
          id?: string
          localness_score?: number | null
          luxury_score?: number | null
          nature_score?: number | null
          nightlife_score?: number | null
          source_breakdown_json?: Json | null
          touristiness_score?: number | null
          updated_at?: string | null
          urban_score?: number | null
          walkability_score?: number | null
        }
        Update: {
          budget_score?: number | null
          chill_score?: number | null
          coastal_score?: number | null
          confidence_score?: number | null
          culture_score?: number | null
          energetic_score?: number | null
          entity_id?: string
          entity_type?: string
          family_score?: number | null
          food_score?: number | null
          id?: string
          localness_score?: number | null
          luxury_score?: number | null
          nature_score?: number | null
          nightlife_score?: number | null
          source_breakdown_json?: Json | null
          touristiness_score?: number | null
          updated_at?: string | null
          urban_score?: number | null
          walkability_score?: number | null
        }
        Relationships: []
      }
      session_profiles: {
        Row: {
          created_at: string | null
          first_seen: string | null
          id: string
          inferred_destination_interest: string | null
          inferred_prefs_snapshot: Json | null
          last_seen: string | null
          page_count: number | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          first_seen?: string | null
          id?: string
          inferred_destination_interest?: string | null
          inferred_prefs_snapshot?: Json | null
          last_seen?: string | null
          page_count?: number | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          first_seen?: string | null
          id?: string
          inferred_destination_interest?: string | null
          inferred_prefs_snapshot?: Json | null
          last_seen?: string | null
          page_count?: number | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      stays: {
        Row: {
          area_id: string | null
          created_at: string | null
          destination_id: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          stay_type: string | null
        }
        Insert: {
          area_id?: string | null
          created_at?: string | null
          destination_id?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          stay_type?: string | null
        }
        Update: {
          area_id?: string | null
          created_at?: string | null
          destination_id?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          stay_type?: string | null
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
      system_constants: {
        Row: {
          key: string
          updated_at: string | null
          updated_by: string | null
          value_json: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value_json?: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value_json?: Json
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
      transport_legs: {
        Row: {
          cost_estimate: number | null
          created_at: string | null
          dest_name: string
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          mode: string | null
          origin_name: string
        }
        Insert: {
          cost_estimate?: number | null
          created_at?: string | null
          dest_name: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          mode?: string | null
          origin_name: string
        }
        Update: {
          cost_estimate?: number | null
          created_at?: string | null
          dest_name?: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          mode?: string | null
          origin_name?: string
        }
        Relationships: []
      }
      travel_time_edges: {
        Row: {
          dest_id: string
          dest_type: string
          duration_minutes_peak: number | null
          duration_minutes_typical: number | null
          friction_score: number | null
          id: string
          mode: string
          origin_id: string
          origin_type: string
          source_type: string | null
          updated_at: string | null
        }
        Insert: {
          dest_id: string
          dest_type: string
          duration_minutes_peak?: number | null
          duration_minutes_typical?: number | null
          friction_score?: number | null
          id?: string
          mode?: string
          origin_id: string
          origin_type: string
          source_type?: string | null
          updated_at?: string | null
        }
        Update: {
          dest_id?: string
          dest_type?: string
          duration_minutes_peak?: number | null
          duration_minutes_typical?: number | null
          friction_score?: number | null
          id?: string
          mode?: string
          origin_id?: string
          origin_type?: string
          source_type?: string | null
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
      trip_collaborations: {
        Row: {
          created_at: string | null
          id: string
          invited_email: string | null
          invited_user_id: string | null
          itinerary_id: string
          role: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_email?: string | null
          invited_user_id?: string | null
          itinerary_id: string
          role?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_email?: string | null
          invited_user_id?: string | null
          itinerary_id?: string
          role?: string | null
          status?: string | null
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string | null
          followed_id: string
          followed_type: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          followed_id: string
          followed_type?: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          followed_id?: string
          followed_type?: string
          follower_id?: string
          id?: string
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
      user_preference_values: {
        Row: {
          confidence_score: number | null
          dimension_id: string
          evidence_json: Json | null
          id: string
          source_type: string | null
          updated_at: string | null
          user_id: string
          valid_from: string | null
          valid_to: string | null
          value_bool: boolean | null
          value_enum: string | null
          value_json: Json | null
          value_number: number | null
          value_text: string | null
        }
        Insert: {
          confidence_score?: number | null
          dimension_id: string
          evidence_json?: Json | null
          id?: string
          source_type?: string | null
          updated_at?: string | null
          user_id: string
          valid_from?: string | null
          valid_to?: string | null
          value_bool?: boolean | null
          value_enum?: string | null
          value_json?: Json | null
          value_number?: number | null
          value_text?: string | null
        }
        Update: {
          confidence_score?: number | null
          dimension_id?: string
          evidence_json?: Json | null
          id?: string
          source_type?: string | null
          updated_at?: string | null
          user_id?: string
          valid_from?: string | null
          valid_to?: string | null
          value_bool?: boolean | null
          value_enum?: string | null
          value_json?: Json | null
          value_number?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preference_values_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "preference_dimensions"
            referencedColumns: ["id"]
          },
        ]
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
      user_saves: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_states: {
        Row: {
          computed_at: string | null
          id: string
          state: string
          state_confidence: number | null
          user_id: string
        }
        Insert: {
          computed_at?: string | null
          id?: string
          state?: string
          state_confidence?: number | null
          user_id: string
        }
        Update: {
          computed_at?: string | null
          id?: string
          state?: string
          state_confidence?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_type_definitions: {
        Row: {
          created_at: string | null
          description: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          label: string
          type_key: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          type_key: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          type_key?: string
        }
        Relationships: []
      }
      user_type_tags: {
        Row: {
          confidence_score: number | null
          id: string
          source_type: string | null
          type_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          id?: string
          source_type?: string | null
          type_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          id?: string
          source_type?: string | null
          type_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_type_tags_type_key_fkey"
            columns: ["type_key"]
            isOneToOne: false
            referencedRelation: "user_type_definitions"
            referencedColumns: ["type_key"]
          },
        ]
      }
      validation_results: {
        Row: {
          blocking_flag: boolean | null
          created_at: string | null
          dimension: string | null
          entity_id: string
          entity_type: string
          id: string
          message: string
          severity: string
          status: string | null
          suggested_fix: string | null
          validator_type: string
        }
        Insert: {
          blocking_flag?: boolean | null
          created_at?: string | null
          dimension?: string | null
          entity_id: string
          entity_type: string
          id?: string
          message: string
          severity?: string
          status?: string | null
          suggested_fix?: string | null
          validator_type: string
        }
        Update: {
          blocking_flag?: boolean | null
          created_at?: string | null
          dimension?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          message?: string
          severity?: string
          status?: string | null
          suggested_fix?: string | null
          validator_type?: string
        }
        Relationships: []
      }
      weather_snapshots: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          forecast_time: string | null
          freshness_expires_at: string | null
          id: string
          payload_json: Json
          provider_key: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          forecast_time?: string | null
          freshness_expires_at?: string | null
          id?: string
          payload_json?: Json
          provider_key?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          forecast_time?: string | null
          freshness_expires_at?: string | null
          id?: string
          payload_json?: Json
          provider_key?: string | null
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
