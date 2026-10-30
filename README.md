# EliteLance 🏷️

**Plataforma de leilões online** desenvolvida para o desafio técnico **Elite Dev — Verzel**. A aplicação permite criar lotes a partir de produtos de um catálogo externo, disputar leilões com lances, acompanhar uma carteira fictícia e auditoria pública do histórico.

## Acesse e experimente

- **Aplicação em produção:** https://elite-lance.vercel.app
- **API:** https://elitelance-api.onrender.com
- **Código-fonte:** https://github.com/elanealencar/elitelance

### Contas de demonstração

| Perfil | E-mail |
| --- | --- |
| Leiloeiro | `auctioneer@elitelance.demo` |
| Licitante 1 | `bidder1@elitelance.demo` |
| Licitante 2 | `bidder2@elitelance.demo` |

**Senha de demonstração:** PASSWORD_DEMO

### Roteiro rápido de avaliação

1. Explore os leilões e filtre por status na página inicial.
2. Entre como **Licitante 1**, abra um lote ativo e registre um lance.
3. Entre como **Licitante 2** em outra sessão e supere a oferta; acompanhe a atualização do lance e da carteira.
4. Confira a auditoria pública na página do lote, inclusive sem estar autenticado.
5. Para lotes encerrados, consulte o resultado, os arremates e o comprovante do vencedor.
6. Entre como **Leiloeiro** para consultar os lotes e criar um novo usando o catálogo de produtos.

<p align="center">
  <img src="docs/images/inicial.png" alt="Página inicial" width="390">
  <img src="docs/images/vitrine.png" alt="Vitrine de leilões" width="390">
</p>

## Funcionalidades

**Leiloeiro: (`AUCTIONEER`)** consulta produtos de um catálogo externo, cria lotes com preço inicial, incremento mínimo e período de disputa, acompanha os lotes e consulta os resultados.

**Licitante: (`BIDDER`):** pesquisa e filtra leilões, acompanha detalhes e contagem regressiva, registra lances, consulta carteira fictícia e histórico de participações, visualiza arremates e acessa o comprovante quando vencedor.

<p align="center">
  <img src="docs/images/sala-leilao.png"
       alt="Sala de leilão do EliteLance"
       width="500">
</p>

<p align="center">
  <img src="docs/images/carteira.png"
       alt="Carteira digital do licitante"
       width="390">
  <img src="docs/images/comprovante.png"
       alt="Comprovante de arremate"
       width="390">
</p>

**Regras de negócio:**

**1. Elegibilidade do lote e dos participantes.** O lance só é aceito quando o lote está ativo e dentro do período de disputa. Um licitante não pode cobrir seu próprio lance líder, e o leiloeiro não pode disputar o próprio lote. As permissões são verificadas no backend, não apenas pela interface.

**2. Preço inicial e incremento mínimo.** O primeiro lance deve ser igual ou superior ao preço inicial do lote. A partir do segundo, a oferta precisa atingir o valor do lance líder **mais o incremento mínimo**. Exemplo: se o lance líder é R$ 120 e o incremento é R$ 10, a próxima oferta válida começa em R$ 130.

**3. Carteira e reserva de saldo.** A aplicação usa uma carteira **fictícia**. O saldo disponível corresponde ao saldo total menos o valor reservado. Ao assumir a liderança, o licitante tem o valor da oferta reservado; quando outro licitante o supera, sua reserva é liberada. Isso evita que o mesmo saldo disponível seja comprometido simultaneamente em ofertas incompatíveis.

**4. Concorrência entre lances.** O processamento ocorre em transações PostgreSQL, com bloqueio de linhas (`SELECT ... FOR UPDATE`) para serializar ofertas concorrentes no mesmo lote e reduzir inconsistências entre liderança, histórico e reservas. As carteiras envolvidas são bloqueadas em ordem determinística.

**5. Prorrogação automática (*anti-sniping*).** Um lance válido aceito nos **últimos dois minutos** acrescenta **exatamente dois minutos ao horário de encerramento vigente**. Exemplo: se o encerramento estava previsto para 15h00 e um lance válido é registrado às 14h59, o novo encerramento passa para 15h02. Um novo lance dentro da janela final pode provocar outra prorrogação.

**6. Encerramento e liquidação.** Uma rotina periódica processa lotes encerrados. Havendo vencedor, o valor arrematado é debitado da carteira do licitante e creditado ao leiloeiro, com registro da liquidação. Lotes sem lances são encerrados sem vencedor. A liquidação é **idempotente**, para evitar débitos ou créditos duplicados caso o processamento seja repetido.

**7. Comprovante de arremate.** Após a conclusão aplicável do leilão, o vencedor pode consultar o comprovante do resultado. A consulta segue as regras de autorização da API.

**8. Auditoria pública dos lances.** Cada lance integra uma sequência com `previousHash` e `hash` SHA-256, formando uma cadeia por lote. A consulta pública verifica a continuidade da sequência e a consistência dos hashes, permitindo identificar alterações incompatíveis com os registros encadeados.

<p align="center">
  <img src="docs/images/auditoria.png"
       alt="Auditoria de lances"
       width="500">
</p>


## Tecnologias e arquitetura

| Camada | Tecnologias |
| --- | --- |
| Interface | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| API | Node.js, Express 5, TypeScript, Zod |
| Persistência | PostgreSQL, Prisma ORM 7 |
| Segurança | JWT, bcrypt, SHA-256 |
| Deploy | Vercel (web), Render (API), Neon (banco de produção) |

```text
elitelance/
├── apps/
│   ├── web/           # Interface Next.js e rotas internas de integração
│   └── api/           # API Express, Prisma e regras de negócio
├── package.json      # npm Workspaces
└── README.md
```

