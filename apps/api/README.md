# EliteLance — API

API REST do **EliteLance**, uma plataforma de leilões desenvolvida como desafio técnico Full Stack para processo seletivo da Verzel. O backend gerencia autenticação, catálogo externo de produtos, criação de lotes, carteira fictícia, lances concorrentes, auditoria criptográfica e liquidação de leilões.

> **Escopo:** este documento descreve a implementação do backend. A interface web, a atualização em tempo real e o deploy são tratados separadamente e não devem ser considerados concluídos por esta documentação.

## Tecnologias

- **Node.js, TypeScript e Express 5** — API HTTP.
- **PostgreSQL** — persistência de dados.
- **Prisma ORM 7** com `@prisma/adapter-pg` — acesso ao banco e migrações.
- **JWT (`jsonwebtoken`) e `bcrypt`** — autenticação e proteção de senhas.
- **Zod** — validação de entradas.
- **tsx** — execução e desenvolvimento em TypeScript.
- **SHA-256 (`node:crypto`)** — encadeamento de hashes dos lances.

## Estrutura

```text
apps/api/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── generated/             # Cliente Prisma gerado
│   ├── jobs/                  # Rotina periódica de finalização
│   ├── lib/
│   │   └── prisma.ts          # Instância do Prisma Client
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   └── authorize.middleware.ts
│   ├── modules/
│   │   ├── auctions/          # Lotes, status, liquidação e comprovantes
│   │   ├── auth/              # Cadastro, login e perfil autenticado
│   │   ├── bids/              # Lances, hashes e histórico auditável
│   │   ├── catalog/           # Consulta ao catálogo externo
│   │   └── wallet/            # Carteira e depósitos fictícios
│   ├── scripts/               # Scripts auxiliares e testes manuais
│   ├── app.ts
│   └── server.ts
└── package.json
```

Os módulos organizam rotas, controllers, services e, quando aplicável, schemas de validação. As regras de negócio ficam nos services.

## Pré-requisitos

- Node.js e npm compatíveis com as dependências do projeto.
- PostgreSQL em execução.
- Banco de dados criado e acessível pela URL de conexão.

## Configuração local

A partir da raiz do monorepositório, instale as dependências:

```bash
npm install
```

Configure as variáveis de ambiente da API, conforme os arquivos de configuração do projeto. As variáveis necessárias incluem a conexão PostgreSQL (`DATABASE_URL`) e o segredo usado para assinar os tokens JWT. **Não publique valores reais de segredos nem arquivos `.env` no Git.**

> Confira os nomes exatos das variáveis JWT, da porta e de outras configurações em `src/server.ts`, no módulo de autenticação e em `prisma.config.ts` antes de criar um `.env.example`.

Aplique as migrações existentes e gere o cliente Prisma, a partir de `apps/api`:

```bash
npx prisma migrate deploy
npx prisma generate
```

Para desenvolvimento:

```bash
npm run dev
```

Para validar a compilação:

```bash
npm run typecheck
npm run build
```

Para executar a versão compilada:

```bash
npm start
```

> O script `start` usa `node dist/server.js`. Confira o diretório de saída configurado em `tsconfig.json` antes de utilizar esse comando no deploy.

## Modelo de dados

| Modelo | Responsabilidade |
|---|---|
| `User` | Usuários com papéis `BIDDER` e `AUCTIONEER`; armazena hash da senha. |
| `Wallet` | Saldo (`balanceCents`) e valor reservado (`reservedCents`) por usuário. |
| `AuctionLot` | Lote, produto externo, preços, horários, status e leiloeiro. |
| `Bid` | Lance, participante, valor, sequência e cadeia de hashes. |
| `AuctionSettlement` | Registro único da liquidação de um lote, com vencedor, leiloeiro e valor. |

Os valores monetários são armazenados em **centavos**, usando `BigInt`. Nas respostas JSON, os valores `BigInt` precisam ser serializados como strings para evitar perda de precisão.

Status previstos para lotes: `DRAFT`, `SCHEDULED`, `ACTIVE`, `FINISHED` e `CANCELED`.

## Autenticação e autorização

- Cadastro e login com senha protegida por `bcrypt`.
- Autenticação por token JWT.
- Middleware de autenticação valida o usuário e disponibiliza seus dados em `res.locals.user`.
- Middleware de autorização restringe operações conforme o papel do usuário.
- Leiloeiros podem criar lotes; licitantes podem ofertar lances e realizar depósitos fictícios.

A criação de usuários leiloeiros pode ser realizada pelo script administrativo `src/scripts/create-auctioneer.ts`; não é uma permissão aberta a qualquer cadastro público.

## Rotas principais

A lista abaixo reúne as rotas implementadas e testadas durante o desenvolvimento. Consulte os arquivos `*.routes.ts` para confirmar parâmetros, payloads e eventuais ajustes de prefixo.

