// Tipos para integração PushinPay PIX

export interface CreatePixRequest {
  value: number; // Valor em centavos (mínimo 50)
  webhook_url?: string;
  split_rules?: SplitRule[];
}

export interface SplitRule {
  value: number; // Valor em centavos
  account_id: string; // ID da conta PushinPay
}

export interface CreatePixResponse {
  id: string;
  qr_code: string;
  status: "created" | "paid" | "expired" | "canceled";
  value: number;
  webhook_url?: string;
  qr_code_base64: string;
  webhook?: any;
  split_rules: SplitRule[];
  end_to_end_id?: string | null;
  payer_name?: string | null;
  payer_national_registration?: string | null;
}

export interface PixStatusResponse {
  id: string;
  qr_code: string;
  status: "created" | "paid" | "expired" | "canceled";
  value: number;
  webhook_url?: string;
  qr_code_base64: string;
  split_rules: SplitRule[];
  end_to_end_id?: string | null;
  payer_name?: string | null;
  payer_national_registration?: string | null;
}

export interface PixWebhookPayload {
  id: string;
  status: "created" | "paid" | "expired" | "canceled";
  value: number;
  end_to_end_id?: string;
  payer_name?: string;
  payer_national_registration?: string;
}
