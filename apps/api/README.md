# EliteLance — API

API REST do **EliteLance**, plataforma de leilões desenvolvida para o desafio técnico Full Stack da Verzel. O backend gerencia autenticação, catálogo externo de produtos, lotes, carteira fictícia, lances concorrentes, liquidação e auditoria pública do histórico.

> Este documento descreve o backend. Para conhecer a aplicação completa, consulte também o README na raiz do monorepositório.

## Tecnologias

- **Node.js, TypeScript e Express 5** — API HTTP.
- **PostgreSQL** — persistência de dados.
- **Prisma ORM 7** com `@prisma/adapter-pg` — acesso ao banco e migrações.
- **JWT e bcrypt** — autenticação e armazenamento seguro de hashes de senha.
- **Zod** — validação de entradas.
- **tsx** — desenvolvimento e execução de scripts TypeScript.
- **SHA-256 (`node:crypto`)** — encadeamento de hashes do histórico de lances.

## Organização

```text
apps/api/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── generated/             # Prisma Client gerado
│   ├── jobs/                  # Finalização periódica de leilões
│   ├── lib/prisma.ts          # Conexão com PostgreSQL
│   ├── middlewares/           # Autenticação e autorização
│   ├── modules/
│   │   ├── auctions/          # Lotes, liquidação e comprovantes
│   │   ├── auth/              # Cadastro, login e perfil
│   │   ├── bids/              # Lances, hashes e auditoria
│   │   ├── catalog/           # Integração com catálogo externo
│   │   └── wallet/            # Carteira e depósitos fictícios
│   ├── scripts/               # Scripts auxiliares
│   ├── app.ts
│   └── server.ts
├── prisma.config.ts
└── package.json
```

Os módulos separam rotas, controllers e services; as regras de negócio ficam principalmente nos services.

## Pré-requisitos

- Node.js e npm compatíveis com o projeto.
- PostgreSQL em execução e banco de dados criado.

## Instalação e execução local

Na **raiz do monorepositório**:

```bash
npm install
```

Crie `apps/api/.env` com valores adequados ao seu ambiente:

```dotenv
PORT=3333
FRONTEND_URL=http://localhost:3000
DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/elitelance?schema=public"
JWT_SECRET="SUBSTITUA_POR_UMA_CHAVE_ALEATORIA_LONGA"
JWT_EXPIRES_IN="1h"
AUCTIONEER_EMAIL="leiloeiro@elitelance.com"
AUCTIONEER_PASSWORD="SUBSTITUA_PELA_SENHA_DESEJADA"
DEMO_PASSWORD="SUBSTITUA_PELA_SENHA_DE_DEMONSTRACAO"
```

> Não versione `.env`, senhas, tokens nem URLs com credenciais. Variáveis de criação de contas só são utilizadas quando os scripts correspondentes são executados; confira o script antes de rodá-lo.

A partir de `apps/api`:

```bash
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Alternativamente, na raiz do monorepositório, execute `npm run dev --workspace=api`.

A API local utiliza, por padrão, `http://localhost:3333`. Verifique a disponibilidade em `GET /health`.

Para compilar e executar a versão compilada, utilize os scripts do `apps/api/package.json`:

```bash
npm run build --workspace=api
npm run start --workspace=api
```

**Contas de demonstração:** o projeto prevê um leiloeiro e dois licitantes, preparados por seed. Consulte o script de seed e o README principal para os comandos exatos e as credenciais de demonstração. Não execute seed de demonstração no banco de produção sem conferir seus efeitos.

## Modelo de dados

| Modelo | Responsabilidade |
|---|---|
| `User` | Usuários com papéis `AUCTIONEER` e `BIDDER`. |
| `Wallet` | Saldo total e saldo reservado. |
| `AuctionLot` | Lote, preços, datas, status e leiloeiro. |
| `Bid` | Valor, licitante, sequência e hashes encadeados. |
| `AuctionSettlement` | Liquidação, vencedor e valor do arremate. |

Valores monetários são armazenados em **centavos**, com `BigInt`, e serializados como strings nas respostas JSON quando necessário.

Os lotes podem apresentar os status `DRAFT`, `SCHEDULED`, `ACTIVE`, `FINISHED` e `CANCELED`. Lotes cancelados não devem aparecer na vitrine pública.

## Autenticação e autorização

