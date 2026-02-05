import { NextRequest, NextResponse } from "next/server";
import { getPixStatusWithCleanup } from "@/lib/pixStatusStore";
import { PixStatusResponse } from "@/types/pix";

// Endpoint local para consultar status de PIX
// Consulta o armazenamento local que é atualizado pelo webhook
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

    const status = getPixStatusWithCleanup(pixId);

    if (!status) {
      return NextResponse.json(
        { 
          error: "PIX não encontrado",
          message: "O PIX ainda não foi registrado ou foi removido do cache"
        },
        { status: 404 }
      );
    }

    // Retornar no formato esperado pelo frontend
    return NextResponse.json({
      id: status.id,
      status: status.status,
      // Campos opcionais que podem não estar disponíveis
      qr_code: "",
      value: 0,
      qr_code_base64: "",
      split_rules: [],
    } as PixStatusResponse);
  } catch (error: any) {
    console.error("Erro ao consultar status local:", error);
    return NextResponse.json(
      { error: "Erro interno ao consultar status", details: error.message },
      { status: 500 }
    );
  }
}
