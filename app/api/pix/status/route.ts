import { NextRequest, NextResponse } from "next/server";
import { PixStatusResponse } from "@/types/pix";

const PUSHINPAY_API_URL = process.env.PUSHINPAY_API_URL || "https://api.pushinpay.com.br";
const PUSHINPAY_TOKEN = process.env.PUSHINPAY_TOKEN || "";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pixId = searchParams.get("id");

    if (!pixId) {
      return NextResponse.json(
        { error: "ID do PIX é obrigatório" },
        { status: 400 }
      );
    }

    if (!PUSHINPAY_TOKEN) {
      console.error("❌ Token PushinPay não configurado no ambiente");
      return NextResponse.json(
        { 
          error: "Token PushinPay não configurado",
          message: "Configure PUSHINPAY_TOKEN nas variáveis de ambiente do Vercel"
        },
        { status: 500 }
      );
    }

    // Tentar diferentes endpoints possíveis conforme documentação PushinPay
    // Nota: Algumas APIs usam o mesmo endpoint de criação com GET para consultar
    const endpoints = [
      `${PUSHINPAY_API_URL}/api/pix/cashIn/${pixId}`, // Mesmo endpoint de criação, mas com GET
      `${PUSHINPAY_API_URL}/api/pix/status/${pixId}`,
      `${PUSHINPAY_API_URL}/pix/status/${pixId}`,
      `${PUSHINPAY_API_URL}/api/pix/${pixId}`,
      `${PUSHINPAY_API_URL}/pix/${pixId}`,
    ];
    
    let lastError: any = null;
    
    for (const apiEndpoint of endpoints) {
      try {
        console.log("Consultando PIX na URL:", apiEndpoint);
        
        const response = await fetch(apiEndpoint, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${PUSHINPAY_TOKEN}`,
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
        });

        // Ler o texto da resposta primeiro
        const responseText = await response.text();
        
        if (response.ok) {
          try {
            const data = JSON.parse(responseText);
            console.log("✅ Status consultado com sucesso! Endpoint:", apiEndpoint);
            return NextResponse.json(data as PixStatusResponse);
          } catch (parseError) {
            console.error("Erro ao fazer parse da resposta:", parseError);
            return NextResponse.json(
              { error: "Erro ao processar resposta da API", details: "Resposta não é JSON válido" },
              { status: 500 }
            );
          }
        } else {
          // Log detalhado do erro
          console.error(`❌ Endpoint ${apiEndpoint} retornou status ${response.status}`);
          console.error("Resposta completa:", responseText);
          
          // Se não foi bem-sucedida, tentar próximo endpoint
          // Mas se for erro 401 (não autorizado) ou 403 (proibido), provavelmente é problema de token
          if (response.status === 401 || response.status === 403) {
            console.error(`❌ Erro de autenticação (${response.status}) no endpoint: ${apiEndpoint}`);
            console.error("Resposta:", responseText.substring(0, 500));
            // Não continuar tentando outros endpoints se for erro de autenticação
            try {
              const errorData = JSON.parse(responseText);
              return NextResponse.json(
                {
                  error: "Erro de autenticação com PushinPay",
                  message: errorData.message || "Token inválido ou não autorizado",
                  details: errorData,
                  endpoint: apiEndpoint,
                  status: response.status
                },
                { status: response.status }
              );
            } catch {
              return NextResponse.json(
                {
                  error: "Erro de autenticação com PushinPay",
                  message: "Verifique se o token está correto nas variáveis de ambiente do Vercel",
                  details: responseText.substring(0, 500),
                  endpoint: apiEndpoint,
                  status: response.status
                },
                { status: response.status }
              );
            }
          }
          
          // Se for erro 404, o endpoint pode não existir
          if (response.status === 404) {
            console.log(`Endpoint ${apiEndpoint} não encontrado (404), tentando próximo...`);
            try {
              const errorData = JSON.parse(responseText);
              lastError = {
                endpoint: apiEndpoint,
                status: response.status,
                error: errorData.message || "Endpoint não encontrado",
                details: errorData
              };
            } catch {
              lastError = {
                endpoint: apiEndpoint,
                status: response.status,
                error: "Endpoint não encontrado",
                details: responseText.substring(0, 200)
              };
            }
            continue;
          }
          
          try {
            const errorData = JSON.parse(responseText);
            lastError = {
              endpoint: apiEndpoint,
              status: response.status,
              error: errorData.message || errorData.error || "Erro ao consultar PIX",
              details: errorData,
              responseText: responseText.substring(0, 500)
            };
            console.log(`Endpoint ${apiEndpoint} falhou com status ${response.status}, tentando próximo...`);
            continue;
          } catch {
            lastError = {
              endpoint: apiEndpoint,
              status: response.status,
              error: "Erro ao consultar PIX",
              details: responseText.substring(0, 500),
              responseText: responseText.substring(0, 500)
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
        continue;
      }
    }

    // Se todos os endpoints falharam, retornar erro com mais detalhes
    console.error("❌ Todos os endpoints falharam");
    console.error("Último erro:", JSON.stringify(lastError, null, 2));
    console.error("PIX ID:", pixId);
    console.error("API URL:", PUSHINPAY_API_URL);
    console.error("Token presente:", PUSHINPAY_TOKEN ? "Sim (primeiros 20 chars: " + PUSHINPAY_TOKEN.substring(0, 20) + "...)" : "Não");
    console.error("Endpoints tentados:", endpoints.join(", "));
    
    return NextResponse.json(
      { 
        error: "Erro ao consultar PIX - todos os endpoints falharam", 
        details: lastError,
        message: "O webhook ainda funcionará para notificar quando o pagamento for confirmado. Verifique os logs do Vercel para mais detalhes sobre os endpoints tentados.",
        pixId: pixId,
        apiUrl: PUSHINPAY_API_URL,
        tokenConfigured: !!PUSHINPAY_TOKEN,
        endpointsTried: endpoints.length,
        endpoints: endpoints,
        note: "O pagamento será detectado via webhook mesmo se o polling falhar. Consulte a documentação da PushinPay para o endpoint correto de consulta de status."
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Erro ao consultar PIX:", error);
    return NextResponse.json(
      { error: "Erro interno ao consultar PIX", details: error.message },
      { status: 500 }
    );
  }
}
