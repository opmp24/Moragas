export interface AccessKey {
  id: string;
  key_hash: string;
  display_name: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  last_used_at: string | null;
}

export interface Session {
  id: string;
  access_key_id: string;
  token: string;
  created_at: string;
  last_used_at: string;
}

export interface Transaction {
  id: string;
  type: 'ingreso' | 'egreso';
  amount: number;
  description: string;
  category: string;
  user_name: string | null;
  raw_message: string;
  telegram_message_id: number;
  created_at: string;
}

export interface GeminiClassification {
  type: 'ingreso' | 'egreso';
  amount: number;
  category: string;
  user_name: string | null;
  description: string;
}

export interface UserSession {
  keyId: string;
  displayName: string;
  role: 'admin' | 'user';
  token: string;
}

export interface MonthlySummary {
  month: string;
  ingresos: number;
  egresos: number;
}

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
}
