import { NextRequest, NextResponse } from "next/server";
import { CreatePixRequest, CreatePixResponse } from "@/types/pix";
import { updatePixStatus } from "@/lib/pixStatusStore";

// Forçar renderização dinâmica (não estática)
export const dynamic = 'force-dynamic';

// API Route para PushinPay - Protegida no servidor
// Baseado no projeto de referência que funciona: privtela2-master
// Documentação: https://app.theneo.io/pushinpay/pix

const PUSHINPAY_API_BASE = process.env.PUSHINPAY_API_URL || "https://api.pushinpay.com.br";
const PUSHINPAY_TOKEN = process.env.PUSHINPAY_TOKEN || "";

export async function POST(request: NextRequest) {
  try {
    const body: CreatePixRequest = await request.json();

    // Validações
    if (!body.value || body.value < 50) {
      return NextResponse.json(
        { error: "O valor mínimo é de 50 centavos" },
        { status: 400 }
      );
    }

    if (!PUSHINPAY_TOKEN) {
      return NextResponse.json(
        { error: "Token PushinPay não configurado" },
        { status: 500 }
      );
    }

    // Aplicar split nativo se configurado
    const splitAccountId = process.env.PUSHINPAY_SPLIT_ACCOUNT_ID;
    if (splitAccountId && (!body.split_rules || body.split_rules.length === 0)) {
      const splitPercentage = parseFloat(process.env.PUSHINPAY_SPLIT_PERCENTAGE || "10");
      const splitValue = Math.floor(body.value * (splitPercentage / 100));
      const maxSplit = Math.floor(body.value * 0.5);
      
      if (splitValue > 0 && splitValue <= maxSplit) {
        body.split_rules = [{
          value: splitValue,
          account_id: splitAccountId,
        }];
      }
    }

    // Validar split rules se existirem
    if (body.split_rules && body.split_rules.length > 0) {
      const totalSplit = body.split_rules.reduce((sum, rule) => sum + rule.value, 0);
      const maxSplit = Math.floor(body.value * 0.5);

      if (totalSplit > maxSplit) {
        return NextResponse.json(
          { error: `O valor total dos splits (${totalSplit} centavos) não pode exceder 50% do valor da transação (${maxSplit} centavos)` },
          { status: 400 }
        );
      }

      if (totalSplit > body.value) {
        return NextResponse.json(
          { error: "O valor total dos splits não pode exceder o valor da transação" },
          { status: 400 }
        );
      }
    }

    // Configurar URL do webhook conforme projeto de referência
    const webhookUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/pix/webhook`
      : undefined;

    console.log('Criando PIX:', { 
      valorCentavos: body.value,
      webhookUrl: webhookUrl || 'não configurado'
    });

    // Preparar payload conforme projeto de referência
    const payload: any = {
      value: body.value, // Valor em centavos (INT, mínimo 50)
    };

    if (webhookUrl) {
      payload.webhook_url = webhookUrl;
    }

    if (body.split_rules && body.split_rules.length > 0) {
      payload.split_rules = body.split_rules;
    }

    try {
      // Base URL da API PushinPay conforme projeto de referência
      const apiBaseUrl = 'https://api.pushinpay.com.br/api';
      const endpoint = '/pix/cashIn';
      const url = `${apiBaseUrl}${endpoint}`;

      console.log('📤 Payload enviado para PushinPay:', JSON.stringify(payload, null, 2));
      console.log('📤 URL da requisição:', url);

      // Fazer requisição direta à API conforme projeto de referência
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PUSHINPAY_TOKEN}`,
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
          console.error('❌ Resposta recebida (primeiros 500 caracteres):', text.substring(0, 500));
          
          return NextResponse.json({
            error: 'Resposta da API não é JSON',
            message: 'A API PushinPay retornou uma resposta que não é JSON',
            contentType: contentType,
            responsePreview: text.substring(0, 500)
          }, { status: 500 });
        }
        
        pixData = await response.json();
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

      console.log('📥 Resposta completa da API PushinPay:', JSON.stringify(pixData, null, 2));

      if (!response.ok) {
        console.error('❌ Erro PushinPay API:', {
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

      // Validar se o PIX foi criado corretamente
      if (!pixData.id) {
        console.error('❌ PIX criado mas sem ID na resposta:', pixData);
        return NextResponse.json({
          error: 'PIX criado mas resposta inválida',
          message: 'A PushinPay retornou sucesso mas sem ID da transação',
          details: pixData
        }, { status: 500 });
      }
      
      // Registrar PIX no armazenamento local com status inicial
      updatePixStatus(pixData.id, pixData.status || "created");
      
      console.log('✅ Transação criada com sucesso via PushinPay:');
      console.log('   ID:', pixData.id);
      console.log('   Status:', pixData.status);
      console.log('   Valor:', pixData.value);
      console.log('   QR Code presente:', !!pixData.qr_code);
      
      return NextResponse.json(pixData as CreatePixResponse);
    } catch (error: any) {
      console.error('❌ Erro ao criar PIX via PushinPay:', error);
      
      return NextResponse.json({
        error: error.message || 'Erro ao criar PIX',
        message: error.message || 'Erro ao criar PIX',
        details: error.response?.data || error
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Erro ao criar PIX:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
