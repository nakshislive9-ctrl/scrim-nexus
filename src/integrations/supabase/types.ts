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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      lobby_results: {
        Row: {
          created_at: string
          id: string
          lobby_id: string
          map: string | null
          screenshot_url: string | null
          submitted_by: string
          team_a_score: number
          team_b_score: number
          team_id: string
          team_side: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lobby_id: string
          map?: string | null
          screenshot_url?: string | null
          submitted_by: string
          team_a_score?: number
          team_b_score?: number
          team_id: string
          team_side: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lobby_id?: string
          map?: string | null
          screenshot_url?: string | null
          submitted_by?: string
          team_a_score?: number
          team_b_score?: number
          team_id?: string
          team_side?: string
          updated_at?: string
        }
        Relationships: []
      }
      match_results: {
        Row: {
          away_score: number
          created_at: string
          home_score: number
          id: string
          is_draw: boolean
          mvp_player: string | null
          notes: string | null
          reported_by: string
          scrim_id: string
          updated_at: string
          winner_team_id: string | null
        }
        Insert: {
          away_score?: number
          created_at?: string
          home_score?: number
          id?: string
          is_draw?: boolean
          mvp_player?: string | null
          notes?: string | null
          reported_by: string
          scrim_id: string
          updated_at?: string
          winner_team_id?: string | null
        }
        Update: {
          away_score?: number
          created_at?: string
          home_score?: number
          id?: string
          is_draw?: boolean
          mvp_player?: string | null
          notes?: string | null
          reported_by?: string
          scrim_id?: string
          updated_at?: string
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_results_scrim_id_fkey"
            columns: ["scrim_id"]
            isOneToOne: true
            referencedRelation: "scrims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          scrim_request_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          scrim_request_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          scrim_request_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_scrim_request_id_fkey"
            columns: ["scrim_request_id"]
            isOneToOne: false
            referencedRelation: "scrim_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          reference_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          reference_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      player_listings: {
        Row: {
          created_at: string
          description: string | null
          game: string
          id: string
          ign: string
          level: string | null
          listing_type: string
          rank: string
          region: string | null
          role: string | null
          team_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          game: string
          id?: string
          ign: string
          level?: string | null
          listing_type: string
          rank: string
          region?: string | null
          role?: string | null
          team_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          game?: string
          id?: string
          ign?: string
          level?: string | null
          listing_type?: string
          rank?: string
          region?: string | null
          role?: string | null
          team_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_listings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          team_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          team_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          team_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scrim_lobbies: {
        Row: {
          created_at: string
          current_turn_captain_id: string | null
          discord_pinged_at: string | null
          final_screenshot_url: string | null
          final_team_a_score: number | null
          final_team_b_score: number | null
          game: string
          id: string
          status: string
          team_a_captain_id: string
          team_a_id: string
          team_b_captain_id: string | null
          team_b_id: string | null
          turn_deadline: string | null
          updated_at: string
          veto_state: Json
        }
        Insert: {
          created_at?: string
          current_turn_captain_id?: string | null
          discord_pinged_at?: string | null
          final_screenshot_url?: string | null
          final_team_a_score?: number | null
          final_team_b_score?: number | null
          game: string
          id?: string
          status?: string
          team_a_captain_id: string
          team_a_id: string
          team_b_captain_id?: string | null
          team_b_id?: string | null
          turn_deadline?: string | null
          updated_at?: string
          veto_state?: Json
        }
        Update: {
          created_at?: string
          current_turn_captain_id?: string | null
          discord_pinged_at?: string | null
          final_screenshot_url?: string | null
          final_team_a_score?: number | null
          final_team_b_score?: number | null
          game?: string
          id?: string
          status?: string
          team_a_captain_id?: string
          team_a_id?: string
          team_b_captain_id?: string | null
          team_b_id?: string | null
          turn_deadline?: string | null
          updated_at?: string
          veto_state?: Json
        }
        Relationships: [
          {
            foreignKeyName: "scrim_lobbies_team_a_id_fkey"
            columns: ["team_a_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrim_lobbies_team_b_id_fkey"
            columns: ["team_b_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      scrim_requests: {
        Row: {
          challenged_captain_id: string
          challenged_team_id: string
          challenger_captain_id: string
          challenger_team_id: string
          created_at: string
          id: string
          message: string | null
          proposed_by: string | null
          proposed_time: string | null
          status: string
          time_status: string
          updated_at: string
        }
        Insert: {
          challenged_captain_id: string
          challenged_team_id: string
          challenger_captain_id: string
          challenger_team_id: string
          created_at?: string
          id?: string
          message?: string | null
          proposed_by?: string | null
          proposed_time?: string | null
          status?: string
          time_status?: string
          updated_at?: string
        }
        Update: {
          challenged_captain_id?: string
          challenged_team_id?: string
          challenger_captain_id?: string
          challenger_team_id?: string
          created_at?: string
          id?: string
          message?: string | null
          proposed_by?: string | null
          proposed_time?: string | null
          status?: string
          time_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrim_requests_challenged_team_id_fkey"
            columns: ["challenged_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrim_requests_challenger_team_id_fkey"
            columns: ["challenger_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      scrims: {
        Row: {
          away_team_id: string
          created_at: string
          home_team_id: string
          id: string
          request_id: string
          scheduled_time: string
          status: string
          updated_at: string
        }
        Insert: {
          away_team_id: string
          created_at?: string
          home_team_id: string
          id?: string
          request_id: string
          scheduled_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          away_team_id?: string
          created_at?: string
          home_team_id?: string
          id?: string
          request_id?: string
          scheduled_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrims_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrims_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrims_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "scrim_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          ign: string
          is_captain: boolean | null
          level: string | null
          member_rank: string | null
          role: string | null
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ign: string
          is_captain?: boolean | null
          level?: string | null
          member_rank?: string | null
          role?: string | null
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ign?: string
          is_captain?: boolean | null
          level?: string | null
          member_rank?: string | null
          role?: string | null
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string
          team_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_id: string
          team_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          team_id?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          captain_id: string
          created_at: string
          discord_webhook_url: string | null
          game: string
          id: string
          join_code: string
          map_pool: Json | null
          name: string
          rank: string
          region: string | null
          reliability_score: number | null
          updated_at: string
        }
        Insert: {
          captain_id: string
          created_at?: string
          discord_webhook_url?: string | null
          game: string
          id?: string
          join_code?: string
          map_pool?: Json | null
          name: string
          rank: string
          region?: string | null
          reliability_score?: number | null
          updated_at?: string
        }
        Update: {
          captain_id?: string
          created_at?: string
          discord_webhook_url?: string | null
          game?: string
          id?: string
          join_code?: string
          map_pool?: Json | null
          name?: string
          rank?: string
          region?: string | null
          reliability_score?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_games: {
        Row: {
          created_at: string
          game: string
          id: string
          ign: string | null
          rank: string | null
          region: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game: string
          id?: string
          ign?: string | null
          rank?: string | null
          region?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          game?: string
          id?: string
          ign?: string | null
          rank?: string | null
          region?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_short_code: { Args: never; Returns: string }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
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