A aplicação utiliza contas de demonstração previamente cadastradas para permitir a avaliação dos diferentes perfis.

- **AUCTIONEER (leiloeiro):** responsável pela criação e gerenciamento dos lotes.
- **BIDDER (licitante):** pode participar dos leilões, registrar lances e utilizar a carteira fictícia.
- As senhas são armazenadas utilizando bcrypt.
- A autenticação utiliza JWT com algoritmo HS256.
- Os middlewares `authenticate` e `authorize` realizam a identificação do usuário e o controle de acesso por perfil.
- O usuário autenticado é disponibilizado em `res.locals.user`.
- As credenciais de demonstração são disponibilizadas no README principal.

O fluxo público de cadastro não é disponibilizado na interface de demonstração. Os usuários de teste são preparados previamente por meio do seed.

## Rotas principais

| Método | Rota | Finalidade |
|---|---|---|
| `POST` | `/auth/register` | Cadastro de usuário. |
| `POST` | `/auth/login` | Autenticação. |
| `GET` | `/auth/me` | Perfil autenticado. |
| `GET` | `/catalog/search?q=...` | Busca no catálogo externo. |
| `GET` | `/auctions` | Listagem de lotes. |
| `POST` | `/auctions` | Criação de lote. |
| `GET` | `/wallet` | Consulta à carteira. |
| `POST` | `/wallet/deposit` | Depósito fictício. |
| `POST` | `/auctions/:id/bids` | Registro de lance. |
| `GET` | `/auctions/:id/bids` | Histórico e auditoria pública. |
| `GET` | `/auctions/:id/receipt` | Consulta ao comprovante, conforme as regras de autorização. |
| `GET` | `/health` | Verificação de saúde da API. |

> Para parâmetros, payloads e outras rotas, consulte os arquivos `*.routes.ts` da implementação.

## Regras de lances e carteira

1. O lote precisa estar ativo e dentro do intervalo entre início e encerramento.
2. O primeiro lance deve atingir o preço inicial; os seguintes devem respeitar o maior lance acrescido do incremento mínimo.
3. O licitante deve possuir saldo disponível suficiente (`saldo total - saldo reservado`).
4. O valor do lance líder é reservado. Quando outro licitante assume a liderança, a reserva anterior é liberada.
5. O líder não pode cobrir o próprio lance.
6. O leiloeiro não pode disputar o próprio lote.
7. **Anti-sniping:** um lance válido nos últimos dois minutos acrescenta **exatamente dois minutos ao horário de encerramento vigente**. Novos lances nessa janela podem provocar novas prorrogações.

O registro de lance ocorre em transação PostgreSQL. A implementação utiliza `SELECT ... FOR UPDATE` para serializar ofertas concorrentes por lote e bloqueios de carteira em ordem determinística.

## Liquidação automática

Uma rotina periódica processa lotes cujo prazo terminou:

- Identifica o vencedor, se houver lances.
- Debita o valor arrematado da carteira do vencedor e credita o leiloeiro.
- Registra a liquidação e marca o lote como `FINISHED`.
- Trata lotes sem lances sem inventar um vencedor.
- Evita liquidações duplicadas por meio da lógica idempotente e da unicidade de `AuctionSettlement.lotId`.

A rotina foi observada em testes manuais com processamento periódico de aproximadamente 15 segundos. Para múltiplas instâncias em produção, a coordenação desse job merece revisão.

## Auditoria pública e integridade

Cada lance armazena:

- `sequence`: posição do lance na sequência do lote;
- `previousHash`: hash anterior, ou `GENESIS` no primeiro lance;
- `hash`: SHA-256 calculado sobre identificadores, valor, instante e hash anterior.

O histórico público recalcula os hashes e verifica a ligação entre registros e a continuidade das sequências. A resposta apresenta contagens de lances válidos, inválidos e não verificados, além de um estado geral de integridade.

**Validação manual realizada:** em banco local, a alteração do valor de um lance sem recalcular o hash fez a interface indicar **“Integridade comprometida”**; após restaurar o valor original, a auditoria voltou a indicar histórico íntegro. O acesso à auditoria também foi confirmado sem login.

