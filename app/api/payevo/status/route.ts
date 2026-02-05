import { NextRequest, NextResponse } from "next/server";
import { TransactionStatusResponse } from "@/types/payevo";

export const dynamic = 'force-dynamic';

// API Route para buscar status de transação Payevo
// Documentação: https://payevov2.readme.io
// Endpoint: GET https://apiv2.payevo.com.br/functions/v1/transactions/{id}

const PAYEVO_API_URL = process.env.PAYEVO_API_URL || "https://apiv2.payevo.com.br";
const PAYEVO_SECRET_KEY = process.env.PAYEVO_SECRET_KEY || "";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get("id") || searchParams.get("transactionId");

    if (!transactionId) {
      return NextResponse.json(
        { error: "ID da transação é obrigatório" },
        { status: 400 }
      );
    }

    if (!PAYEVO_SECRET_KEY) {
      return NextResponse.json(
        { error: "PAYEVO_SECRET_KEY não configurado" },
        { status: 500 }
      );
    }

    // Basic Authentication conforme documentação - Payevo requer SECRET_KEY:x
    const authHeader = 'Basic ' + Buffer.from(`${PAYEVO_SECRET_KEY}:x`).toString('base64');

    const url = `${PAYEVO_API_URL}/functions/v1/transactions/${transactionId}`;
    
    console.log(`🔍 Consultando transação Payevo: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const responseText = await response.text();
    console.log('📥 Status da resposta:', response.status);
    console.log('📥 Resposta:', responseText.substring(0, 500));

    if (response.status === 404) {
      return NextResponse.json({
        error: 'Transação não encontrada',
        transactionId
      }, { status: 404 });
    }

    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        return NextResponse.json({
          error: errorData.message || errorData.error || 'Erro ao buscar transação',
          details: errorData
        }, { status: response.status });
      } catch {
        return NextResponse.json({
          error: 'Erro ao buscar transação',
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

    // Extrair dados da resposta (pode vir em data ou na raiz)
    const transaction = transactionData.data || transactionData;
    
    const finalStatus = transaction.status || transactionData.status || 'waiting_payment';
    const finalPaidAt = transaction.paidAt || transactionData.paidAt;
    const pixData = transaction.pix || transactionData.pix;
    const updatedAt = transaction.updatedAt || transactionData.updatedAt;
    
    console.log(`✅ Status consultado: ${finalStatus}`);
    console.log(`💰 PaidAt: ${finalPaidAt || 'null'}`);
    console.log(`🔗 End2EndId: ${pixData?.end2EndId || pixData?.end_to_end_id || 'null'}`);
    console.log(`🧾 ReceiptUrl: ${pixData?.receiptUrl || pixData?.receipt_url || 'null'}`);
    console.log(`🕐 UpdatedAt: ${updatedAt || 'null'}`);
    console.log(`📊 Dados completos do PIX:`, JSON.stringify(pixData, null, 2));
    
    // Log adicional: verificar se há algum campo que indique pagamento
    if (pixData) {
      console.log(`🔍 Análise PIX - Todos os campos:`, Object.keys(pixData));
      console.log(`🔍 Análise PIX - Valores:`, pixData);
    }
    
    // Adaptar resposta para formato compatível com frontend
    const adaptedResponse: TransactionStatusResponse = {
      id: transaction.id || transactionData.id || transactionId,
      status: finalStatus,
      amount: transaction.amount || transactionData.amount || 0,
      paymentMethod: transaction.paymentMethod || transactionData.paymentMethod || 'PIX',
      pix: pixData,
      paidAt: finalPaidAt || null,
      ...transaction
    };
    
    console.log(`📋 Resposta adaptada:`, {
      id: adaptedResponse.id,
      status: adaptedResponse.status,
      paidAt: adaptedResponse.paidAt,
      hasPix: !!adaptedResponse.pix,
      hasEnd2EndId: !!pixData?.end2EndId,
      hasReceiptUrl: !!pixData?.receiptUrl
    });

    return NextResponse.json(adaptedResponse);

  } catch (error: any) {
    console.error("Erro ao buscar transação Payevo:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
