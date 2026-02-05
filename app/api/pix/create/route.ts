import { NextRequest, NextResponse } from "next/server";
import { CreatePixRequest, CreatePixResponse } from "@/types/pix";
import { updatePixStatus } from "@/lib/pixStatusStore";

// A URL base da PushinPay
// Baseado na documentação: https://app.theneo.io/pushinpay/pix/pix/criar-pix
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

    // Criar webhook URL - sempre usar NEXT_PUBLIC_APP_URL se configurado (produção)
    // Senão usar o webhook_url do body (desenvolvimento)
    const webhookUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/pix/webhook`
      : (body.webhook_url || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/pix/webhook`);

    // Preparar payload para PushinPay conforme documentação
    const payload: any = {
      value: body.value,
    };

    if (webhookUrl) {
      payload.webhook_url = webhookUrl;
      console.log("🔗 Webhook URL configurado:", webhookUrl);
    } else {
      console.warn("⚠️ Webhook URL não configurado! O PushinPay não poderá notificar sobre pagamentos.");
      console.warn("Configure NEXT_PUBLIC_APP_URL ou envie webhook_url no body da requisição");
    }

    if (body.split_rules && body.split_rules.length > 0) {
      payload.split_rules = body.split_rules;
    }

    // Tentar diferentes endpoints possíveis conforme documentação
    // Opção 1: /api/pix/cashIn (atual)
    // Opção 2: /pix/criar-pix (conforme URL da documentação)
    // Opção 3: /api/pix/create
    const endpoints = [
      `${PUSHINPAY_API_BASE}/api/pix/cashIn`,
      `${PUSHINPAY_API_BASE}/pix/criar-pix`,
      `${PUSHINPAY_API_BASE}/api/pix/create`,
    ];
    
    let lastError: any = null;
    
    console.log("=== DEBUG PIX CREATE ===");
    console.log("URL Base:", PUSHINPAY_API_BASE);
    console.log("Token presente:", PUSHINPAY_TOKEN ? "Sim" : "Não");
    console.log("Webhook URL:", webhookUrl || "NÃO CONFIGURADO");
    console.log("NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL || "NÃO CONFIGURADO");
    console.log("Payload:", JSON.stringify(payload, null, 2));
    
    for (const apiEndpoint of endpoints) {
      try {
        console.log("Tentando endpoint:", apiEndpoint);
        
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${PUSHINPAY_TOKEN}`,
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        console.log("Status da resposta:", response.status);
        console.log("Resposta:", responseText.substring(0, 500));

        if (response.ok) {
          try {
            const data = JSON.parse(responseText);
            console.log("✅ PIX criado com sucesso! ID:", data.id);
            console.log("✅ Endpoint funcionando:", apiEndpoint);
            
            // Registrar PIX no armazenamento local com status inicial
            updatePixStatus(data.id, data.status || "created");
            
            return NextResponse.json(data as CreatePixResponse);
          } catch (parseError) {
            console.error("Erro ao fazer parse da resposta:", parseError);
            return NextResponse.json(
              { 
                error: "Erro ao processar resposta da API", 
                details: `Resposta não é JSON válido. Status: ${response.status}`,
                response: responseText.substring(0, 200)
              },
              { status: 500 }
            );
          }
        } else {
          // Se não foi bem-sucedida, tentar próximo endpoint
          try {
            const errorData = JSON.parse(responseText);
            lastError = {
              endpoint: apiEndpoint,
              status: response.status,
              error: errorData.message || errorData.error || "Erro ao criar PIX",
              details: errorData
            };
            console.log("Endpoint falhou, tentando próximo...");
            continue; // Tentar próximo endpoint
          } catch {
            lastError = {
              endpoint: apiEndpoint,
              status: response.status,
              error: "Erro ao criar PIX",
              details: responseText.substring(0, 200)
            };
            continue;
          }
        }
      } catch (fetchError: any) {
        console.error(`Erro ao conectar com endpoint ${apiEndpoint}:`, fetchError.message);
        lastError = {
          endpoint: apiEndpoint,
          error: "Erro ao conectar com a API",
          details: fetchError.message
        };
        continue; // Tentar próximo endpoint
      }
    }

    // Se todos os endpoints falharam, retornar erro
    return NextResponse.json(
      { 
        error: "Erro ao criar PIX - todos os endpoints falharam", 
        details: lastError,
        message: "Verifique a documentação em https://app.theneo.io/pushinpay/pix/criar-pix para o endpoint correto"
      },
      { status: 500 }
    );

  } catch (error: any) {
    console.error("Erro ao criar PIX:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar PIX", details: error.message },
      { status: 500 }
    );
  }
}
