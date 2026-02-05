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

      if (response.status === 404) {
        console.log('⚠️ Transação não encontrada na PushinPay (404) - retornando array vazio conforme documentação');
        // Conforme documentação: 404 retorna array vazio []
        return NextResponse.json([], { status: 404 });
      }

      let statusData;
      try {
        const contentType = response.headers.get('content-type') || '';
        
        if (!contentType.includes('application/json')) {
          const text = await response.text();
          console.error('❌ Resposta não é JSON. Content-Type:', contentType);
          console.error('Resposta recebida:', text.substring(0, 500));
          return NextResponse.json({
            error: 'Resposta da API não é JSON',
            message: 'A API PushinPay retornou uma resposta que não é JSON',
            contentType: contentType,
            responsePreview: text.substring(0, 500)
          }, { status: 500 });
        }
        
        statusData = await response.json();
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta JSON:', parseError);
        const text = await response.text().catch(() => 'Não foi possível ler a resposta');
        console.error('Resposta recebida (texto):', text.substring(0, 500));
        return NextResponse.json({
          error: 'Erro ao processar resposta da API PushinPay',
          message: 'A API retornou uma resposta inválida',
          details: text.substring(0, 500)
        }, { status: 500 });
      }
      
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
