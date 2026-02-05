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
      return NextResponse.json(
        { error: "Token PushinPay não configurado" },
        { status: 500 }
      );
    }

    // Tentar diferentes endpoints possíveis
    const endpoints = [
      `${PUSHINPAY_API_URL}/api/pix/status/${pixId}`,
      `${PUSHINPAY_API_URL}/pix/status/${pixId}`,
      `${PUSHINPAY_API_URL}/api/pix/${pixId}`,
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
          // Se não foi bem-sucedida, tentar próximo endpoint
          try {
            const errorData = JSON.parse(responseText);
            lastError = {
              endpoint: apiEndpoint,
              status: response.status,
              error: errorData.message || "Erro ao consultar PIX",
              details: errorData
            };
            console.log("Endpoint falhou, tentando próximo...");
            continue;
          } catch {
            lastError = {
              endpoint: apiEndpoint,
              status: response.status,
              error: "Erro ao consultar PIX",
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
        continue;
      }
    }

    // Se todos os endpoints falharam, retornar erro
    return NextResponse.json(
      { 
        error: "Erro ao consultar PIX - todos os endpoints falharam", 
        details: lastError
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
