// Tipos para integração Payevo

export interface CreateTransactionRequest {
  amount: number; // Valor em centavos
  description?: string;
  paymentMethod?: string; // "PIX" | "CREDIT_CARD" | etc
  postbackUrl?: string;
  metadata?: string; // JSON string
  installments?: number;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  items?: Array<{
    title: string;
    unitPrice: number;
    quantity: number;
    externalRef?: string;
  }>;
}

export interface CreateTransactionResponse {
  id: string;
  status: string;
  amount: number;
  paymentMethod?: string;
  pix?: {
    qrcode: string;
    expirationDate?: string;
  };
  qr_code?: string; // Compatibilidade com frontend
  qr_code_base64?: string; // Compatibilidade com frontend
  [key: string]: any;
}

export interface TransactionStatusResponse {
  id: string;
  status: string;
  amount: number;
  paymentMethod?: string;
  pix?: {
    qrcode: string;
    expirationDate?: string;
  };
  paidAt?: string | null;
  [key: string]: any;
}

export interface PayevoWebhookPayload {
  type: string; // "transaction"
  data: {
    id: string;
    status: string;
    amount: number;
    paymentMethod?: string;
    paidAt?: string | null;
    pix?: {
      qrcode: string;
      expirationDate?: string;
    };
    metadata?: string;
    [key: string]: any;
  };
}
