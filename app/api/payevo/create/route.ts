import { NextRequest, NextResponse } from "next/server";
import { CreateTransactionRequest, CreateTransactionResponse } from "@/types/payevo";

export const dynamic = 'force-dynamic';

// API Route para criar transação Payevo
// Documentação: https://payevov2.readme.io

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

    // TODO: Implementar criação de transação conforme documentação Payevo
    // Aguardando documentação completa

    return NextResponse.json({
      error: "Aguardando implementação",
      message: "Aguardando documentação completa do Payevo"
    }, { status: 501 });

  } catch (error: any) {
    console.error("Erro ao criar transação Payevo:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
