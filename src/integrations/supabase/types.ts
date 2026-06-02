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
      achievements: {
        Row: {
          code: string
          description: string | null
          earned_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          code: string
          description?: string | null
          earned_at?: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          code?: string
          description?: string | null
          earned_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_history: {
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
      digital_twin_predictions: {
        Row: {
          created_at: string
          id: string
          meta: Json | null
          predicted_body_fat: number | null
          predicted_fitness_score: number | null
          predicted_for: string
          predicted_muscle_kg: number | null
          predicted_weight_kg: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta?: Json | null
          predicted_body_fat?: number | null
          predicted_fitness_score?: number | null
          predicted_for: string
          predicted_muscle_kg?: number | null
          predicted_weight_kg?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meta?: Json | null
          predicted_body_fat?: number | null
          predicted_fitness_score?: number | null
          predicted_for?: string
          predicted_muscle_kg?: number | null
          predicted_weight_kg?: number | null
          user_id?: string
        }
        Relationships: []
      }
      health_scores: {
        Row: {
          date: string
          details: Json | null
          id: string
          score: number
          user_id: string
        }
        Insert: {
          date?: string
          details?: Json | null
          id?: string
          score: number
          user_id: string
        }
        Update: {
          date?: string
          details?: Json | null
          id?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      nutrition_logs: {
        Row: {
          calories: number
          carbs_g: number | null
          fat_g: number | null
          id: string
          logged_at: string
          meal: string
          protein_g: number | null
          user_id: string
          water_ml: number | null
        }
        Insert: {
          calories?: number
          carbs_g?: number | null
          fat_g?: number | null
          id?: string
          logged_at?: string
          meal: string
          protein_g?: number | null
          user_id: string
          water_ml?: number | null
        }
        Update: {
          calories?: number
          carbs_g?: number | null
          fat_g?: number | null
          id?: string
          logged_at?: string
          meal?: string
          protein_g?: number | null
          user_id?: string
          water_ml?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"] | null
          age: number | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          goal: Database["public"]["Enums"]["fitness_goal"] | null
          height_cm: number | null
          id: string
          language: string | null
          onboarded: boolean | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          goal?: Database["public"]["Enums"]["fitness_goal"] | null
          height_cm?: number | null
          id: string
          language?: string | null
          onboarded?: boolean | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          goal?: Database["public"]["Enums"]["fitness_goal"] | null
          height_cm?: number | null
          id?: string
          language?: string | null
          onboarded?: boolean | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      workout_logs: {
        Row: {
          calories_burned: number | null
          duration_sec: number | null
          exercise: string
          id: string
          notes: string | null
          performed_at: string
          reps: number | null
          sets: number | null
          user_id: string
        }
        Insert: {
          calories_burned?: number | null
          duration_sec?: number | null
          exercise: string
          id?: string
          notes?: string | null
          performed_at?: string
          reps?: number | null
          sets?: number | null
          user_id: string
        }
        Update: {
          calories_burned?: number | null
          duration_sec?: number | null
          exercise?: string
          id?: string
          notes?: string | null
          performed_at?: string
          reps?: number | null
          sets?: number | null
          user_id?: string
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          active: boolean | null
          created_at: string
          days_per_week: number | null
          goal: Database["public"]["Enums"]["fitness_goal"] | null
          id: string
          plan: Json
          title: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          days_per_week?: number | null
          goal?: Database["public"]["Enums"]["fitness_goal"] | null
          id?: string
          plan: Json
          title: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          days_per_week?: number | null
          goal?: Database["public"]["Enums"]["fitness_goal"] | null
          id?: string
          plan?: Json
          title?: string
          user_id?: string
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
      activity_level:
        | "sedentary"
        | "light"
        | "moderate"
        | "active"
        | "very_active"
      fitness_goal:
        | "weight_loss"
        | "muscle_gain"
        | "recomposition"
        | "general_fitness"
      gender_type: "male" | "female" | "other"
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
      activity_level: [
        "sedentary",
        "light",
        "moderate",
        "active",
        "very_active",
      ],
      fitness_goal: [
        "weight_loss",
        "muscle_gain",
        "recomposition",
        "general_fitness",
      ],
      gender_type: ["male", "female", "other"],
    },
  },
} as const
