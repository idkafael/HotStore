import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/syncpay";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create-pix') {
      const { valor, plano } = body;

      // Validar valor - SyncPay espera valor em reais (double)
      const valorEmReais = parseFloat(valor) || 1.00;

      if (!valorEmReais || valorEmReais < 0.01) {
        return NextResponse.json({
          error: 'Valor inválido. O valor mínimo é R$ 0,01',
          message: 'Valor inválido. O valor mínimo é R$ 0,01'
        }, { status: 400 });
      }

      console.log('📤 Criando PIX via SyncPay:', { valorReais: valorEmReais, plano });

      // Obter token de autenticação
      const token = await getAuthToken();

      // Configurar URL do webhook
      const webhookUrl = process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/syncpay/webhook`
        : undefined;

      // Preparar payload conforme documentação SyncPay
      const payload = {
        amount: valorEmReais, // Valor em reais (double)
        description: plano || `Pagamento - ${valorEmReais.toFixed(2)}`,
        ...(webhookUrl && { webhook_url: webhookUrl })
      };

      console.log('📤 Payload enviado para SyncPay:', JSON.stringify(payload, null, 2));

      // Usar a mesma base URL do token
      const baseUrl = process.env.SYNCPAY_BASE_URL || 'https://api.syncpayments.com.br';
      const cashInUrl = baseUrl.endsWith('/') 
        ? `${baseUrl}api/partner/v1/cash-in`
        : `${baseUrl}/api/partner/v1/cash-in`;
      
      console.log('📤 URL do cash-in:', cashInUrl);

      const response = await fetch(cashInUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 Status da resposta HTTP:', response.status, response.statusText);

      let pixData;
      try {
        const contentType = response.headers.get('content-type') || '';
        
        if (!contentType.includes('application/json')) {
          const text = await response.text();
          console.error('❌ Resposta não é JSON. Content-Type:', contentType);
          return NextResponse.json({
            error: 'Resposta da API não é JSON',
            message: 'A API SyncPay retornou uma resposta que não é JSON',
            contentType: contentType,
            responsePreview: text.substring(0, 500)
          }, { status: 500 });
        }
        
        pixData = await response.json();
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta JSON:', parseError);
        const text = await response.text().catch(() => 'Não foi possível ler a resposta');
        return NextResponse.json({
          error: 'Erro ao processar resposta da API SyncPay',
          message: 'A API retornou uma resposta inválida',
          details: text.substring(0, 500)
        }, { status: 500 });
      }

      console.log('📥 Resposta completa da API SyncPay:', JSON.stringify(pixData, null, 2));

      if (!response.ok) {
        console.error('❌ Erro SyncPay API:', {
          status: response.status,
          statusText: response.statusText,
          data: pixData
        });

        return NextResponse.json({
          error: pixData.message || pixData.error || 'Erro ao criar PIX',
          message: pixData.message || pixData.error || 'Erro ao criar PIX',
          details: pixData
        }, { status: response.status });
      }

      // Adaptar resposta para formato compatível com frontend
      const adaptedResponse = {
        success: true,
        hash: pixData.identifier,
        identifier: pixData.identifier,
        status: 'created',
        pix_code: pixData.pix_code,
        qr_code: null, // SyncPay não retorna QR code base64, vamos gerar do pix_code
        amount: valorEmReais * 100, // Converter para centavos para compatibilidade
        payment_method: 'pix',
        created_at: new Date().toISOString(),
        data: pixData
      };

      console.log('✅ Transação criada com sucesso via SyncPay:', adaptedResponse);
      
      return NextResponse.json(adaptedResponse);
    }

    if (action === 'check-payment') {
      const { transactionId } = body;

      if (!transactionId) {
        return NextResponse.json({ error: 'transactionId é obrigatório' }, { status: 400 });
      }

      try {
        // Obter token de autenticação
        const token = await getAuthToken();

        // Usar a mesma base URL do token
        const baseUrl = process.env.SYNCPAY_BASE_URL || 'https://api.syncpayments.com.br';
        const url = baseUrl.endsWith('/') 
          ? `${baseUrl}api/partner/v1/transaction/${transactionId}`
          : `${baseUrl}/api/partner/v1/transaction/${transactionId}`;

        console.log(`🔍 Consultando status do PIX no SyncPay: ${url}`);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        console.log('📥 Status da resposta HTTP:', response.status, response.statusText);

        if (response.status === 404) {
          console.log('⚠️ Transação não encontrada no SyncPay (404)');
          return NextResponse.json({
            error: 'Transação não encontrada',
            message: 'Transação não encontrada'
          }, { status: 404 });
        }

        let statusData;
        try {
          const contentType = response.headers.get('content-type') || '';
          
          if (!contentType.includes('application/json')) {
            const text = await response.text();
            console.error('❌ Resposta não é JSON. Content-Type:', contentType);
            return NextResponse.json({
              error: 'Resposta da API não é JSON',
              message: 'A API SyncPay retornou uma resposta que não é JSON',
              contentType: contentType
            }, { status: 500 });
          }
          
          statusData = await response.json();
        } catch (parseError) {
          console.error('❌ Erro ao parsear resposta JSON:', parseError);
          return NextResponse.json({
            error: 'Erro ao processar resposta da API SyncPay',
            message: 'A API retornou uma resposta inválida'
          }, { status: 500 });
        }
        
        console.log('📥 Resposta completa da consulta SyncPay:', JSON.stringify(statusData, null, 2));

        if (!response.ok) {
          console.error(`❌ Erro ao consultar transação no SyncPay: ${response.status}`, statusData);
          return NextResponse.json({
            error: statusData.message || statusData.error || 'Erro ao verificar pagamento',
            details: statusData
          }, { status: response.status });
        }

        // Adaptar resposta para formato compatível com frontend
        const transactionData = statusData.data || statusData;
        const status = transactionData.status?.toLowerCase() || 'pending';
        
        // Mapear status do SyncPay para formato esperado
        let mappedStatus = status;
        if (status === 'completed') {
          mappedStatus = 'paid';
        } else if (status === 'pending' || status === 'processing') {
          mappedStatus = 'pending';
        } else if (status === 'cancelled' || status === 'canceled') {
          mappedStatus = 'canceled';
        }

        const adaptedResponse = {
          success: true,
          hash: transactionData.reference_id || transactionId,
          identifier: transactionData.reference_id || transactionId,
          status: mappedStatus,
          amount: transactionData.amount ? Math.round(transactionData.amount * 100) : null,
          payment_method: 'pix',
          paid_at: transactionData.transaction_date,
          created_at: transactionData.transaction_date,
          data: transactionData
        };
        
        return NextResponse.json(adaptedResponse);
      } catch (error: any) {
        console.error('❌ Erro ao consultar transação no SyncPay:', error);
        
        return NextResponse.json({
          error: 'Erro ao verificar pagamento',
          message: error.message || 'Erro ao verificar pagamento',
          details: error.response?.data || error
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      error: 'Ação inválida',
      message: 'Ação inválida'
    }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Erro na API SyncPay:', error);
    return NextResponse.json({
      error: error.message || 'Erro interno do servidor',
      message: error.message || 'Erro interno do servidor',
      type: error.name || 'Error'
    }, { status: 500 });
  }
}
