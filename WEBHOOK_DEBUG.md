# Debug do Webhook PushinPay

## Como verificar se o webhook está funcionando

### 1. Verificar se o webhook está configurado no PushinPay

1. Acesse o painel da PushinPay
2. Vá em Configurações > Webhooks
3. Verifique se há um webhook configurado apontando para:
   ```
   https://hot-store.vercel.app/api/pix/webhook
   ```

### 2. Verificar logs do webhook no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto `HotStore`
3. Vá em **Deployments** > Selecione o último deployment
4. Clique em **Functions** > `/api/pix/webhook`
5. Procure por logs que contenham:
   - `🔔 Webhook PIX recebido:` - indica que o webhook foi chamado
   - `✅ Status do PIX ... atualizado` - indica que o status foi atualizado
   - `🎉 PIX ... FOI PAGO!` - indica que o pagamento foi confirmado

### 3. Testar o webhook manualmente

Você pode testar o webhook fazendo uma requisição POST para:
```
https://hot-store.vercel.app/api/pix/webhook
```

Com o seguinte payload (exemplo):
```json
{
  "id": "a101f8ca-2a0a-4e37-8012-e9037a7062b4",
  "status": "paid",
  "value": 100,
  "end_to_end_id": "E12345678202302051234567890123456",
  "payer_name": "João Silva",
  "payer_national_registration": "12345678901"
}
```

### 4. Verificar se o PIX foi registrado no armazenamento

Após criar um PIX, você pode verificar se ele foi registrado acessando:
```
https://hot-store.vercel.app/api/pix/status-local?id=SEU_PIX_ID
```

Se retornar `status: "created"`, o PIX foi registrado corretamente.

### 5. Problemas comuns

#### Webhook não está sendo chamado
- Verifique se o webhook está configurado no painel da PushinPay
- Verifique se a URL está correta: `https://hot-store.vercel.app/api/pix/webhook`
- Verifique se o webhook está ativo no painel da PushinPay

#### PIX não encontrado no cache (404)
- Isso é normal se o servidor foi reiniciado
- O sistema retorna `status: "created"` como padrão
- O webhook atualizará o status quando o pagamento for confirmado
- O frontend continuará tentando até receber a notificação

#### Pagamento foi feito mas não atualizou
- Verifique os logs do webhook no Vercel
- Verifique se o webhook está configurado corretamente no PushinPay
- O webhook pode levar alguns segundos para ser chamado após o pagamento

## Fluxo esperado

1. **Usuário cria PIX** → Sistema registra no armazenamento local com `status: "created"`
2. **Usuário paga o PIX** → PushinPay detecta o pagamento
3. **PushinPay chama webhook** → `/api/pix/webhook` recebe notificação
4. **Webhook atualiza armazenamento** → Status muda para `"paid"`
5. **Frontend detecta mudança** → Polling local encontra `status: "paid"`
6. **Conteúdo é liberado** → Link do entregável é aberto automaticamente

## Tempo esperado

- **Criação do PIX**: Imediato
- **Webhook após pagamento**: 5-30 segundos (depende da PushinPay)
- **Detecção pelo frontend**: Até 3 segundos após webhook (próximo polling)
