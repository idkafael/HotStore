import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const PAYEVO_API_URL = process.env.PAYEVO_API_URL || "https://apiv2.payevo.com.br";
const PAYEVO_SECRET_KEY = process.env.PAYEVO_SECRET_KEY || "";

// Endpoint para verificar manualmente uma transação e ver TODOS os dados
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get("id");

    if (!transactionId) {
      return NextResponse.json(
        { error: "ID da transação é obrigatório. Use ?id=TRANSACTION_ID" },
        { status: 400 }
      );
    }

    if (!PAYEVO_SECRET_KEY) {
      return NextResponse.json(
        { error: "PAYEVO_SECRET_KEY não configurado" },
        { status: 500 }
      );
    }

    // Payevo requer SECRET_KEY:x no Basic Auth conforme documentação
    const authHeader = 'Basic ' + Buffer.from(`${PAYEVO_SECRET_KEY}:x`).toString('base64');
    const url = `${PAYEVO_API_URL}/functions/v1/transactions/${transactionId}`;

    console.log(`🔍 Consultando transação Payevo diretamente: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      return NextResponse.json({
        error: 'Erro ao buscar transação',
        status: response.status,
        response: responseText.substring(0, 1000)
      }, { status: response.status });
    }

    let transactionData;
    try {
      transactionData = JSON.parse(responseText);
    } catch (parseError) {
      return NextResponse.json({
        error: 'Erro ao processar resposta da API',
        response: responseText.substring(0, 1000)
      }, { status: 500 });
    }

    // Retornar TODOS os dados da transação para debug
    return NextResponse.json({
      transactionId: transactionId,
      rawResponse: transactionData,
      status: transactionData.status || transactionData.data?.status,
      paidAt: transactionData.paidAt || transactionData.data?.paidAt,
      pix: transactionData.pix || transactionData.data?.pix,
      allFields: Object.keys(transactionData),
      fullData: transactionData
    });

  } catch (error: any) {
    console.error("Erro ao verificar transação Payevo:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
