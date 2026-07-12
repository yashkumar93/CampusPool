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
      college_domains: {
        Row: {
          college: string
          created_at: string
          domain: string
        }
        Insert: {
          college: string
          created_at?: string
          domain: string
        }
        Update: {
          college?: string
          created_at?: string
          domain?: string
        }
        Relationships: []
      }
      join_requests: {
        Row: {
          created_at: string
          dest_label: string | null
          dest_lat: number | null
          dest_lng: number | null
          id: string
          message: string | null
          pickup_label: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          requester_id: string
          requester_ride_id: string | null
          seats_requested: number
          status: string
          target_ride_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dest_label?: string | null
          dest_lat?: number | null
          dest_lng?: number | null
          id?: string
          message?: string | null
          pickup_label?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          requester_id: string
          requester_ride_id?: string | null
          seats_requested?: number
          status?: string
          target_ride_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dest_label?: string | null
          dest_lat?: number | null
          dest_lng?: number | null
          id?: string
          message?: string | null
          pickup_label?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          requester_id?: string
          requester_ride_id?: string | null
          seats_requested?: number
          status?: string
          target_ride_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "join_requests_requester_ride_id_fkey"
            columns: ["requester_ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_requests_target_ride_id_fkey"
            columns: ["target_ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "ride_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          college: string
          created_at: string
          department: string | null
          email: string
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          hostel: string | null
          id: string
          phone: string | null
          rating_avg: number
          rating_count: number
          updated_at: string
          verified: boolean
          year: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          college?: string
          created_at?: string
          department?: string | null
          email: string
          full_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          hostel?: string | null
          id: string
          phone?: string | null
          rating_avg?: number
          rating_count?: number
          updated_at?: string
          verified?: boolean
          year?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          college?: string
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          hostel?: string | null
          id?: string
          phone?: string | null
          rating_avg?: number
          rating_count?: number
          updated_at?: string
          verified?: boolean
          year?: string | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          group_id: string
          id: string
          ratee_id: string
          rater_id: string
          stars: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          group_id: string
          id?: string
          ratee_id: string
          rater_id: string
          stars: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          group_id?: string
          id?: string
          ratee_id?: string
          rater_id?: string
          stars?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "ride_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_group_members: {
        Row: {
          dest_label: string | null
          dest_lat: number | null
          dest_lng: number | null
          group_id: string
          id: string
          joined_at: string
          leg_distance_km: number | null
          member_status: string
          pickup_label: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          ride_id: string | null
          role: Database["public"]["Enums"]["ride_role"]
          share_amount: number | null
          user_id: string
        }
        Insert: {
          dest_label?: string | null
          dest_lat?: number | null
          dest_lng?: number | null
          group_id: string
          id?: string
          joined_at?: string
          leg_distance_km?: number | null
          member_status?: string
          pickup_label?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          ride_id?: string | null
          role: Database["public"]["Enums"]["ride_role"]
          share_amount?: number | null
          user_id: string
        }
        Update: {
          dest_label?: string | null
          dest_lat?: number | null
          dest_lng?: number | null
          group_id?: string
          id?: string
          joined_at?: string
          leg_distance_km?: number | null
          member_status?: string
          pickup_label?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          ride_id?: string | null
          role?: Database["public"]["Enums"]["ride_role"]
          share_amount?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "ride_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_group_members_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_groups: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          depart_at: string
          dest_label: string
          driver_id: string | null
          id: string
          name: string | null
          pickup_label: string
          route_polyline: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["ride_status"]
          total_distance_km: number | null
          total_duration_min: number | null
          total_fare_estimate: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          depart_at: string
          dest_label: string
          driver_id?: string | null
          id?: string
          name?: string | null
          pickup_label: string
          route_polyline?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ride_status"]
          total_distance_km?: number | null
          total_duration_min?: number | null
          total_fare_estimate?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          depart_at?: string
          dest_label?: string
          driver_id?: string | null
          id?: string
          name?: string | null
          pickup_label?: string
          route_polyline?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ride_status"]
          total_distance_km?: number | null
          total_duration_min?: number | null
          total_fare_estimate?: number | null
        }
        Relationships: []
      }
      rides: {
        Row: {
          created_at: string
          creator_id: string
          depart_at: string
          dest_label: string
          dest_lat: number
          dest_lng: number
          estimated_cost: number | null
          flex_minutes: number
          group_id: string | null
          id: string
          notes: string | null
          pickup_label: string
          pickup_lat: number
          pickup_lng: number
          role: Database["public"]["Enums"]["ride_role"]
          seats: number
          status: Database["public"]["Enums"]["ride_status"]
          updated_at: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Insert: {
          created_at?: string
          creator_id: string
          depart_at: string
          dest_label: string
          dest_lat: number
          dest_lng: number
          estimated_cost?: number | null
          flex_minutes?: number
          group_id?: string | null
          id?: string
          notes?: string | null
          pickup_label: string
          pickup_lat: number
          pickup_lng: number
          role: Database["public"]["Enums"]["ride_role"]
          seats?: number
          status?: Database["public"]["Enums"]["ride_status"]
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Update: {
          created_at?: string
          creator_id?: string
          depart_at?: string
          dest_label?: string
          dest_lat?: number
          dest_lng?: number
          estimated_cost?: number | null
          flex_minutes?: number
          group_id?: string | null
          id?: string
          notes?: string | null
          pickup_label?: string
          pickup_lat?: number
          pickup_lng?: number
          role?: Database["public"]["Enums"]["ride_role"]
          seats?: number
          status?: Database["public"]["Enums"]["ride_status"]
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Relationships: []
      }
      trip_locations: {
        Row: {
          accuracy: number | null
          group_id: string
          heading: number | null
          id: string
          lat: number
          lng: number
          recorded_at: string
          speed: number | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          group_id: string
          heading?: number | null
          id?: string
          lat: number
          lng: number
          recorded_at?: string
          speed?: number | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          group_id?: string
          heading?: number | null
          id?: string
          lat?: number
          lng?: number
          recorded_at?: string
          speed?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_locations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "ride_groups"
            referencedColumns: ["id"]
          },
        ]
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
      profiles_public: {
        Row: {
          avatar_url: string | null
          college: string | null
          department: string | null
          full_name: string | null
          id: string | null
          rating_avg: number | null
          rating_count: number | null
          verified: boolean | null
          year: string | null
        }
        Insert: {
          avatar_url?: string | null
          college?: string | null
          department?: string | null
          full_name?: string | null
          id?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          verified?: boolean | null
          year?: string | null
        }
        Update: {
          avatar_url?: string | null
          college?: string | null
          department?: string | null
          full_name?: string | null
          id?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          verified?: boolean | null
          year?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      are_co_group_members: {
        Args: { _a: string; _b: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "admin"
      gender_type: "male" | "female" | "other" | "prefer_not_to_say"
      ride_role: "passenger" | "driver"
      ride_status:
        | "open"
        | "matched"
        | "completed"
        | "cancelled"
        | "in_progress"
      vehicle_type: "any" | "bike" | "car" | "auto" | "cab"
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
      app_role: ["student", "admin"],
      gender_type: ["male", "female", "other", "prefer_not_to_say"],
      ride_role: ["passenger", "driver"],
      ride_status: ["open", "matched", "completed", "cancelled", "in_progress"],
      vehicle_type: ["any", "bike", "car", "auto", "cab"],
    },
  },
} as const
