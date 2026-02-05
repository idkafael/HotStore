// Função para enviar notificações no Discord via Webhook

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number; // Cor em decimal (ex: 0x00ff00 para verde)
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  timestamp?: string;
  footer?: {
    text: string;
  };
}

export interface DiscordWebhookPayload {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

/**
 * Envia uma notificação para o Discord via Webhook
 * @param message - Mensagem de texto simples ou payload completo do Discord
 * @param embed - Embed opcional para formatação rica
 */
export async function sendDiscordNotification(
  message: string | DiscordWebhookPayload,
  embed?: DiscordEmbed
): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('⚠️ DISCORD_WEBHOOK_URL não configurado - notificação Discord ignorada');
    return false;
  }

  try {
    let payload: DiscordWebhookPayload;

    if (typeof message === 'string') {
      // Mensagem simples
      payload = {
        content: message,
        ...(embed && { embeds: [embed] })
      };
    } else {
      // Payload completo fornecido
      payload = message;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erro desconhecido');
      console.error('❌ Erro ao enviar notificação Discord:', response.status, errorText);
      return false;
    }

    console.log('✅ Notificação Discord enviada com sucesso');
    return true;
  } catch (error: any) {
    console.error('❌ Erro ao enviar notificação Discord:', error);
    return false;
  }
}

/**
 * Notifica quando um pagamento é confirmado
 */
export async function notifyPaymentConfirmed(
  transactionId: string,
  amount: number,
  description?: string
): Promise<boolean> {
  const valorEmReais = typeof amount === 'number' ? amount.toFixed(2) : parseFloat(amount).toFixed(2);
  
  const embed: DiscordEmbed = {
    title: '💰 Pagamento Confirmado!',
    description: 'Um novo pagamento foi recebido e confirmado.',
    color: 0x00ff00, // Verde
    fields: [
      {
        name: '💵 Valor',
        value: `R$ ${valorEmReais.replace('.', ',')}`,
        inline: true,
      },
      {
        name: '🆔 ID da Transação',
        value: transactionId,
        inline: true,
      },
      ...(description ? [{
        name: '📦 Produto',
        value: description,
        inline: false,
      }] : []),
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'HotStore Modelos',
    },
  };

  return await sendDiscordNotification('🎉 **Novo pagamento confirmado!**', embed);
}

/**
 * Notifica quando um novo modelo é adicionado
 */
export async function notifyNewModel(modelName: string, modelId: string): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: '✨ Novo Modelo Adicionado',
    description: `Um novo modelo foi adicionado ao catálogo.`,
    color: 0x9b59b6, // Roxo (cor do tema)
    fields: [
      {
        name: '👤 Nome',
        value: modelName,
        inline: true,
      },
      {
        name: '🆔 ID',
        value: modelId,
        inline: true,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'HotStore Modelos - Painel Admin',
    },
  };

  return await sendDiscordNotification('📝 **Novo modelo no catálogo!**', embed);
}

/**
 * Notifica quando um modelo é deletado
 */
export async function notifyModelDeleted(modelName: string, modelId: string): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: '🗑️ Modelo Removido',
    description: `Um modelo foi removido do catálogo.`,
    color: 0xff0000, // Vermelho
    fields: [
      {
        name: '👤 Nome',
        value: modelName,
        inline: true,
      },
      {
        name: '🆔 ID',
        value: modelId,
        inline: true,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'HotStore Modelos - Painel Admin',
    },
  };

  return await sendDiscordNotification('⚠️ **Modelo removido do catálogo**', embed);
}
