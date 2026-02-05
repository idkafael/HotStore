import { NextRequest, NextResponse } from "next/server";
import { PayevoWebhookPayload } from "@/types/payevo";

export const dynamic = 'force-dynamic';

// Postback/Webhook Payevo
// Documentação: https://payevov2.readme.io
// Este endpoint recebe notificações quando o status do pagamento muda

export async function POST(request: NextRequest) {
  try {
    const payload: PayevoWebhookPayload = await request.json();
    
    console.log('📥 Postback Payevo recebido:', JSON.stringify(payload, null, 2));

    if (!payload.id) {
      console.warn('⚠️ Postback recebido sem ID de transação');
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const transactionId = payload.id;
    const status = payload.status?.toLowerCase() || 'unknown';
    const amount = payload.amount;

    console.log(`📊 Postback - Transação ${transactionId}: Status = ${status}, Valor = ${amount}`);

    // Verificar se o pagamento foi confirmado
    const isPagamentoConfirmado = status === 'paid' || status === 'approved' || status === 'completed' || status === 'confirmed';

    if (isPagamentoConfirmado) {
      console.log('✅✅✅ PAGAMENTO CONFIRMADO VIA POSTBACK!');
      console.log(`💰 Transação: ${transactionId}, Valor: ${amount}`);
    } else if (status === 'canceled' || status === 'cancelled' || status === 'failed') {
      console.log(`❌ Pagamento cancelado/falhou: ${transactionId}`);
    } else {
      console.log(`⏳ Status intermediário: ${status} para transação ${transactionId}`);
    }

    // Sempre retornar 200 para confirmar recebimento
    return NextResponse.json({ 
      success: true,
      message: "Postback recebido com sucesso",
      transactionId: transactionId,
      status: status
    });

  } catch (error: any) {
    console.error('❌ Erro ao processar postback Payevo:', error);
    // Retornar 200 mesmo em caso de erro para evitar retentativas desnecessárias
    return NextResponse.json({ 
      success: false,
      error: 'Erro ao processar postback',
      message: error.message 
    }, { status: 200 });
  }
}
