import { NextRequest, NextResponse } from "next/server";
import { PixWebhookPayload } from "@/types/pix";

export async function POST(request: NextRequest) {
  try {
    const payload: PixWebhookPayload = await request.json();

    console.log("Webhook PIX recebido:", payload);

    // Aqui você pode processar o pagamento
    // Por exemplo: atualizar status no banco de dados, enviar email, etc.
    
    if (payload.status === "paid") {
      // Pagamento confirmado
      console.log(`PIX ${payload.id} foi pago!`);
      console.log(`End-to-end ID: ${payload.end_to_end_id}`);
      console.log(`Pagador: ${payload.payer_name} (${payload.payer_national_registration})`);
      
      // TODO: Implementar lógica de negócio aqui
      // - Atualizar status da transação
      // - Liberar acesso ao conteúdo entregável
      // - Enviar email de confirmação
      // - Registrar no banco de dados
    }

    // Retornar 200 para confirmar recebimento
    return NextResponse.json({ success: true, message: "Webhook recebido" });
  } catch (error: any) {
    console.error("Erro ao processar webhook:", error);
    // Retornar 200 mesmo em caso de erro para evitar retentativas desnecessárias
    // PushinPay tentará novamente automaticamente
    return NextResponse.json(
      { error: "Erro ao processar webhook", details: error.message },
      { status: 200 }
    );
  }
}

// Permitir GET para verificação (opcional)
export async function GET() {
  return NextResponse.json({ message: "Webhook endpoint ativo" });
}
