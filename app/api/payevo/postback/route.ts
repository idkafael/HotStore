import { NextRequest, NextResponse } from "next/server";
import { PayevoWebhookPayload } from "@/types/payevo";

export const dynamic = 'force-dynamic';

// Webhook/Postback Payevo
// Documentação: https://payevov2.readme.io

export async function POST(request: NextRequest) {
  try {
    const payload: PayevoWebhookPayload = await request.json();
    
    console.log('📥 Postback Payevo recebido:', JSON.stringify(payload, null, 2));

    // TODO: Implementar processamento do postback conforme documentação Payevo
    // Aguardando documentação completa

    return NextResponse.json({ 
      success: true,
      message: "Postback recebido"
    });

  } catch (error: any) {
    console.error('❌ Erro ao processar postback Payevo:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erro ao processar postback',
      message: error.message 
    }, { status: 200 });
  }
}
