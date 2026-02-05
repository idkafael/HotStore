// Tipos para SyncPay

export interface CreatePixRequest {
  action: 'create-pix';
  valor: number;
  plano?: string;
}

export interface CheckPaymentRequest {
  action: 'check-payment';
  transactionId: string;
}

export interface SyncPayPixResponse {
  success: boolean;
  hash: string;
  identifier: string;
  status: string;
  pix_code: string;
  qr_code: string | null;
  amount: number;
  payment_method: string;
  created_at: string;
  data: any;
}

export interface SyncPayStatusResponse {
  success: boolean;
  hash: string;
  identifier: string;
  status: string;
  amount: number | null;
  payment_method: string;
  paid_at: string | null;
  created_at: string;
  data: any;
}

export interface SyncPayWebhookPayload {
  identifier?: string;
  reference_id?: string;
  id?: string;
  status?: string;
  amount?: number;
  value?: number;
  description?: string;
  data?: {
    identifier?: string;
    reference_id?: string;
    status?: string;
    amount?: number;
    description?: string;
  };
}
