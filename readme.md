# Aim Server

Servidor WebSocket em Node.js para jogos multiplayer em tempo real,
focado em **controle via celular**, **baixa latência** e **reconexão
segura (rejoin)**.

Este projeto foi desenvolvido como um **MVP** em conjunto a um jogo multiplayer local do famoso jogo **Duck Hunt**, 
priorizando simplicidade, previsibilidade e robustez contra desconexões comuns em dispositivos móveis.

---

## Funcionalidades

-   Criação de salas (host)
-   Entrada de controllers (celulares)
-   Limite de jogadores por sala
-   Rejoin simples (reconectar mantendo o mesmo player)
-   Proteção contra player duplicado
-   Relay de inputs em tempo real para o host
-   Notificações de conexão e desconexão
-   Testes automatizados

---

## Stack

-   Node.js
-   TypeScript
-   WebSocket (`ws`)
-   Vitest
-   Esbuild
-   TSX

---

## Scripts

``` bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start

# Testes
npm test
```

---

## Variáveis de ambiente

  Variável   Descrição           Padrão
  ---------- ------------------- --------
  PORT       Porta do servidor   8080

---

## Protocolo WebSocket (resumo)

### Criar sala (host)

``` json
{ "type": "create-room" }
```

### Entrar na sala (controller)

``` json
{ "type": "join-room", "roomId": "abc123" }
```

### Rejoin

``` json
{
  "type": "rejoin-room",
  "roomId": "abc123",
  "rejoinToken": "token"
}
```

### Input

``` json
{
  "type": "input",
  "payload": { "shoot": true }
}
```

---

## Rejoin (reconexão)

-   O servidor gera um `rejoinToken` ao entrar na sala
-   O controller deve persistir esse token
-   Em quedas de conexão, o jogador pode reconectar mantendo o mesmo
    `playerId`
-   Após um tempo de expiração, o slot é liberado

---

## Testes

O projeto possui testes cobrindo: - Criação de sala - Entrada de
players - Limite de jogadores - Rejoin - Relay de input

``` bash
npm test
```

---

## Observações

- O servidor mantém todo o estado em memória, sem persistência entre reinicializações
- Não há uso de banco de dados ou autenticação
- Focado em simplicidade, previsibilidade e facilidade de debug
- Ideal para MVPs e protótipos multiplayer

---

## Licença

Projeto pessoal e educacional.