**Limitações conhecidas:** uma cadeia SHA-256 armazenada somente no mesmo banco não impede que alguém com controle de escrita reescreva os registros e recalcule os hashes. A exclusão do último lance também pode não ser detectada se não houver uma âncora confiável independente. Testes de exclusão e inserção direta de lances não foram concluídos. Portanto, o mecanismo demonstra detecção de adulterações simples, mas não oferece garantia absoluta contra todas as alterações diretas no banco.

### Teste auxiliar de hash

A partir de `apps/api`:

```bash
npx tsx src/scripts/test-bid-integrity.ts ID_DO_LOTE
```

Saída esperada para um lance auditável:

```text
{
  originalValid: true,
  tamperedValid: false,
  tamperingDetected: true
}
```

Esse script simula uma mudança no valor **em memória**; não modifica o banco nem substitui um teste de integração. Outros scripts auxiliares podem ser encontrados em `src/scripts/`.

## Datas e fusos horários

O backend compara instantes de tempo para validar início, encerramento e prorrogações. Na geração dos hashes, `createdAt` é normalizado com `toISOString()` (UTC). A apresentação dos horários no frontend deve respeitar o fuso desejado, sem alterar os timestamps persistidos.

## Catálogo externo

O módulo de catálogo consulta uma API pública de produtos (**DummyJSON**) para auxiliar a criação de lotes. Dados relevantes do produto são armazenados no próprio lote, de modo que a vitrine e os lotes existentes não precisem consultar o catálogo externo a cada acesso.

A recuperação diante de indisponibilidade da API externa ainda precisa de validação específica.

## Testes e verificações

**Executados manualmente:** autenticação e perfis, lances de dois licitantes, reserva e liberação de saldo, prorrogações consecutivas de anti-sniping, encerramento automático, liquidação financeira, comprovante e auditoria pública com alteração e restauração de valor de lance.

### Testes automatizados

A API do EliteLance utiliza **Vitest + Supertest** para testes automatizados de integração HTTP, verificando o comportamento dos endpoints, validações e middlewares de segurança.

### Cenários implementados

| Categoria | Cenário | Resultado esperado |
|---|---|---|
| Health Check | Verificar disponibilidade da API | HTTP 200 |
| Autenticação | Acesso sem token JWT | HTTP 401 |
| Autenticação | Token JWT inválido | HTTP 401 |
| Validação | Login com e-mail inválido | HTTP 400 |
| Validação | Login sem senha | HTTP 400 |
| Autorização (RBAC) | BIDDER tenta criar um lote | HTTP 403 |
| Autorização (RBAC) | AUCTIONEER tenta registrar um lance | HTTP 403 |

**Total: 7 testes automatizados.**

### Executando os testes

Na raiz do monorepositório:

```bash
npm run test --workspace=api
```

Para executar em modo de desenvolvimento:

```bash
npm run test:watch --workspace=api
```

### Estratégia de testes

- **Vitest:** execução dos testes e validação dos resultados.
- **Supertest:** simulação de requisições HTTP à aplicação Express.
- **Mocks do Prisma:** simulação dos usuários nos testes de autorização, sem modificar registros no banco de dados.
- **JWT de teste:** utilização de uma chave fictícia, isolada da configuração de produção.

Os testes atuais cobrem autenticação, validação de entrada e controle de acesso. As regras financeiras, concorrência de lances e liquidação foram verificadas manualmente, mas ainda não possuem cobertura automatizada.

## Deploy

- **API:** https://elitelance-api.onrender.com
- **Health check:** https://elitelance-api.onrender.com/health
- **Frontend:** https://elite-lance.vercel.app
- **Código:** https://github.com/elanealencar/elitelance

O ambiente publicado utiliza Render para a API, Vercel para a interface e Neon/PostgreSQL para persistência. As variáveis de ambiente de produção são configuradas diretamente nos respectivos serviços, sem versionar segredos.

## Segurança e pontos de evolução

- Manter senhas, tokens e strings de conexão fora do Git.
- Usar JWT secret forte e CORS restrito ao frontend autorizado.
- Preservar as validações no servidor mesmo quando existirem validações no frontend.
- Coordenar o job de liquidação caso a API seja executada em múltiplas réplicas.
- Adicionar testes automatizados de concorrência, autorização, falhas transacionais e integridade.
- Para auditoria mais resistente a adulterações com acesso ao banco, considerar uma âncora assinada armazenada de forma independente ou um log imutável.

---

Documentação do backend do **EliteLance**, desenvolvido para o desafio técnico da Verzel.