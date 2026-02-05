import { NextRequest, NextResponse } from "next/server";
import { PixWebhookPayload } from "@/types/pix";
import { updatePixStatus } from "@/lib/pixStatusStore";

// Webhook para receber notificações da PushinPay
// Baseado no projeto de referência que funciona: privtela2-master
// Este endpoint é chamado automaticamente pela PushinPay quando o status do pagamento muda

export async function POST(request: NextRequest) {
  // Validar token de segurança do webhook (opcional)
  // A PushinPay pode enviar o token no header x-pushinpay-token
  const webhookToken = request.headers.get('x-pushinpay-token');
  const expectedToken = process.env.PUSHINPAY_WEBHOOK_TOKEN;

  if (expectedToken && webhookToken !== expectedToken) {
    console.warn('⚠️ Token de webhook inválido ou ausente');
    console.warn('Token recebido:', webhookToken ? '***' : 'ausente');
    console.warn('Token esperado:', expectedToken ? '***' : 'não configurado');
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  // Se o token não estiver configurado, apenas logar um aviso mas continuar
  if (!expectedToken) {
    console.warn('⚠️ PUSHINPAY_WEBHOOK_TOKEN não configurado - webhook aceito sem validação');
  } else {
    console.log('✅ Token de webhook validado com sucesso');
  }

  try {
    const payload: PixWebhookPayload = await request.json();
    
    console.log('📥 Webhook PushinPay recebido:', JSON.stringify(payload, null, 2));

    // Validar se o payload contém dados da transação
    if (!payload || !payload.id) {
      console.warn('⚠️ Webhook recebido sem ID de transação');
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const transactionId = payload.id;
    const status = payload.status?.toLowerCase() || 'unknown';
    const value = payload.value || payload.amount;

    console.log(`📊 Webhook - Transação ${transactionId}: Status = ${status}, Valor = ${value}`);

    // Atualizar status no armazenamento local
    updatePixStatus(transactionId, status as any);
    console.log(`✅ Status do PIX ${transactionId} atualizado no armazenamento local para: ${status}`);

    // Verificar se o pagamento foi confirmado
    const isPagamentoConfirmado = status === 'paid' || status === 'approved' || status === 'confirmed';

    if (isPagamentoConfirmado) {
      console.log('✅✅✅ PAGAMENTO CONFIRMADO VIA WEBHOOK!');
      console.log(`💰 Transação: ${transactionId}, Valor: ${value}`);
      console.log(`End-to-end ID: ${payload.end_to_end_id}`);
      console.log(`Pagador: ${payload.payer_name} (${payload.payer_national_registration})`);
      
      // O frontend será notificado através do polling que consulta a API
      console.log(`📡 Frontend será notificado no próximo polling (a cada 3 segundos)`);
    } else if (status === 'canceled' || status === 'cancelled') {
      console.log(`❌ Pagamento cancelado: ${transactionId}`);
    } else {
      console.log(`⏳ Status intermediário: ${status} para transação ${transactionId}`);
    }

    // Sempre retornar 200 para a PushinPay
    // Isso confirma que recebemos a notificação
    return NextResponse.json({ 
      success: true,
      message: 'Webhook recebido com sucesso',
      transactionId: transactionId,
      status: status
    });

  } catch (error: any) {
    console.error('❌ Erro ao processar webhook PushinPay:', error);
    
    // Mesmo em caso de erro, retornar 200 para a PushinPay
    // para evitar que ela tente reenviar múltiplas vezes
    return NextResponse.json({ 
      success: false,
      error: 'Erro ao processar webhook',
      message: error.message 
    }, { status: 200 });
  }
}

// Permitir GET para verificação (opcional)
export async function GET() {
  return NextResponse.json({ message: "Webhook endpoint ativo" });
}
