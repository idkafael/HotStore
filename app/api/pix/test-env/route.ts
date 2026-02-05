import { NextResponse } from "next/server";

export async function GET() {
  // Rota de teste para verificar variáveis de ambiente
  // NÃO EXPOR EM PRODUÇÃO - apenas para debug
  const envCheck = {
    PUSHINPAY_API_URL: process.env.PUSHINPAY_API_URL || "NÃO CONFIGURADO",
    PUSHINPAY_TOKEN: process.env.PUSHINPAY_TOKEN 
      ? `${process.env.PUSHINPAY_TOKEN.substring(0, 20)}...` 
      : "NÃO CONFIGURADO",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "NÃO CONFIGURADO",
    tokenLength: process.env.PUSHINPAY_TOKEN?.length || 0,
  };

  return NextResponse.json({
    message: "Verificação de variáveis de ambiente",
    env: envCheck,
    timestamp: new Date().toISOString(),
  });
}
