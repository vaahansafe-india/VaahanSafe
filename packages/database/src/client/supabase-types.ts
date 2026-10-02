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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json
          id: string
          resource_id: string | null
          resource_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          id?: string
          resource_id?: string | null
          resource_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          id?: string
          resource_id?: string | null
          resource_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_identities: {
        Row: {
          created_at: string
          id: string
          provider: string
          provider_user_id: string
          user_id: string
          verified_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          provider: string
          provider_user_id: string
          user_id: string
          verified_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          provider?: string
          provider_user_id?: string
          user_id?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_identities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          created_at: string
          id: string
          is_verified: boolean
          name: string
          phone: string
          priority: number
          relationship: string
          updated_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_verified?: boolean
          name: string
          phone: string
          priority?: number
          relationship: string
          updated_at?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_verified?: boolean
          name?: string
          phone?: string
          priority?: number
          relationship?: string
          updated_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_contacts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string | null
          bucket: Database["public"]["Enums"]["storage_bucket_type"]
          created_at: string
          deleted_at: string | null
          height: number | null
          id: string
          metadata: Json
          mime_type: string
          object_key: string
          original_filename: string | null
          owner_id: string
          owner_type: Database["public"]["Enums"]["media_owner_type"]
          public_url: string | null
          quarantined_at: string | null
          ready_at: string | null
          sha256: string | null
          size_bytes: number
          status: Database["public"]["Enums"]["media_status"]
          storage_etag: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["media_visibility"]
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          bucket?: Database["public"]["Enums"]["storage_bucket_type"]
          created_at?: string
          deleted_at?: string | null
          height?: number | null
          id?: string
          metadata?: Json
          mime_type: string
          object_key: string
          original_filename?: string | null
          owner_id: string
          owner_type: Database["public"]["Enums"]["media_owner_type"]
          public_url?: string | null
          quarantined_at?: string | null
          ready_at?: string | null
          sha256?: string | null
          size_bytes: number
          status?: Database["public"]["Enums"]["media_status"]
          storage_etag?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["media_visibility"]
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          bucket?: Database["public"]["Enums"]["storage_bucket_type"]
          created_at?: string
          deleted_at?: string | null
          height?: number | null
          id?: string
          metadata?: Json
          mime_type?: string
          object_key?: string
          original_filename?: string | null
          owner_id?: string
          owner_type?: Database["public"]["Enums"]["media_owner_type"]
          public_url?: string | null
          quarantined_at?: string | null
          ready_at?: string | null
          sha256?: string | null
          size_bytes?: number
          status?: Database["public"]["Enums"]["media_status"]
          storage_etag?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["media_visibility"]
          width?: number | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          id: string
          metadata: Json
          order_number: string
          payment_state: Database["public"]["Enums"]["payment_state"]
          shipping_address_line1: string | null
          shipping_address_line2: string | null
          shipping_city: string | null
          shipping_name: string | null
          shipping_phone: string | null
          shipping_postal_code: string | null
          shipping_state: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          order_number: string
          payment_state?: Database["public"]["Enums"]["payment_state"]
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_city?: string | null
          shipping_name?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          status?: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          order_number?: string
          payment_state?: Database["public"]["Enums"]["payment_state"]
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_city?: string | null
          shipping_name?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          event_type: string
          id: string
          order_id: string | null
          payload: Json
          payment_id: string | null
          processed_at: string
          provider: string
          provider_event_id: string
        }
        Insert: {
          event_type: string
          id?: string
          order_id?: string | null
          payload: Json
          payment_id?: string | null
          processed_at?: string
          provider: string
          provider_event_id: string
        }
        Update: {
          event_type?: string
          id?: string
          order_id?: string | null
          payload?: Json
          payment_id?: string | null
          processed_at?: string
          provider?: string
          provider_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          order_id: string
          provider: string
          provider_order_id: string | null
          provider_payment_id: string | null
          raw_payload: Json | null
          status: Database["public"]["Enums"]["payment_state"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          order_id: string
          provider: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          raw_payload?: Json | null
          status?: Database["public"]["Enums"]["payment_state"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          raw_payload?: Json | null
          status?: Database["public"]["Enums"]["payment_state"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_entitlements: {
        Row: {
          capability: string
          id: string
          is_enabled: boolean
          quota: number | null
          quota_used: number
          subscription_id: string
          updated_at: string
        }
        Insert: {
          capability: string
          id?: string
          is_enabled?: boolean
          quota?: number | null
          quota_used?: number
          subscription_id: string
          updated_at?: string
        }
        Update: {
          capability?: string
          id?: string
          is_enabled?: boolean
          quota?: number | null
          quota_used?: number
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_entitlements_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_service_entitlements: {
        Row: {
          acquisition_source: string
          capability: string
          created_at: string
          enabled_at: string
          id: string
          payment_id: string | null
          qr_sticker_id: string
          revoked_at: string | null
          user_id: string
          vehicle_id: string
        }
        Insert: {
          acquisition_source: string
          capability: string
          created_at?: string
          enabled_at?: string
          id?: string
          payment_id?: string | null
          qr_sticker_id: string
          revoked_at?: string | null
          user_id: string
          vehicle_id: string
        }
        Update: {
          acquisition_source?: string
          capability?: string
          created_at?: string
          enabled_at?: string
          id?: string
          payment_id?: string | null
          qr_sticker_id?: string
          revoked_at?: string | null
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_service_entitlements_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_service_entitlements_qr_sticker_id_fkey"
            columns: ["qr_sticker_id"]
            isOneToOne: false
            referencedRelation: "qr_stickers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_service_entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_service_entitlements_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_stickers: {
        Row: {
          activated_at: string | null
          activation_attempts: number
          activation_secret_hash: string | null
          assigned_at: string | null
          created_at: string
          id: string
          internal_batch_id: string | null
          lifecycle_state: Database["public"]["Enums"]["qr_lifecycle_state"]
          public_code: string
          qr_type: string
          updated_at: string
          user_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          activated_at?: string | null
          activation_attempts?: number
          activation_secret_hash?: string | null
          assigned_at?: string | null
          created_at?: string
          id?: string
          internal_batch_id?: string | null
          lifecycle_state?: Database["public"]["Enums"]["qr_lifecycle_state"]
          public_code: string
          qr_type?: string
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          activated_at?: string | null
          activation_attempts?: number
          activation_secret_hash?: string | null
          assigned_at?: string | null
          created_at?: string
          id?: string
          internal_batch_id?: string | null
          lifecycle_state?: Database["public"]["Enums"]["qr_lifecycle_state"]
          public_code?: string
          qr_type?: string
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_stickers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_stickers_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_events: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["scan_event_type"]
          id: string
          metadata: Json
          qr_sticker_id: string
          scanner_city: string | null
          scanner_ip_hash: string
          scanner_state: string | null
          scanner_user_agent: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["scan_event_type"]
          id?: string
          metadata?: Json
          qr_sticker_id: string
          scanner_city?: string | null
          scanner_ip_hash: string
          scanner_state?: string | null
          scanner_user_agent?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["scan_event_type"]
          id?: string
          metadata?: Json
          qr_sticker_id?: string
          scanner_city?: string | null
          scanner_ip_hash?: string
          scanner_state?: string | null
          scanner_user_agent?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_events_qr_sticker_id_fkey"
            columns: ["qr_sticker_id"]
            isOneToOne: false
            referencedRelation: "qr_stickers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_events_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          token_hash: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: string | null
          token_hash: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          token_hash?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      status_heartbeats: {
        Row: {
          checked_at: string
          id: string
          latency_ms: number
          message: string | null
          service_name: string
          status: string
        }
        Insert: {
          checked_at?: string
          id?: string
          latency_ms?: number
          message?: string | null
          service_name?: string
          status?: string
        }
        Update: {
          checked_at?: string
          id?: string
          latency_ms?: number
          message?: string | null
          service_name?: string
          status?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_interval: string
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          metadata: Json
          source_payment_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          billing_interval?: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end: string
          current_period_start?: string
          id?: string
          metadata?: Json
          source_payment_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          billing_interval?: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          metadata?: Json
          source_payment_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_source_payment_id_fkey"
            columns: ["source_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          email_verified_at: string | null
          full_name: string
          id: string
          metadata: Json
          phone: string | null
          phone_verified_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          email_verified_at?: string | null
          full_name: string
          id?: string
          metadata?: Json
          phone?: string | null
          phone_verified_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          email_verified_at?: string | null
          full_name?: string
          id?: string
          metadata?: Json
          phone?: string | null
          phone_verified_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          color: string | null
          created_at: string
          fuel_type: string | null
          id: string
          is_active: boolean
          make: string
          manufacturing_year: number | null
          metadata: Json
          model: string
          registration_number: string
          updated_at: string
          user_id: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Insert: {
          color?: string | null
          created_at?: string
          fuel_type?: string | null
          id?: string
          is_active?: boolean
          make: string
          manufacturing_year?: number | null
          metadata?: Json
          model: string
          registration_number: string
          updated_at?: string
          user_id: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Update: {
          color?: string | null
          created_at?: string
          fuel_type?: string | null
          id?: string
          is_active?: boolean
          make?: string
          manufacturing_year?: number | null
          metadata?: Json
          model?: string
          registration_number?: string
          updated_at?: string
          user_id?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_safety_view: {
        Row: {
          color: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_priority: number | null
          emergency_contact_relationship: string | null
          make: string | null
          model: string | null
          public_code: string | null
          registration_number: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_use_qr_service: {
        Args: {
          p_capability: string
          p_qr_sticker_id: string
          p_vehicle_id: string
        }
        Returns: boolean
      }
      claim_retail_qr: {
        Args: {
          p_public_code: string
          p_secret_hash: string
          p_user_id: string
          p_vehicle_id: string
        }
        Returns: Json
      }
      ping_heartbeat: {
        Args: {
          p_latency_ms?: number
          p_message?: string
          p_service_name?: string
        }
        Returns: Json
      }
      record_qr_scan: {
        Args: {
          p_city?: string
          p_event_type: Database["public"]["Enums"]["scan_event_type"]
          p_metadata?: Json
          p_public_code: string
          p_scanner_ip_hash: string
          p_state?: string
          p_user_agent: string
        }
        Returns: Json
      }
      resolve_public_qr: { Args: { p_public_code: string }; Returns: Json }
    }
    Enums: {
      media_owner_type:
        | "USER"
        | "VEHICLE"
        | "SUPPORT_TICKET"
        | "BLOG_POST"
        | "GALLERY_ITEM"
        | "DOCUMENT"
        | "ORDER"
        | "QR_BATCH"
        | "REPORT"
        | "SYSTEM"
      media_status: "UPLOADING" | "READY" | "QUARANTINED" | "DELETED"
      media_visibility: "PUBLIC" | "PRIVATE" | "INTERNAL"
      payment_state:
        | "PENDING"
        | "PROCESSING"
        | "PAID"
        | "FAILED"
        | "CANCELLED"
        | "EXPIRED"
        | "REFUNDED"
      qr_lifecycle_state:
        | "INVENTORY"
        | "ALLOCATED"
        | "PRINTED"
        | "DISTRIBUTED"
        | "ASSIGNED"
        | "ACTIVATED"
        | "REPLACED"
        | "DAMAGED"
        | "LOST"
        | "BLOCKED"
        | "RETIRED"
      scan_event_type:
        | "EMERGENCY_SCAN"
        | "PARKING_ALERT"
        | "CONTACT_CALL"
        | "ROUTINE_INSPECTION"
        | "SECURITY_CHECK"
      storage_bucket_type: "PUBLIC" | "PRIVATE" | "EXPORT"
      subscription_tier:
        | "TIER_FREE"
        | "TIER_STANDARD"
        | "TIER_PREMIUM"
        | "EXPIRED"
        | "GRACE_PERIOD"
      user_role: "CUSTOMER" | "FLEET_MANAGER" | "RETAILER" | "SUPPORT" | "ADMIN"
      user_status:
        | "PENDING_VERIFICATION"
        | "ACTIVE"
        | "SUSPENDED"
        | "DEACTIVATED"
      vehicle_type:
        | "TWO_WHEELER"
        | "FOUR_WHEELER"
        | "COMMERCIAL"
        | "EMERGENCY_FLEET"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      media_owner_type: [
        "USER",
        "VEHICLE",
        "SUPPORT_TICKET",
        "BLOG_POST",
        "GALLERY_ITEM",
        "DOCUMENT",
        "ORDER",
        "QR_BATCH",
        "REPORT",
        "SYSTEM",
      ],
      media_status: ["UPLOADING", "READY", "QUARANTINED", "DELETED"],
      media_visibility: ["PUBLIC", "PRIVATE", "INTERNAL"],
      payment_state: [
        "PENDING",
        "PROCESSING",
        "PAID",
        "FAILED",
        "CANCELLED",
        "EXPIRED",
        "REFUNDED",
      ],
      qr_lifecycle_state: [
        "INVENTORY",
        "ALLOCATED",
        "PRINTED",
        "DISTRIBUTED",
        "ASSIGNED",
        "ACTIVATED",
        "REPLACED",
        "DAMAGED",
        "LOST",
        "BLOCKED",
        "RETIRED",
      ],
      scan_event_type: [
        "EMERGENCY_SCAN",
        "PARKING_ALERT",
        "CONTACT_CALL",
        "ROUTINE_INSPECTION",
        "SECURITY_CHECK",
      ],
      storage_bucket_type: ["PUBLIC", "PRIVATE", "EXPORT"],
      subscription_tier: [
        "TIER_FREE",
        "TIER_STANDARD",
        "TIER_PREMIUM",
        "EXPIRED",
        "GRACE_PERIOD",
      ],
      user_role: ["CUSTOMER", "FLEET_MANAGER", "RETAILER", "SUPPORT", "ADMIN"],
      user_status: [
        "PENDING_VERIFICATION",
        "ACTIVE",
        "SUSPENDED",
        "DEACTIVATED",
      ],
      vehicle_type: [
        "TWO_WHEELER",
        "FOUR_WHEELER",
        "COMMERCIAL",
        "EMERGENCY_FLEET",
      ],
    },
  },
} as const
