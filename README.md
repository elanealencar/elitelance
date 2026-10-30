# EliteLance 🏷️

**Plataforma de leilões online** desenvolvida para o desafio técnico **Elite Dev — Verzel**. A aplicação permite criar lotes a partir de produtos de um catálogo externo, disputar leilões com lances, acompanhar uma carteira fictícia e consultar publicamente a integridade do histórico.

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

**Leiloeiro:** busca de produtos em API externa, criação de lotes com preços e horários, acompanhamento de leilões e resultados.

**Licitante:** listagem e filtros de leilões, detalhes e contagem regressiva, lances, carteira com saldo disponível e reservado, histórico de participações, arremates e comprovante.

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

- O primeiro lance respeita o preço inicial; os seguintes exigem o lance líder mais o incremento mínimo.
- Não é permitido cobrir o próprio lance líder nem ofertar no próprio lote.
- O lance líder reserva saldo; quando superado, a reserva anterior é liberada.
- Um lance aceito nos últimos dois minutos **acrescenta dois minutos ao encerramento vigente** (*anti-sniping*).
- Ao finalizar, a liquidação debita o vencedor, credita o leiloeiro e evita processamento duplicado.
- O histórico de lances é público e possui verificação de integridade por hashes encadeados SHA-256.


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

O frontend se comunica com a API por meio de rotas internas do Next.js. A API concentra autenticação, validações, transações financeiras simuladas, processamento dos lances e liquidação dos leilões.

## Executar localmente

Requisitos: Node.js, npm e PostgreSQL com um banco `elitelance` criado.

```bash
# Na raiz do projeto
npm install
```

Crie `apps/api/.env` com `PORT=3333`, `FRONTEND_URL=http://localhost:3000`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN=1h` e as variáveis de senha usadas pelo seed (`DEMO_PASSWORD`, `AUCTIONEER_PASSWORD`, se aplicáveis). Configure `apps/web/.env.local`:

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

Foram validados manualmente fluxos de autenticação, criação de lotes, lances, reserva e liberação de saldo, prorrogação anti-sniping, encerramento, liquidação e comprovantes. Na auditoria pública, uma alteração manual no valor de um lance no banco foi detectada; após restaurar o valor, o histórico voltou a ser apresentado como íntegro. A auditoria utiliza hashes encadeados SHA-256 para verificar a consistência do histórico de lances. A implementação detecta alterações inconsistentes nos registros.

**Escolhas técnicas:** valores monetários em centavos com `BigInt`; transações e bloqueios de linha no PostgreSQL para reduzir conflitos entre lances; liquidação idempotente; cadeia de hashes por lote para conferir a consistência do histórico.

**Segurança e autorização:** autenticação com JWT (HS256), senhas protegidas com bcrypt, validação de entradas com Zod e controle de acesso baseado em perfis (RBAC). O cadastro público cria exclusivamente usuários `BIDDER`, enquanto operações privilegiadas são protegidas por middlewares de autenticação e autorização.

**Validação:** os principais fluxos de negócio foram verificados manualmente, incluindo concorrência entre licitantes, reserva e liberação de saldo, anti-sniping, liquidação idempotente e auditoria de integridade.

## Uso de inteligência artificial

Ferramentas de IA foram usadas como apoio para explorar soluções, compreender conceitos, revisar trechos de código, investigar erros e estruturar a documentação. A implementação foi integrada e os fluxos descritos como testados foram verificados manualmente durante o desenvolvimento.

---

### Desenvolvido por

**Elane Alencar** — Desenvolvedora Full Stack

[LinkedIn](https://linkedin.com/in/elanealencar)
[E-mail](mailto:dev.elanealencar@gmail.com)