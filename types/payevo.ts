// Tipos para integração Payevo

export interface CreateTransactionRequest {
  amount: number; // Valor em centavos
  description?: string;
  payment_method?: string; // "pix" | "credit_card" | etc
  postback_url?: string;
  customer?: {
    name?: string;
    email?: string;
    document?: string;
  };
}

export interface CreateTransactionResponse {
  id: string;
  status: string;
  amount: number;
  qr_code?: string;
  qr_code_base64?: string;
  payment_link?: string;
  [key: string]: any;
}

export interface TransactionStatusResponse {
  id: string;
  status: string;
  amount: number;
  [key: string]: any;
}

export interface PayevoWebhookPayload {
  id: string;
  status: string;
  amount: number;
  [key: string]: any;
}
