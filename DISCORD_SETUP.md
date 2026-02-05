# Configuração de Notificações Discord

O projeto está configurado para enviar notificações automáticas no Discord quando eventos importantes acontecem.

## 📋 Eventos que geram notificações:

1. **💰 Pagamento Confirmado** - Quando um pagamento é confirmado via webhook do SyncPay
2. **✨ Novo Modelo Adicionado** - Quando um novo modelo é adicionado pelo painel admin
3. **🗑️ Modelo Removido** - Quando um modelo é deletado do catálogo

## 🔧 Como configurar:

### 1. Criar um Webhook no Discord

1. Abra o Discord e vá para o servidor onde deseja receber as notificações
2. Vá em **Configurações do Servidor** → **Integrações** → **Webhooks**
3. Clique em **Criar Webhook**
4. Configure:
   - **Nome**: HotStore Modelos (ou o nome que preferir)
   - **Canal**: Escolha o canal onde as notificações aparecerão
5. Clique em **Copiar URL do Webhook**

### 2. Adicionar a variável de ambiente

Adicione a URL do webhook nas variáveis de ambiente:

**Local (.env.local):**
```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/SEU_WEBHOOK_ID/SEU_WEBHOOK_TOKEN
```

**Vercel (Produção):**
1. Vá em **Settings** → **Environment Variables**
2. Adicione:
   - **Name**: `DISCORD_WEBHOOK_URL`
   - **Value**: Cole a URL do webhook
   - **Environments**: Production, Preview, Development (ou apenas Production)

### 3. Testar

Após configurar, as notificações serão enviadas automaticamente quando:
- Um pagamento for confirmado
- Um novo modelo for adicionado
- Um modelo for deletado

## 📝 Formato das Notificações

As notificações usam **Embeds** do Discord com:
- **Cores diferentes** para cada tipo de evento
- **Campos organizados** com informações relevantes
- **Timestamp** automático
- **Footer** com identificação do sistema

## ⚠️ Notas Importantes

- Se `DISCORD_WEBHOOK_URL` não estiver configurado, as notificações serão ignoradas silenciosamente (não quebra o sistema)
- Erros ao enviar notificações não afetam o funcionamento principal do sistema
- As notificações são enviadas de forma assíncrona (não bloqueiam outras operações)

## 🔒 Segurança

- **NUNCA** compartilhe a URL do webhook publicamente
- Mantenha a URL segura nas variáveis de ambiente
- Se o webhook for comprometido, delete-o e crie um novo no Discord