O frontend utiliza rotas internas do Next.js para se comunicar com a API. O backend concentra validações, autenticação, autorização, regras de lances, operações da carteira e liquidação. Os módulos da API organizam controllers, services e rotas por responsabilidade.

### Segurança e autorização

- O cadastro público valida `name`, `email` e `password` com **Zod** e rejeita campos inesperados; a role é definida no servidor como **`BIDDER`**.
- As senhas são armazenadas com hash **bcrypt**, não em texto puro.
- O login emite JWT assinado com **HS256**; o middleware verifica assinatura e validade do token.
- A cada requisição autenticada, o backend consulta o usuário no banco e obtém sua role atual.
- O middleware de autorização permite restringir endpoints por perfil (`AUCTIONEER` ou `BIDDER`).

### Persistência e decisões técnicas

Valores monetários são representados em **centavos com `BigInt`**, evitando cálculos financeiros com ponto flutuante. As operações críticas de lances e reservas são coordenadas em transações no PostgreSQL. A liquidação mantém um registro próprio para prevenir processamento duplicado. A integração com o catálogo externo (**DummyJSON**) fica no backend; dados necessários dos produtos são persistidos nos lotes criados.

Para endpoints, modelos Prisma e scripts auxiliares, consulte o [README da API](apps/api/README.md).

## Executar localmente

Requisitos: Node.js, npm e PostgreSQL com um banco `elitelance` criado.

```bash
# Na raiz do projeto
npm install
```

Crie `apps/api/.env` e configure as variáveis necessárias:

```dotenv
PORT=3333
FRONTEND_URL=http://localhost:3000
DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/elitelance?schema=public"
JWT_SECRET="SUBSTITUA_POR_UMA_CHAVE_SEGURA"
JWT_EXPIRES_IN="1h"
AUCTIONEER_EMAIL="auctioneer@elitelance.demo"
AUCTIONEER_PASSWORD="SENHA_LOCAL_DO_LEILOEIRO"
DEMO_PASSWORD="SENHA_LOCAL_DAS_CONTAS_DEMO"
```

Crie `apps/web/.env.local`:

```dotenv
API_URL=http://localhost:3333
NEXT_PUBLIC_API_URL=http://localhost:3333
```

```bash
# Preparar banco e dados de demonstração
cd apps/api
npx prisma migrate deploy
npx prisma generate
npm run db:seed
cd ../..

# Executar em dois terminais, a partir da raiz
npm run dev:api
npm run dev:web
```

Acesse `http://localhost:3000` (web) e `http://localhost:3333/health` (API). Para compilar: `npm run build:api` e `npm run build:web`.

Para detalhes de endpoints, modelo de dados e scripts, consulte o [README da API](apps/api/README.md).

## Testes e decisões técnicas

Os seguintes fluxos foram **verificados manualmente** durante o desenvolvimento:

- Cadastro/login e uso de perfis de demonstração.
- Criação de lotes e disputa com dois licitantes.
- Regras de preço mínimo, reserva e liberação de saldo.
- Lances concorrentes e prorrogação automática nos minutos finais.
- Encerramento, liquidação sem duplicidade e comprovante do vencedor.
- Auditoria pública: alteração manual de valor no banco detectada como inconsistência; restauração do valor retornou a indicação de integridade.

**Validação:** os principais fluxos de negócio foram verificados manualmente, incluindo concorrência entre licitantes, reserva e liberação de saldo, anti-sniping, liquidação idempotente e auditoria de integridade.

### Testes automatizados

O backend possui 7 testes automatizados utilizando
Vitest + Supertest, cobrindo:

- Disponibilidade da API por meio do endpoint de health check.
- Proteção de rotas contra acessos sem autenticação.
- Rejeição de tokens JWT inválidos.
- Validação de dados de entrada no login.
- Controle de acesso baseado em perfis (RBAC).
- Restrição de criação de lotes a leiloeiros.
- Restrição de registro de lances a licitantes.

Para executar os testes:

```bash
npm run test --workspace=api
```

Os testes de autorização utilizam mocks do Prisma, evitando alterações nos dados do banco de produção.

## Uso de inteligência artificial

Durante o desenvolvimento do EliteLance, utilizei ferramentas de Inteligência Artificial como apoio ao processo de desenvolvimento, principalmente o **ChatGPT Pro** e, pontualmente, o **GitHub Copilot** integrado ao VS Code.

**Como utilizei:**

- **Arquitetura e planejamento:** discussão de alternativas técnicas, organização das funcionalidades e análise das regras de negócio.
- **Desenvolvimento:** apoio na implementação de funcionalidades, sugestões de código e investigação de erros.
- **Revisão técnica:** análise de autenticação, autorização por perfis, regras de lances, transações e tratamento de erros.
- **Testes:** apoio na elaboração de cenários e implementação de testes automatizados com Vitest e Supertest.
- **Documentação:** organização e revisão dos READMEs e das instruções de execução.

**Revisão e validação das soluções**

As sugestões geradas por IA foram analisadas e adaptadas ao contexto da aplicação. As decisões de implementação, a integração entre os componentes e a validação do funcionamento ficaram sob minha responsabilidade.

Realizei testes manuais dos principais fluxos, incluindo lances concorrentes, reserva e liberação de saldo, liquidação e auditoria de integridade. Também executei uma suíte de sete testes automatizados para verificar autenticação, validação de entrada e autorização por perfil.

A IA foi utilizada como ferramenta de apoio ao aprendizado, à análise de problemas e à produtividade, sem substituir a revisão e a validação técnica das soluções.

---

### Desenvolvido por

**Elane Alencar** — Desenvolvedora Full Stack

[LinkedIn](https://linkedin.com/in/elanealencar)
[E-mail](mailto:dev.elanealencar@gmail.com)