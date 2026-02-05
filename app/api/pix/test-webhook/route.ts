import { NextRequest, NextResponse } from "next/server";
import { updatePixStatus } from "@/lib/pixStatusStore";

// Rota de teste para simular webhook manualmente
// Útil para testar se o sistema está funcionando
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pixId, status } = body;

    if (!pixId) {
      return NextResponse.json(
        { error: "pixId é obrigatório" },
        { status: 400 }
      );
    }

    const validStatus = status || "paid";
    
    console.log(`🧪 TESTE: Simulando webhook para PIX ${pixId} com status ${validStatus}`);
    
    // Atualizar status no armazenamento local
    updatePixStatus(pixId, validStatus as any);
    
    return NextResponse.json({
      success: true,
      message: `Status do PIX ${pixId} atualizado para ${validStatus}`,
      pixId,
      status: validStatus,
      note: "Este é um teste manual. O frontend será notificado no próximo polling."
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao processar teste", details: error.message },
      { status: 500 }
    );
  }
}

// GET para mostrar instruções
export async function GET() {
  return NextResponse.json({
    message: "Endpoint de teste de webhook",
    usage: "POST com body: { pixId: 'seu-pix-id', status: 'paid' }",
    example: {
      pixId: "a101f8ca-2a0a-4e37-8012-e9037a7062b4",
      status: "paid"
    }
  });
}
