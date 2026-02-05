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

    // Consultar status do PIX na PushinPay
    // Endpoint correto baseado no projeto funcional: /api/pix/status/{id}
    const apiEndpoint = `${PUSHINPAY_API_URL}/api/pix/status/${pixId}`;
    
    console.log("Consultando PIX na URL:", apiEndpoint);
    
    const response = await fetch(apiEndpoint, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${PUSHINPAY_TOKEN}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro ao consultar PIX:", errorText);
      console.error("Status:", response.status);
    }

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Erro ao consultar PIX", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data as PixStatusResponse);
  } catch (error: any) {
    console.error("Erro ao consultar PIX:", error);
    return NextResponse.json(
      { error: "Erro interno ao consultar PIX", details: error.message },
      { status: 500 }
    );
  }
}
