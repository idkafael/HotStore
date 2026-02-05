import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Endpoint de teste para verificar configuração Payevo

export async function GET() {
  const PAYEVO_API_URL = process.env.PAYEVO_API_URL || "https://apiv2.payevo.com.br";
  const PAYEVO_SECRET_KEY = process.env.PAYEVO_SECRET_KEY || "";
  const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

  return NextResponse.json({
    config: {
      hasApiUrl: !!PAYEVO_API_URL,
      apiUrl: PAYEVO_API_URL,
      hasSecretKey: !!PAYEVO_SECRET_KEY,
      secretKeyLength: PAYEVO_SECRET_KEY.length,
      secretKeyPreview: PAYEVO_SECRET_KEY ? `${PAYEVO_SECRET_KEY.substring(0, 10)}...` : 'não configurado',
      hasAppUrl: !!NEXT_PUBLIC_APP_URL,
      appUrl: NEXT_PUBLIC_APP_URL,
      postbackUrl: NEXT_PUBLIC_APP_URL ? `${NEXT_PUBLIC_APP_URL}/api/payevo/postback` : 'não configurado'
    },
    auth: {
      basicAuthHeader: PAYEVO_SECRET_KEY ? `Basic ${Buffer.from(PAYEVO_SECRET_KEY).toString('base64')}` : 'não configurado',
      basicAuthPreview: PAYEVO_SECRET_KEY ? `Basic ${Buffer.from(PAYEVO_SECRET_KEY).toString('base64').substring(0, 20)}...` : 'não configurado'
    }
  });
}
