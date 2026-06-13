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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_insights: {
        Row: {
          comment_count: number | null
          created_at: string
          id: string
          negative_highlights: Json | null
          positive_highlights: Json | null
          summary: string
          top_themes: Json | null
          user_id: string
        }
        Insert: {
          comment_count?: number | null
          created_at?: string
          id?: string
          negative_highlights?: Json | null
          positive_highlights?: Json | null
          summary: string
          top_themes?: Json | null
          user_id: string
        }
        Update: {
          comment_count?: number | null
          created_at?: string
          id?: string
          negative_highlights?: Json | null
          positive_highlights?: Json | null
          summary?: string
          top_themes?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          message: string | null
          read: boolean
          title: string
          type: Database["public"]["Enums"]["alert_type"]
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          title: string
          type: Database["public"]["Enums"]["alert_type"]
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["alert_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          analyzed: boolean
          author: string | null
          created_at: string
          english_text: string | null
          id: string
          is_spam: boolean
          language: string | null
          original_text: string
          platform: string
          product: string | null
          rating: number | null
          raw_payload: Json | null
          sentiment_label: Database["public"]["Enums"]["sentiment_label"] | null
          sentiment_score: number | null
          source_id: string | null
          spam_reason: string | null
          themes: string[] | null
          user_id: string
        }
        Insert: {
          analyzed?: boolean
          author?: string | null
          created_at?: string
          english_text?: string | null
          id?: string
          is_spam?: boolean
          language?: string | null
          original_text: string
          platform?: string
          product?: string | null
          rating?: number | null
          raw_payload?: Json | null
          sentiment_label?:
            | Database["public"]["Enums"]["sentiment_label"]
            | null
          sentiment_score?: number | null
          source_id?: string | null
          spam_reason?: string | null
          themes?: string[] | null
          user_id: string
        }
        Update: {
          analyzed?: boolean
          author?: string | null
          created_at?: string
          english_text?: string | null
          id?: string
          is_spam?: boolean
          language?: string | null
          original_text?: string
          platform?: string
          product?: string | null
          rating?: number | null
          raw_payload?: Json | null
          sentiment_label?:
            | Database["public"]["Enums"]["sentiment_label"]
            | null
          sentiment_score?: number | null
          source_id?: string | null
          spam_reason?: string | null
          themes?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_name: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          business_name?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          business_name?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          created_at: string
          diagnosis: string | null
          id: string
          next_action: string | null
          priority: string | null
          situation: string | null
          steps: Json | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          diagnosis?: string | null
          id?: string
          next_action?: string | null
          priority?: string | null
          situation?: string | null
          steps?: Json | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          diagnosis?: string | null
          id?: string
          next_action?: string | null
          priority?: string | null
          situation?: string | null
          steps?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          active: boolean
          created_at: string
          id: string
          ingest_token: string
          name: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          ingest_token?: string
          name: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          ingest_token?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      alert_type:
        | "new_comment"
        | "negative_spike"
        | "spam_burst"
        | "recommendation_ready"
      app_role: "admin" | "owner"
      sentiment_label: "positive" | "neutral" | "negative"
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
      alert_type: [
        "new_comment",
        "negative_spike",
        "spam_burst",
        "recommendation_ready",
      ],
      app_role: ["admin", "owner"],
      sentiment_label: ["positive", "neutral", "negative"],
    },
  },
} as const
