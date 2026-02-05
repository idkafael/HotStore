import { NextRequest, NextResponse } from "next/server";
import { CreateTransactionRequest, CreateTransactionResponse } from "@/types/payevo";

export const dynamic = 'force-dynamic';

// API Route para criar transação Payevo
// Documentação: https://payevov2.readme.io
// Endpoint: POST https://apiv2.payevo.com.br/functions/v1/transactions

const PAYEVO_API_URL = process.env.PAYEVO_API_URL || "https://apiv2.payevo.com.br";
const PAYEVO_SECRET_KEY = process.env.PAYEVO_SECRET_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const body: CreateTransactionRequest = await request.json();

    if (!PAYEVO_SECRET_KEY) {
      return NextResponse.json(
        { error: "PAYEVO_SECRET_KEY não configurado" },
        { status: 500 }
      );
    }

    // Validar valor mínimo
    if (!body.amount || body.amount < 50) {
      return NextResponse.json(
        { error: "O valor mínimo é de 50 centavos" },
        { status: 400 }
      );
    }

    // Configurar postback URL
    const postbackUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/payevo/postback`
      : undefined;

    // Preparar payload conforme documentação Payevo
    const payload: any = {
      amount: body.amount, // Valor em centavos
      description: body.description || "Pagamento PIX",
      payment_method: body.payment_method || "pix",
    };

    if (postbackUrl) {
      payload.postback_url = postbackUrl;
    }

    if (body.customer) {
      payload.customer = body.customer;
    }

    // Basic Authentication conforme documentação
    const authHeader = 'Basic ' + Buffer.from(PAYEVO_SECRET_KEY).toString('base64');

    const url = `${PAYEVO_API_URL}/functions/v1/transactions`;
    
    console.log('📤 Criando transação Payevo:', {
      url,
      amount: body.amount,
      postbackUrl: postbackUrl || 'não configurado'
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('📥 Status da resposta:', response.status);
    console.log('📥 Resposta:', responseText.substring(0, 500));

    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        return NextResponse.json({
          error: errorData.message || errorData.error || 'Erro ao criar transação',
          details: errorData
        }, { status: response.status });
      } catch {
        return NextResponse.json({
          error: 'Erro ao criar transação',
          details: responseText.substring(0, 500)
        }, { status: response.status });
      }
    }

    let transactionData;
    try {
      transactionData = JSON.parse(responseText);
    } catch (parseError) {
      return NextResponse.json({
        error: 'Erro ao processar resposta da API',
        details: responseText.substring(0, 500)
      }, { status: 500 });
    }

    console.log('✅ Transação criada com sucesso:', transactionData.id);

    // Adaptar resposta para formato compatível com frontend
    const adaptedResponse: CreateTransactionResponse = {
      id: transactionData.id || transactionData.transaction_id,
      status: transactionData.status || 'pending',
      amount: transactionData.amount || body.amount,
      qr_code: transactionData.qr_code || transactionData.pix_code || '',
      qr_code_base64: transactionData.qr_code_base64 || transactionData.qr_code_image || '',
      payment_link: transactionData.payment_link || '',
      ...transactionData
    };

    return NextResponse.json(adaptedResponse);

  } catch (error: any) {
    console.error("Erro ao criar transação Payevo:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
