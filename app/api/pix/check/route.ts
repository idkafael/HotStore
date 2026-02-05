import { NextRequest, NextResponse } from "next/server";
import { PixStatusResponse } from "@/types/pix";
import { updatePixStatus } from "@/lib/pixStatusStore";

// Forçar renderização dinâmica (não estática)
export const dynamic = 'force-dynamic';

// API Route para verificar status de pagamento PushinPay
// Baseado no projeto de referência que funciona: privtela2-master
// Endpoint: GET /api/pix/check?transactionId={id}

const PUSHINPAY_API_BASE = process.env.PUSHINPAY_API_URL || "https://api.pushinpay.com.br";
const PUSHINPAY_TOKEN = process.env.PUSHINPAY_TOKEN || "";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get("transactionId") || searchParams.get("id");

    if (!transactionId) {
      return NextResponse.json(
        { error: "transactionId é obrigatório" },
        { status: 400 }
      );
    }

    if (!PUSHINPAY_TOKEN) {
      return NextResponse.json(
        { 
          error: "PUSHINPAY_TOKEN não configurado",
          message: "Configure PUSHINPAY_TOKEN nas variáveis de ambiente"
        },
        { status: 500 }
      );
    }

    try {
      // Endpoint correto conforme documentação oficial: https://app.theneo.io/pushinpay/pix/pix/consultar-pix
      // GET /api/pix/{id}
      const apiBaseUrl = 'https://api.pushinpay.com.br/api';
      const endpoint = `/pix/${transactionId}`; // Conforme documentação oficial
      const url = `${apiBaseUrl}${endpoint}`;
      
      console.log(`🔍 Consultando status do PIX na PushinPay (documentação oficial): ${url}`);

      // Validar token antes de fazer requisição
      if (!PUSHINPAY_TOKEN || PUSHINPAY_TOKEN.length < 10) {
        console.error('❌ Token PushinPay inválido ou muito curto');
        return NextResponse.json({
          error: 'Token PushinPay inválido',
          message: 'O token configurado parece estar incorreto',
          tokenLength: PUSHINPAY_TOKEN?.length || 0
        }, { status: 500 });
      }
      
      console.log(`🔑 Token presente: Sim (${PUSHINPAY_TOKEN.substring(0, 20)}...)`);
      console.log(`🔗 URL completa: ${url}`);
      
      // Fazer requisição direta à API conforme documentação oficial
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PUSHINPAY_TOKEN}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Status da resposta HTTP:', response.status, response.statusText);
      
      // Ler resposta para debug
      const responseText = await response.text().catch(() => '');
      console.log('📄 Resposta da PushinPay (primeiros 500 chars):', responseText.substring(0, 500));

      if (response.status === 404) {
        console.log('⚠️ Transação não encontrada na PushinPay (404)');
        console.log('🔍 Possíveis causas:');
        console.log('  1. Token inválido ou expirado');
        console.log('  2. TransactionId incorreto:', transactionId);
        console.log('  3. Transação ainda não foi criada na PushinPay');
        console.log('  4. Endpoint incorreto (verificar documentação)');
        
        // Retornar erro mais descritivo em vez de array vazio
        return NextResponse.json({
          error: 'Transação não encontrada',
          message: 'A transação não foi encontrada na PushinPay. Verifique se o token está correto e se a transação foi criada.',
          transactionId: transactionId,
          endpoint: url,
          response: responseText.substring(0, 200)
        }, { status: 404 });
      }
      
      // Tentar parsear JSON novamente já que já lemos o texto
      let statusData;
      try {
        statusData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta JSON:', parseError);
        return NextResponse.json({
          error: 'Erro ao processar resposta da API PushinPay',
          message: 'A API retornou uma resposta inválida',
          details: responseText.substring(0, 500)
        }, { status: 500 });
      }

      // statusData já foi parseado acima
      
      console.log('📥 Resposta completa da consulta PushinPay:', JSON.stringify(statusData, null, 2));
      console.log(`📊 Status retornado pela API: ${statusData.status}`);

      if (!response.ok) {
        console.error(`Erro ao consultar transação na PushinPay: ${response.status}`, statusData);
        return NextResponse.json({
          error: statusData.message || statusData.error || 'Erro ao verificar pagamento',
          details: statusData
        }, { status: response.status });
      }

      // Conforme documentação: o retorno é igual ao de criar PIX
      // { id, status, value, qr_code, qr_code_base64, ... }
      const status = statusData.status || 'pending';
      
      console.log(`✅ Status extraído: ${status} para PIX ${statusData.id || transactionId}`);
      
      // Atualizar armazenamento local com status da API
      updatePixStatus(statusData.id || transactionId, status as any);

      // Retornar no formato esperado pelo frontend
      // Conforme documentação oficial, o retorno é igual ao de criar PIX
      const adaptedResponse: PixStatusResponse = {
        id: statusData.id || transactionId,
        status: status as any, // created | paid | canceled
        qr_code: statusData.qr_code || statusData.pix_details?.emv || '',
        value: typeof statusData.value === 'string' ? parseInt(statusData.value) : (statusData.value || 0),
        qr_code_base64: statusData.qr_code_base64 || '',
        split_rules: statusData.split_rules || [],
        end_to_end_id: statusData.end_to_end_id || null,
        payer_name: statusData.payer_name || null,
        payer_national_registration: statusData.payer_national_registration || null,
      };
      
      console.log(`📤 Retornando resposta adaptada com status: ${adaptedResponse.status}`);
      
      return NextResponse.json(adaptedResponse);
    } catch (error: any) {
      console.error('Erro ao consultar transação na PushinPay:', error);
      
      return NextResponse.json({
        error: 'Erro ao verificar pagamento',
        message: error.message || 'Erro ao verificar pagamento',
        details: error.response?.data || error
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Erro na API PushinPay:', error);
    return NextResponse.json({
      error: error.message || 'Erro interno do servidor',
      message: error.message || 'Erro interno do servidor',
      type: error.name || 'Error'
    }, { status: 500 });
  }
}