| Método | Rota | Finalidade |
|---|---|---|
| `POST` | `/auth/register` | Cadastro de usuário. |
| `POST` | `/auth/login` | Login e emissão de JWT. |
| `GET` | `/auth/me` | Dados do usuário autenticado. |
| `GET` | `/catalog/search?q=...` | Pesquisa no catálogo externo. |
| `GET` | `/auctions` | Listagem de lotes. |
| `POST` | `/auctions` | Criação de lote por leiloeiro. |
| `GET` | `/wallet` | Consulta à carteira do usuário. |
| `POST` | `/wallet/deposit` | Depósito fictício de licitante. |
| `POST` | `/auctions/:id/bids` | Registro de lance. |
| `GET` | `/auctions/:id/bids` | Histórico público e verificação de integridade. |
| `GET` | `/auctions/:id/receipt` | Comprovante de liquidação para usuário autorizado. |

A API também disponibiliza uma rota de verificação de saúde (`/health`).

## Regras de negócio dos lances

1. O lote deve estar em período válido para receber lances.
2. O lance deve respeitar o preço inicial ou o valor vigente acrescido do incremento mínimo.
3. O usuário deve possuir saldo disponível suficiente para cobrir a oferta.
4. O valor do lance líder fica reservado na carteira; ao ser superado, a reserva anterior é liberada.
5. O licitante líder não pode cobrir o próprio lance.
6. O leiloeiro não pode disputar o próprio lote.
7. Um lance válido nos dois minutos finais prorroga o encerramento em aproximadamente dois minutos (*anti-sniping*).

As operações críticas são executadas em transações no PostgreSQL, com bloqueios de linhas para reduzir condições de corrida em lances simultâneos.

## Liquidação automática

Uma rotina periódica verifica lotes com prazo encerrado e inicia a liquidação:

- Determina o lance vencedor, quando existente.
- Efetiva o débito do vencedor e o crédito do leiloeiro.
- Registra a liquidação em `AuctionSettlement`.
- Marca o lote como finalizado.
- Permite repetição segura da operação (*idempotência*), apoiada também na unicidade de `AuctionSettlement.lotId`.
- Finaliza lotes sem lances sem criar um vencedor fictício.

A rotina de finalização é iniciada junto à API e foi testada com verificação periódica de aproximadamente 15 segundos. Em produção com múltiplas instâncias, a estratégia de execução e coordenação desse job deve ser revisada.

## Histórico auditável com SHA-256

Cada novo lance auditável armazena:

- `sequence`: ordem sequencial do lance dentro do lote;
- `previousHash`: hash do lance anterior, ou `GENESIS` no primeiro lance;
- `hash`: SHA-256 calculado a partir dos identificadores, valor, data e hash anterior.

O endpoint `GET /auctions/:id/bids` recalcula os hashes e verifica o encadeamento e a sequência, retornando um resumo com contagens de registros válidos, inválidos e não verificados, além do estado geral de integridade.

**Limitações:** a cadeia detecta alterações inconsistentes, mas não é uma prova imutável contra um administrador capaz de reescrever todo o histórico e recalcular os hashes. Uma âncora externa assinada ou registro append-only fortaleceria essa garantia. Registros antigos sem hash ou sequência podem aparecer como não verificados.

### Teste manual de integridade

A partir de `apps/api`:

```bash
npx tsx src/scripts/test-bid-integrity.ts ID_DO_LOTE
```

Resultado esperado para um lote com lance auditável:

```text
{
  originalValid: true,
  tamperedValid: false,
  tamperingDetected: true
}
```

Esse teste recalcula o hash com o valor original e com um valor simulado diferente. **Não altera o banco de dados** e não substitui um teste de integração do endpoint com dados efetivamente adulterados.

Outros scripts auxiliares disponíveis em `src/scripts/` incluem `test-db.ts`, `test-settlement.ts` e `create-auctioneer.ts`. Há também um teste de lances concorrentes em `scripts/test-concurrent-bids.cjs`, na raiz do monorepositório.

## Datas e fusos horários

Os horários são tratados como instantes absolutos no backend. Para hashes, a data é normalizada com `toISOString()` (UTC). A interface web deverá apresentar os horários ao usuário com `Intl.DateTimeFormat`, usando `timeZone: "America/Sao_Paulo"` quando a experiência desejada for o horário de Brasília.

Não converta nem sobrescreva os timestamps persistidos apenas para exibição: isso poderia introduzir inconsistências nas regras de encerramento e na verificação dos hashes.

## Integração com catálogo externo

O módulo `catalog` consulta produtos de uma API pública (DummyJSON, conforme a implementação atual) para apoiar a criação de lotes. O backend mantém dados relevantes do produto no lote para que a experiência não dependa exclusivamente da disponibilidade da API externa após a criação.

A resiliência completa a falhas da API externa deve ser validada antes da entrega final.

## Estado do projeto

**Implementado e testado manualmente:** autenticação, perfis, criação e listagem de lotes, carteira fictícia, lances concorrentes, reserva/liberação de saldo, anti-sniping, liquidação, comprovantes e histórico auditável.

**Ainda a concluir ou validar:** interface Next.js completa, atualização em tempo real para os usuários, testes automatizados de integração, deploy público, configuração de produção e documentação final da solução.

## Segurança e observações de produção

- Nunca versionar senhas, tokens JWT ou URLs de banco contendo credenciais.
- Usar segredo JWT forte e configuração segura de CORS.
- Validar entradas e tratar erros sem revelar dados sensíveis.
- Revisar a execução do job de liquidação em ambientes com múltiplas réplicas.
- Criar testes de integração para concorrência, falhas transacionais e autorização.

---

Documentação do backend do desafio técnico **EliteLance**. 