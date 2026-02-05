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
      console.log(`⚠️ PIX ${pixId} não encontrado no armazenamento local`);
      console.log("Isso pode acontecer se o servidor foi reiniciado ou o PIX foi criado antes do deploy");
      console.log("O webhook ainda funcionará quando o pagamento for confirmado");
      
      // Retornar status "created" como padrão se não encontrar
      // O webhook atualizará quando o pagamento for confirmado
      return NextResponse.json({
        id: pixId,
        status: "created" as const, // Status padrão - webhook atualizará quando pago
        qr_code: "",
        value: 0,
        qr_code_base64: "",
        split_rules: [],
        note: "Status não encontrado no cache local - aguardando webhook"
      } as PixStatusResponse);
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
