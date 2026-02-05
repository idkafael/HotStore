import { NextRequest, NextResponse } from "next/server";
import { PixWebhookPayload } from "@/types/pix";
import { updatePixStatus } from "@/lib/pixStatusStore";

export async function POST(request: NextRequest) {
  try {
    const payload: PixWebhookPayload = await request.json();

    console.log("🔔 Webhook PIX recebido:", JSON.stringify(payload, null, 2));
    console.log(`📋 PIX ID: ${payload.id}`);
    console.log(`📋 Status: ${payload.status}`);

    // Atualizar status no armazenamento local
    updatePixStatus(payload.id, payload.status);
    console.log(`✅ Status do PIX ${payload.id} atualizado no armazenamento local para: ${payload.status}`);
    
    if (payload.status === "paid") {
      // Pagamento confirmado
      console.log(`🎉 PIX ${payload.id} FOI PAGO!`);
      console.log(`End-to-end ID: ${payload.end_to_end_id}`);
      console.log(`Pagador: ${payload.payer_name} (${payload.payer_national_registration})`);
      console.log(`💰 Valor: R$ ${(payload.value / 100).toFixed(2)}`);
      
      // O frontend será notificado através do polling do endpoint local
      // que consulta este armazenamento
      console.log(`📡 Frontend será notificado no próximo polling (a cada 3 segundos)`);
    }

    // Retornar 200 para confirmar recebimento
    return NextResponse.json({ 
      success: true, 
      message: "Webhook recebido e processado",
      pixId: payload.id,
      status: payload.status
    });
  } catch (error: any) {
    console.error("❌ Erro ao processar webhook:", error);
    console.error("Payload recebido:", await request.text().catch(() => "Não foi possível ler o payload"));
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
