import { NextRequest, NextResponse } from "next/server";
import { getPixStatusWithCleanup, updatePixStatus, canCheckApi, markApiCheck } from "@/lib/pixStatusStore";
import { PixStatusResponse } from "@/types/pix";

const PUSHINPAY_API_URL = process.env.PUSHINPAY_API_URL || "https://api.pushinpay.com.br";
const PUSHINPAY_TOKEN = process.env.PUSHINPAY_TOKEN || "";

// Endpoint local para consultar status de PIX
// Sistema híbrido: consulta cache local (atualizado pelo webhook) e API PushinPay como fallback
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

    // Primeiro, tentar consultar o armazenamento local (atualizado pelo webhook)
    let status = getPixStatusWithCleanup(pixId);

    // Se não encontrar no cache OU se o status ainda for "created" E já passou 1 minuto desde última consulta,
    // tentar consultar a API PushinPay diretamente como fallback
    if ((!status || status.status === "created") && canCheckApi(pixId) && PUSHINPAY_TOKEN) {
      console.log(`🔄 PIX ${pixId} não encontrado no cache ou ainda 'created', consultando API PushinPay como fallback...`);
      
      // Endpoint correto conforme documentação: GET /api/pix/{id}
      const apiEndpoint = `${PUSHINPAY_API_URL}/api/pix/${pixId}`;
      
      try {
        const response = await fetch(apiEndpoint, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${PUSHINPAY_TOKEN}`,
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const responseText = await response.text();
          try {
            const data = JSON.parse(responseText);
            console.log(`✅ Status consultado da API PushinPay: ${data.status}`);
            
            // Atualizar o armazenamento local com o status da API
            updatePixStatus(pixId, data.status);
            markApiCheck(pixId); // Marcar que consultamos a API
            
            return NextResponse.json({
              id: data.id || pixId,
              status: data.status,
              qr_code: data.qr_code || "",
              value: data.value || 0,
              qr_code_base64: data.qr_code_base64 || "",
              split_rules: data.split_rules || [],
            } as PixStatusResponse);
          } catch (parseError) {
            console.error("Erro ao fazer parse da resposta da API:", parseError);
          }
        } else if (response.status === 404) {
          // Conforme documentação, 404 retorna array vazio []
          console.log(`PIX ${pixId} não encontrado na API PushinPay (404)`);
          markApiCheck(pixId); // Marcar mesmo assim para não tentar novamente imediatamente
        } else {
          console.error(`Erro ao consultar API: ${response.status}`);
        }
      } catch (fetchError: any) {
        console.error(`Erro ao conectar com API PushinPay:`, fetchError.message);
        // Continuar e retornar status do cache se existir
      }
    } else if (!canCheckApi(pixId)) {
      console.log(`⏱️ Rate limiting: última consulta da API foi há menos de 1 minuto para PIX ${pixId}`);
    }

    // Se encontrou no cache, retornar
    if (status) {
      return NextResponse.json({
        id: status.id,
        status: status.status,
        qr_code: "",
        value: 0,
        qr_code_base64: "",
        split_rules: [],
      } as PixStatusResponse);
    }

    // Se não encontrou em lugar nenhum, retornar status "created" como padrão
    console.log(`⚠️ PIX ${pixId} não encontrado no cache e não foi possível consultar API`);
    return NextResponse.json({
      id: pixId,
      status: "created" as const,
      qr_code: "",
      value: 0,
      qr_code_base64: "",
      split_rules: [],
      note: "Status não encontrado - aguardando webhook ou próxima verificação (rate limit: 1 minuto)"
    } as PixStatusResponse);
  } catch (error: any) {
    console.error("Erro ao consultar status local:", error);
    return NextResponse.json(
      { error: "Erro interno ao consultar status", details: error.message },
      { status: 500 }
    );
  }
}
