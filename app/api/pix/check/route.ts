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
      // Tentar diferentes endpoints possíveis
      // 1. /transactions/{id} - conforme projeto de referência
      // 2. /api/pix/{id} - conforme documentação oficial
      const apiBaseUrl = 'https://api.pushinpay.com.br/api';
      const endpoints = [
        `/transactions/${transactionId}`, // Projeto de referência
        `/pix/${transactionId}`, // Documentação oficial
      ];

      let lastError: any = null;
      let statusData: any = null;
      let successfulEndpoint = '';

      for (const endpoint of endpoints) {
        const url = `${apiBaseUrl}${endpoint}`;
        console.log(`🔍 Tentando consultar status do PIX na PushinPay: ${url}`);

        try {
          // Fazer requisição direta à API
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${PUSHINPAY_TOKEN}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });

          console.log(`📥 Status da resposta HTTP (${endpoint}):`, response.status, response.statusText);

          if (response.status === 404) {
            console.log(`⚠️ Transação não encontrada na PushinPay (404) no endpoint ${endpoint}`);
            // Tentar próximo endpoint
            continue;
          }

          if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            console.error(`❌ Erro ${response.status} no endpoint ${endpoint}:`, errorText.substring(0, 200));
            lastError = { endpoint, status: response.status, error: errorText.substring(0, 200) };
            continue;
          }

          // Tentar parsear JSON
          try {
            const contentType = response.headers.get('content-type') || '';
            
            if (!contentType.includes('application/json')) {
              const text = await response.text();
              console.error(`❌ Resposta não é JSON no endpoint ${endpoint}. Content-Type:`, contentType);
              lastError = { endpoint, error: 'Resposta não é JSON', contentType };
              continue;
            }
            
            statusData = await response.json();
            successfulEndpoint = endpoint;
            console.log(`✅ Sucesso no endpoint ${endpoint}!`);
            break; // Sair do loop se conseguir
          } catch (parseError) {
            console.error(`❌ Erro ao parsear resposta JSON do endpoint ${endpoint}:`, parseError);
            lastError = { endpoint, error: 'Erro ao parsear JSON' };
            continue;
          }
        } catch (fetchError: any) {
          console.error(`❌ Erro ao conectar com endpoint ${endpoint}:`, fetchError.message);
          lastError = { endpoint, error: fetchError.message };
          continue;
        }
      }

      // Se nenhum endpoint funcionou, retornar erro
      if (!statusData) {
        console.error('❌ Todos os endpoints falharam ao consultar status');
        if (lastError) {
          return NextResponse.json({
            error: 'Erro ao verificar pagamento',
            message: 'Não foi possível consultar o status na PushinPay',
            details: lastError
          }, { status: 500 });
        }
        return NextResponse.json([], { status: 404 });
      }

      console.log(`📥 Resposta completa da consulta PushinPay (${successfulEndpoint}):`, JSON.stringify(statusData, null, 2));
      console.log(`📊 Status retornado: ${statusData.status}`);

      // Atualizar armazenamento local com status da API
      updatePixStatus(statusData.id, statusData.status);

      const adaptedResponse: PixStatusResponse = {
        id: statusData.id || transactionId,
        status: statusData.status || 'pending', // created | paid | canceled
        qr_code: statusData.qr_code || '',
        value: statusData.value || statusData.amount || 0,
        qr_code_base64: statusData.qr_code_base64 || '',
        split_rules: statusData.split_rules || [],
        end_to_end_id: statusData.end_to_end_id || null,
        payer_name: statusData.payer_name || null,
        payer_national_registration: statusData.payer_national_registration || null,
      };
      
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
