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

    // Verificar estrutura do postback conforme documentação
    if (payload.type !== 'transaction' || !payload.data) {
      console.warn('⚠️ Postback com formato inválido:', payload.type);
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const transactionData = payload.data;
    const transactionId = transactionData.id;
    const status = transactionData.status?.toLowerCase() || 'unknown';
    const amount = transactionData.amount;
    const paidAt = transactionData.paidAt;

    console.log(`📊 Postback - Transação ${transactionId}: Status = ${status}, Valor = ${amount}, PaidAt = ${paidAt}`);

    // Verificar se o pagamento foi confirmado
    // Conforme documentação: quando paidAt não for null e/ou status mudar para pago
    const statusLower = status?.toLowerCase() || '';
    const isPagamentoConfirmado = (paidAt !== null && paidAt !== undefined && paidAt !== '') || 
                                   statusLower === 'paid' || 
                                   statusLower === 'approved' || 
                                   statusLower === 'completed' || 
                                   statusLower === 'confirmed' ||
                                   statusLower === 'paid_out';

    if (isPagamentoConfirmado) {
      console.log('✅✅✅ PAGAMENTO CONFIRMADO VIA POSTBACK!');
      console.log(`💰 Transação: ${transactionId}, Valor: ${amount}, PaidAt: ${paidAt}`);
      
      // Aqui você pode:
      // 1. Marcar orderId do metadata como pago
      // 2. Liberar acesso/download do entregável
      // 3. Registrar data.id para evitar dupla liberação (idempotência)
      
      if (transactionData.metadata) {
        try {
          const metadata = JSON.parse(transactionData.metadata);
          console.log('📦 Metadata:', metadata);
        } catch (e) {
          console.log('📦 Metadata (string):', transactionData.metadata);
        }
      }
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
      status: status,
      paidAt: paidAt
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
