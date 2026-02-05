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
      console.error('❌ PAYEVO_SECRET_KEY não configurado');
      return NextResponse.json(
        { 
          error: "PAYEVO_SECRET_KEY não configurado",
          message: "Configure PAYEVO_SECRET_KEY nas variáveis de ambiente do Vercel"
        },
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
      paymentMethod: body.paymentMethod || "PIX", // "PIX" em maiúsculas conforme documentação
      description: body.description || "Pagamento PIX",
      installments: 1, // PIX sempre 1 parcela
    };

    // Adicionar postback se configurado
    if (postbackUrl) {
      payload.postbackUrl = postbackUrl;
    }

    // Adicionar metadata se fornecido
    if (body.metadata) {
      payload.metadata = typeof body.metadata === 'string' ? body.metadata : JSON.stringify(body.metadata);
    }

    // Adicionar customer se fornecido
    if (body.customer) {
      payload.customer = body.customer;
    }

    // Adicionar items se fornecido
    if (body.items && body.items.length > 0) {
      payload.items = body.items;
    } else {
      // Criar item padrão se não fornecido
      payload.items = [{
        title: body.description || "Pagamento PIX",
        unitPrice: body.amount,
        quantity: 1,
        externalRef: `order-${Date.now()}`
      }];
    }

    // Basic Authentication conforme documentação Payevo
    // A documentação indica usar Basic Auth com a SECRET_KEY
    const authHeader = 'Basic ' + Buffer.from(PAYEVO_SECRET_KEY).toString('base64');

    const url = `${PAYEVO_API_URL}/functions/v1/transactions`;
    
    console.log('📤 Criando transação Payevo:', {
      url,
      amount: body.amount,
      postbackUrl: postbackUrl || 'não configurado',
      payload: JSON.stringify(payload, null, 2),
      hasSecretKey: !!PAYEVO_SECRET_KEY,
      secretKeyLength: PAYEVO_SECRET_KEY.length
    });

    // Tentar requisição com diferentes formatos de header
    const headers: Record<string, string> = {
      'Authorization': authHeader,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    console.log('📤 Headers da requisição:', {
      'Authorization': headers.Authorization.substring(0, 30) + '...',
      'Content-Type': headers['Content-Type'],
      'Accept': headers.Accept
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('📥 Status da resposta:', response.status);
    console.log('📥 Resposta:', responseText.substring(0, 500));

    if (!response.ok) {
      console.error('❌ Erro na API Payevo:', {
        status: response.status,
        statusText: response.statusText,
        responseText: responseText.substring(0, 1000)
      });
      
      try {
        const errorData = JSON.parse(responseText);
        return NextResponse.json({
          error: errorData.message || errorData.error || 'Erro ao criar transação',
          details: errorData,
          statusCode: response.status
        }, { status: response.status });
      } catch {
        return NextResponse.json({
          error: 'Erro ao criar transação',
          details: responseText.substring(0, 500),
          statusCode: response.status
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

    console.log('✅ Transação criada com sucesso:', transactionData.id || transactionData.data?.id);

    // Extrair dados da resposta (pode vir em data ou na raiz)
    const transaction = transactionData.data || transactionData;
    
    // Adaptar resposta para formato compatível com frontend
    const adaptedResponse: CreateTransactionResponse = {
      id: transaction.id || transactionData.id,
      status: transaction.status || 'waiting_payment',
      amount: transaction.amount || body.amount,
      paymentMethod: transaction.paymentMethod || 'PIX',
      pix: transaction.pix || transactionData.pix,
      // Compatibilidade com frontend (extrair qrcode do objeto pix)
      qr_code: transaction.pix?.qrcode || transactionData.pix?.qrcode || '',
      qr_code_base64: '', // Payevo retorna link, não base64
      ...transaction
    };

    console.log('📋 Resposta adaptada:', {
      id: adaptedResponse.id,
      status: adaptedResponse.status,
      hasPix: !!adaptedResponse.pix,
      hasQrCode: !!adaptedResponse.qr_code
    });

    return NextResponse.json(adaptedResponse);

  } catch (error: any) {
    console.error("❌ Erro ao criar transação Payevo:", error);
    console.error("Stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    
    // Verificar se é erro de rede
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      return NextResponse.json(
        { 
          error: "Erro de conexão com a API Payevo",
          message: "Não foi possível conectar à API. Verifique a URL e sua conexão.",
          details: error.message
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Erro interno ao criar transação",
        message: error.message || "Erro desconhecido",
        type: error.name || 'Error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
