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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      breakout_room_participants: {
        Row: {
          id: string
          joined_at: string | null
          left_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          left_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          left_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "breakout_room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "breakout_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      breakout_rooms: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          is_active: boolean | null
          max_participants: number | null
          name: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          name: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "breakout_rooms_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          event_id: string
          file_name: string | null
          file_path: string | null
          file_size: number | null
          id: string
          message: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          message?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          message?: string | null
          user_id?: string
        }
        Relationships: []
      }
      event_participants: {
        Row: {
          event_id: string
          id: string
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_polls: {
        Row: {
          created_at: string | null
          created_in_advance: boolean | null
          displayed_at: string | null
          ends_at: string | null
          event_id: string
          id: string
          is_active: boolean | null
          options: Json
          question: string
          scheduled_display_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_in_advance?: boolean | null
          displayed_at?: string | null
          ends_at?: string | null
          event_id: string
          id?: string
          is_active?: boolean | null
          options: Json
          question: string
          scheduled_display_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_in_advance?: boolean | null
          displayed_at?: string | null
          ends_at?: string | null
          event_id?: string
          id?: string
          is_active?: boolean | null
          options?: Json
          question?: string
          scheduled_display_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_polls_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_recordings: {
        Row: {
          created_at: string | null
          duration: number | null
          event_id: string
          file_path: string
          file_size: number | null
          format: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          duration?: number | null
          event_id: string
          file_path: string
          file_size?: number | null
          format?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          duration?: number | null
          event_id?: string
          file_path?: string
          file_size?: number | null
          format?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_recordings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_surveys: {
        Row: {
          created_at: string | null
          created_in_advance: boolean | null
          displayed_at: string | null
          event_id: string
          id: string
          is_active: boolean | null
          questions: Json
          scheduled_display_at: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_in_advance?: boolean | null
          displayed_at?: string | null
          event_id: string
          id?: string
          is_active?: boolean | null
          questions: Json
          scheduled_display_at?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_in_advance?: boolean | null
          displayed_at?: string | null
          event_id?: string
          id?: string
          is_active?: boolean | null
          questions?: Json
          scheduled_display_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_surveys_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          description: string | null
          duration: number
          event_type: string
          id: string
          organizer_id: string
          recording_url: string | null
          scheduled_date: string
          scheduled_polls: Json | null
          scheduled_surveys: Json | null
          status: string | null
          stream_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration: number
          event_type: string
          id?: string
          organizer_id: string
          recording_url?: string | null
          scheduled_date: string
          scheduled_polls?: Json | null
          scheduled_surveys?: Json | null
          status?: string | null
          stream_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration?: number
          event_type?: string
          id?: string
          organizer_id?: string
          recording_url?: string | null
          scheduled_date?: string
          scheduled_polls?: Json | null
          scheduled_surveys?: Json | null
          status?: string | null
          stream_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      participant_activities: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string | null
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string | null
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string | null
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participant_activities_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_responses: {
        Row: {
          created_at: string | null
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_responses_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "event_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      post_event_discussions: {
        Row: {
          created_at: string
          event_id: string
          file_name: string | null
          file_path: string | null
          file_size: number | null
          id: string
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      survey_responses: {
        Row: {
          created_at: string | null
          id: string
          responses: Json
          survey_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          responses: Json
          survey_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          responses?: Json
          survey_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "event_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_event_organizer: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      is_event_participant: {
        Args: { _event_id: string; _user_id: string }
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
    Enums: {},
  },
} as const
