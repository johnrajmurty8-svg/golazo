export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          organiser_id: string;
          name: string;
          description: string | null;
          start_date: string;
          end_date: string;
          cover_image_url: string | null;
          share_token: string;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organiser_id: string;
          name: string;
          description?: string | null;
          start_date: string;
          end_date: string;
          cover_image_url?: string | null;
          share_token?: string;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          start_date?: string;
          end_date?: string;
          cover_image_url?: string | null;
          share_token?: string;
          deleted_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      trip_members: {
        Row: {
          id: string;
          trip_id: string;
          user_id: string;
          role: "organiser" | "member";
          joined_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          user_id: string;
          role: "organiser" | "member";
          joined_at?: string;
        };
        Update: {
          role?: "organiser" | "member";
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          trip_id: string;
          uploaded_by: string;
          file_name: string;
          file_size_bytes: number;
          storage_path: string;
          mime_type: string;
          parse_status: "unparsed" | "parsing" | "parsed" | "failed";
          parse_failure_reason: string | null;
          parsed_at: string | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          uploaded_by: string;
          file_name: string;
          file_size_bytes: number;
          storage_path: string;
          mime_type: string;
          parse_status?: "unparsed" | "parsing" | "parsed" | "failed";
          parse_failure_reason?: string | null;
          parsed_at?: string | null;
          uploaded_at?: string;
        };
        Update: {
          file_name?: string;
          file_size_bytes?: number;
          storage_path?: string;
          mime_type?: string;
          parse_status?: "unparsed" | "parsing" | "parsed" | "failed";
          parse_failure_reason?: string | null;
          parsed_at?: string | null;
        };
        Relationships: [];
      };
      parsed_flights: {
        Row: {
          id: string;
          trip_id: string;
          source_document_id: string | null;
          airline: string | null;
          flight_number: string | null;
          from_airport: string | null;
          to_airport: string | null;
          departure_date: string | null;
          departure_time: string | null;
          arrival_date: string | null;
          arrival_time: string | null;
          confirmation_number: string | null;
          travellers: string[] | null;
          confidence_score: number;
          is_locked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          source_document_id?: string | null;
          airline?: string | null;
          flight_number?: string | null;
          from_airport?: string | null;
          to_airport?: string | null;
          departure_date?: string | null;
          departure_time?: string | null;
          arrival_date?: string | null;
          arrival_time?: string | null;
          confirmation_number?: string | null;
          travellers?: string[] | null;
          confidence_score?: number;
          is_locked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          airline?: string | null;
          flight_number?: string | null;
          from_airport?: string | null;
          to_airport?: string | null;
          departure_date?: string | null;
          departure_time?: string | null;
          arrival_date?: string | null;
          arrival_time?: string | null;
          confirmation_number?: string | null;
          travellers?: string[] | null;
          confidence_score?: number;
          is_locked?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      parsed_accommodation: {
        Row: {
          id: string;
          trip_id: string;
          source_document_id: string | null;
          property_name: string | null;
          location: string | null;
          check_in_date: string | null;
          check_out_date: string | null;
          confirmation_number: string | null;
          travellers: string[] | null;
          confidence_score: number;
          is_locked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          source_document_id?: string | null;
          property_name?: string | null;
          location?: string | null;
          check_in_date?: string | null;
          check_out_date?: string | null;
          confirmation_number?: string | null;
          travellers?: string[] | null;
          confidence_score?: number;
          is_locked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          property_name?: string | null;
          location?: string | null;
          check_in_date?: string | null;
          check_out_date?: string | null;
          confirmation_number?: string | null;
          travellers?: string[] | null;
          confidence_score?: number;
          is_locked?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      itinerary_days: {
        Row: {
          id: string;
          trip_id: string;
          date: string;
          title: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          date: string;
          title?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string | null;
        };
        Relationships: [];
      };
      itinerary_events: {
        Row: {
          id: string;
          day_id: string;
          trip_id: string;
          time: string | null;
          title: string;
          description: string | null;
          location: string | null;
          event_type: "flight" | "accommodation" | "activity" | "transfer" | "general";
          source_entity_id: string | null;
          source_document_id: string | null;
          confidence_score: number;
          is_locked: boolean;
          sort_order: number;
          travellers: string[] | null;
          tags: string[] | null;
          booking_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          day_id: string;
          trip_id: string;
          time?: string | null;
          title: string;
          description?: string | null;
          location?: string | null;
          event_type?: "flight" | "accommodation" | "activity" | "transfer" | "general";
          source_entity_id?: string | null;
          source_document_id?: string | null;
          confidence_score?: number;
          is_locked?: boolean;
          sort_order?: number;
          travellers?: string[] | null;
          tags?: string[] | null;
          booking_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          time?: string | null;
          title?: string;
          description?: string | null;
          location?: string | null;
          event_type?: "flight" | "accommodation" | "activity" | "transfer" | "general";
          source_document_id?: string | null;
          confidence_score?: number;
          is_locked?: boolean;
          sort_order?: number;
          travellers?: string[] | null;
          tags?: string[] | null;
          booking_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_attachments: {
        Row: {
          id: string;
          event_id: string;
          trip_id: string;
          file_name: string;
          storage_path: string;
          file_size: number;
          mime_type: string;
          uploaded_by: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          trip_id: string;
          file_name: string;
          storage_path: string;
          file_size: number;
          mime_type: string;
          uploaded_by: string;
          uploaded_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      action_alerts: {
        Row: {
          id: string;
          trip_id: string;
          alert_type: "missing_booking" | "date_conflict" | "traveller_gap" | "confidence_flag" | "general";
          severity: "info" | "warning" | "critical";
          title: string;
          description: string;
          is_resolved: boolean;
          related_entity_type: string | null;
          related_entity_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          alert_type: "missing_booking" | "date_conflict" | "traveller_gap" | "confidence_flag" | "general";
          severity?: "info" | "warning" | "critical";
          title: string;
          description: string;
          is_resolved?: boolean;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          created_at?: string;
        };
        Update: {
          is_resolved?: boolean;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          trip_id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      ai_audit_log: {
        Row: {
          id: string;
          trip_id: string | null;
          user_id: string | null;
          agent: "parser" | "chatbot";
          input_tokens: number | null;
          output_tokens: number | null;
          prompt_hash: string | null;
          response_summary: string | null;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id?: string | null;
          user_id?: string | null;
          agent: "parser" | "chatbot";
          input_tokens?: number | null;
          output_tokens?: number | null;
          prompt_hash?: string | null;
          response_summary?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Convenience row type aliases
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Trip = Database["public"]["Tables"]["trips"]["Row"];
export type TripMember = Database["public"]["Tables"]["trip_members"]["Row"];
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type ParsedFlight = Database["public"]["Tables"]["parsed_flights"]["Row"];
export type ParsedAccommodation = Database["public"]["Tables"]["parsed_accommodation"]["Row"];
export type ItineraryDay = Database["public"]["Tables"]["itinerary_days"]["Row"];
export type ItineraryEvent = Database["public"]["Tables"]["itinerary_events"]["Row"];
export type EventAttachment = Database["public"]["Tables"]["event_attachments"]["Row"];
export type ActionAlert = Database["public"]["Tables"]["action_alerts"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];
export type AiAuditLog = Database["public"]["Tables"]["ai_audit_log"]["Row"];
