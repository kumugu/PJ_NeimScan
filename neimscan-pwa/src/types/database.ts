export interface Database {
  public: {
    Tables: {
      contributions: {
        Row: {
          id: string;
          name: string;
          amount: number;
          memo: string | null;
          date: string;
          created_at: string;
          updated_at: string;
          image_data: string | null;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          amount: number;
          memo?: string | null;
          date: string;
          created_at?: string;
          updated_at?: string;
          image_data?: string | null;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          amount?: number;
          memo?: string | null;
          date?: string;
          created_at?: string;
          updated_at?: string;
          image_data?: string | null;
          user_id?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}