# Guia de CI/CD — Template API TS

## Visão geral

Este guia adiciona CI/CD ao Template API TS: verificações automáticas antes de cada commit e a cada push, mais a API e o PostgreSQL rodando em containers Docker. Como o template é a base de futuras APIs, o mesmo passo a passo serve para qualquer API TypeScript com PostgreSQL feita a partir dele.

**CI (Integração Contínua)** significa que toda alteração enviada ao repositório passa por verificações automáticas (lint, formatação, tipos e build), para que um erro apareça logo depois de enviado.

**CD (Entrega Contínua)** significa manter a aplicação sempre pronta para ser entregue. Aqui, isso se resume a empacotar a API em uma imagem Docker; não há deploy automático em servidor.

&#91;embedded content: caminho de uma alteração · Husky, GitHub Actions e Docker\]

As duas primeiras colunas formam a esteira de CI: o Husky verifica no commit e o GitHub Actions verifica de novo no push. A coluna do Docker é independente: você a executa quando quiser rodar a API em containers.

### O que cada ferramenta faz

| Ferramenta | O que faz | Quando roda |
| --- | --- | --- |
| ESLint | Procura erros e más práticas no código | `pnpm lint`, no pre-commit e no CI |
| Prettier | Padroniza a formatação de todos os arquivos do projeto | `pnpm format` e `pnpm format:check` |
| TypeScript (`tsc`) | Confere os tipos e compila o código para JavaScript | `pnpm type-check` e `pnpm build` |
| Husky | Executa comandos automaticamente antes de cada commit | A cada `git commit` na sua máquina |
| Docker | Empacota a API em uma imagem que roda igual em qualquer máquina | `docker build` |
| Docker Compose | Sobe a API e o PostgreSQL juntos, com um comando | `docker compose up` |
| GitHub Actions | Um computador do GitHub que repete as verificações a cada push | A cada `git push` |

### Requisitos e onde cada um é feito

| Requisito | Etapa | Arquivos |
| --- | --- | --- |
| ESLint e Prettier com scripts `lint` e `format` | 2 | `eslint.config.js`, `.prettierrc`, `package.json` |
| Tipos com `tsc --noEmit` e script `build` | 3 | `tsconfig.json`, `package.json` |
| Husky com pasta `.husky/` e hook de pre-commit | 4 | `.husky/pre-commit`, `package.json` |
| Dockerfile otimizado e `.dockerignore` | 5 | `Dockerfile`, `.dockerignore` |
| Docker Compose com API, PostgreSQL, volume e variáveis | 6 | `docker-compose.yml` |
| Workflow disparado no push com checkout, Node/pnpm, instalação, lint, tipos e build | 7 | `.github/workflows/ci.yml` |

As Etapas 2 e 3 já vêm prontas no template: nelas, você só confere e testa. A seção "Adaptando para outro projeto", perto do fim, lista o que trocar quando o template virar uma API nova.

## Pré-requisitos

Você precisa de quatro programas instalados, de uma conta no GitHub e do Template API TS rodando na sua máquina.

| Programa | Para que serve aqui | Como conferir no terminal |
| --- | --- | --- |
| Git | Versionar o código e enviar ao GitHub (o Husky depende dele) | `git --version` |
| Node.js 22 ou superior | Rodar o projeto | `node -v` |
| pnpm 11 | Instalar as dependências | `pnpm -v` |
| Docker Desktop | Etapas 5 e 6 | `docker --version` e `docker compose version` |

- **Use o pnpm 11** na sua máquina, no Dockerfile e no GitHub Actions. Se o `pnpm -v` mostrar outra versão, instale com `npm install -g pnpm@11`.
- **Abra o Docker Desktop antes de usar qualquer comando `docker`.** No Windows, ele roda sobre o WSL 2, que o instalador configura.
- **Ponto de partida:** o template funcionando localmente, conforme o README dele:

```bash
pnpm install
cp .env.example .env
pnpm db:setup
pnpm dev
```

Todos os comandos do guia são executados na raiz do projeto, a pasta onde está o `package.json`.

## Etapa 1 — Repositório Git e GitHub

Se você criou o projeto pelo botão **Use this template** do GitHub, o repositório já existe: pule para a Etapa 2. Se baixou o template como `.zip`, siga os passos abaixo, porque o Husky só funciona dentro de um repositório Git e o GitHub Actions só roda em repositórios do GitHub.

**1. Confira o `.gitignore`.** Ele já vem no template e impede que arquivos gerados e credenciais sejam versionados:

```
node_modules
dist
.env
.pnpm-store
```

**2. Se for a primeira vez que você usa o Git nesta máquina, informe seu nome e e-mail:**

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

**3. Crie o repositório local e faça o primeiro commit:**

```bash
git init -b main
git add .
git commit -m "chore: projeto inicial a partir do Template API TS"
```

**4. Crie o repositório no GitHub.** Acesse github.com, clique em **New repository**, dê um nome (por exemplo, `minha-api`) e **não marque** as opções de README, .gitignore ou licença, porque o template já tem esses arquivos. Clique em **Create repository**.

**5. Conecte o repositório local ao GitHub e envie o código:**

```bash
git remote add origin https://github.com/<seu-usuario>/minha-api.git
git push -u origin main
```

**Como saber se deu certo:** os arquivos aparecem na página do repositório no GitHub, e o arquivo `.env` **não** aparece entre eles.

## Etapa 2 — ESLint e Prettier

O template já traz o ESLint e o Prettier configurados, então nesta etapa você só confere e testa. A diferença em relação a projetos mais simples é que aqui o Prettier verifica **o projeto inteiro**, inclusive os arquivos `.yml` que você vai criar nas Etapas 6 e 7.

| Arquivo | O que define |
| --- | --- |
| `eslint.config.js` | As regras do ESLint, incluindo a que proíbe `any` |
| `.prettierrc` | O estilo do Prettier: aspas simples, ponto e vírgula, 80 colunas |
| `.prettierignore` | O que o Prettier ignora (`node_modules`, `dist`, `pnpm-lock.yaml`) |

Os scripts já estão no `package.json`:

```json
"lint": "eslint .",
"lint:fix": "eslint . --fix",
"format": "prettier --write .",
"format:check": "prettier --check .",
```

| Comando | O que faz | Quando usar |
| --- | --- | --- |
| `pnpm lint` | Analisa o código e lista os problemas, sem alterar nada | Sempre que quiser conferir o código |
| `pnpm lint:fix` | Corrige automaticamente o que o ESLint consegue | Quando o lint apontar erros |
| `pnpm format` | Reformata todos os arquivos do projeto | Depois de criar ou editar arquivos |
| `pnpm format:check` | Só verifica; falha se algum arquivo estiver fora do padrão | No Husky e no GitHub Actions |

**Teste os comandos:**

```bash
pnpm lint
pnpm format:check
```

**Como saber se deu certo:** o `pnpm lint` termina sem listar erros, e o `pnpm format:check` mostra `All matched files use Prettier code style!`.

**Regra prática para o resto do guia:** sempre que criar um arquivo novo, rode `pnpm format` antes do commit. Assim, o Prettier ajusta a formatação (por exemplo, troca aspas duplas por simples no `docker-compose.yml`) e o Husky não bloqueia o commit.

## Etapa 3 — Checagem de tipos e build

Os dois scripts também já existem. Os dois usam o `tsc`, o compilador do TypeScript, com propósitos diferentes:

```json
"build": "tsc",
"type-check": "tsc --noEmit",
"start": "node dist/server.js",
```

| Comando | O que faz | Onde é usado |
| --- | --- | --- |
| `pnpm type-check` | Confere os tipos sem gerar arquivos (`--noEmit` = "não emitir") | Husky e GitHub Actions |
| `pnpm build` | Compila `src/` (TypeScript) para `dist/` (JavaScript, que o Node executa) | GitHub Actions e Dockerfile |
| `pnpm start` | Roda a versão compilada em `dist/` | O container executa o mesmo comando |

**Teste:**

```bash
pnpm type-check
pnpm build
```

**Como saber se deu certo:** o `type-check` termina sem erros, e o `build` cria a pasta `dist/` com `app.js`, `server.js` e as subpastas de `src/`, inclusive `dist/config/swagger.json`. A pasta `dist/` está no `.gitignore` e não vai para o repositório.

**Sobre ES Modules:** o template usa `"type": "module"` no `package.json`. É por isso que os arquivos em `dist/` rodam como ES Modules e que o `package.json` precisa ser copiado para dentro da imagem Docker na Etapa 5. Sem ele, o Node não saberia que os arquivos `.js` usam `import`/`export`.

## Etapa 4 — Husky (hook de pre-commit)

O Husky faz o Git rodar o lint, a checagem de formatação e a de tipos antes de cada commit. Se qualquer um falhar, o commit é cancelado e nada é gravado no histórico.

**1. Instale o Husky como dependência de desenvolvimento:**

```bash
pnpm add -D husky
```

**2. Inicialize o Husky:**

```bash
pnpm exec husky init
```

Esse comando faz duas coisas:

- Cria a pasta `.husky/` com o arquivo `pre-commit`, o script que roda antes de cada commit.
- Adiciona `"prepare": "husky"` aos scripts do `package.json`. O `prepare` roda a cada `pnpm install`, então quem clonar o repositório já recebe o hook ativado.

**3. Edite o arquivo `.husky/pre-commit`.** O `init` cria esse arquivo com a linha `pnpm test`, mas o template não tem script de teste. Substitua todo o conteúdo por:

```sh
pnpm lint
pnpm format:check
pnpm type-check
```

Os comandos rodam em ordem, e o primeiro que falhar interrompe o commit.

**4. Teste se o hook bloqueia um commit com problema.** Abra `src/server.ts` e coloque dois espaços antes do ponto e vírgula desta linha:

```ts
const PORT = Number(process.env.PORT ?? 3000)  ;
```

Depois tente fazer o commit:

```bash
git add .
git commit -m "teste do husky"
```

O resultado esperado é o Prettier acusar o arquivo e o Husky cancelar o commit:

```
[warn] src/server.ts
[warn] Code style issues found in the above file. Run Prettier with --write to fix.
husky - pre-commit script failed (code 1)
```

Corrija com `pnpm format`, que remove os espaços extras.

**5. Faça o commit da configuração:**

```bash
git add .
git commit -m "ci: configura husky com hook de pre-commit"
```

**Como saber se deu certo:** antes de o commit ser criado, o terminal mostra a execução do `eslint`, do `prettier --check` e do `tsc --noEmit`. A pasta `.husky/_`, criada pelo próprio Husky, já é ignorada pelo Git; só o `.husky/pre-commit` vai para o repositório, junto com o `package.json` e o `pnpm-lock.yaml` atualizados.

## Etapa 5 — Dockerfile e .dockerignore

O Dockerfile é a receita da imagem da API. Ele usa duas etapas (multi-stage): a primeira instala tudo e compila o TypeScript; a segunda começa do zero e leva só o necessário para rodar. Assim, a imagem final não carrega TypeScript, ESLint nem o código-fonte.

**1. Mova o `sequelize-cli` para as dependências de produção:**

```bash
pnpm remove sequelize-cli
pnpm add sequelize-cli
```

O container vai rodar as migrations ao iniciar, para criar as tabelas. Como a imagem final instala só as `dependencies`, o `sequelize-cli` precisa estar entre elas.

O script `pnpm db:create` do template **não** é usado no Docker: quem cria o banco ali é a própria imagem do PostgreSQL, a partir da variável `POSTGRES_DB` (Etapa 6). Ele continua útil para rodar o projeto fora do Docker.

**2. Crie o arquivo `Dockerfile`** (sem extensão) na raiz do projeto:

```dockerfile
# ============================================================
# Etapa 1 - build: instala tudo e compila o TypeScript
# ============================================================
FROM node:24-alpine AS build

WORKDIR /app

# Instala o pnpm (mesma versão usada no projeto)
RUN npm install -g pnpm@11

# Copia primeiro só os arquivos de dependências.
# Se eles não mudarem, o Docker reaproveita esta etapa do cache.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copia o restante do código e gera a pasta dist/
COPY . .
RUN pnpm build

# ============================================================
# Etapa 2 - produção: só o necessário para rodar a API
# ============================================================
FROM node:24-alpine

WORKDIR /app

RUN npm install -g pnpm@11

# Instala apenas as dependências de produção (sem TypeScript, ESLint etc.)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copia da etapa 1 o código já compilado
COPY --from=build /app/dist ./dist

# Copia os arquivos usados pelas migrations (sequelize-cli)
COPY .sequelizerc ./
COPY src/config/config.cjs ./src/config/config.cjs
COPY src/migrations ./src/migrations

EXPOSE 3000

# Ao iniciar o container: cria as tabelas e sobe a API
CMD ["sh", "-c", "pnpm db:migrate && node dist/server.js"]
```

| Instrução | O que faz |
| --- | --- |
| `FROM node:24-alpine AS build` | Parte de uma imagem pequena (Alpine Linux) com o Node 24 e chama essa etapa de `build` |
| `WORKDIR /app` | Define a pasta de trabalho dentro do container |
| `RUN npm install -g pnpm@11` | Instala o pnpm 11. Sem o `@11`, viria a versão mais recente, hoje a 12 |
| `COPY` + `RUN pnpm install` | Copia os arquivos de dependências antes do código, para aproveitar o cache do Docker |
| `--frozen-lockfile` | Instala exatamente as versões do `pnpm-lock.yaml` e falha se ele estiver desatualizado |
| `--prod` | Instala só as `dependencies`, sem as `devDependencies` |
| `COPY --from=build` | Traz para a imagem final apenas a pasta `dist/` gerada na etapa 1 |
| `COPY .sequelizerc` e seguintes | As migrations são arquivos `.cjs` que o `tsc` não copia para `dist/`, então vão à parte |
| `CMD` | Comando executado quando o container inicia |

O `package.json` copiado na etapa 2 também leva o `"type": "module"`, que faz o Node rodar `dist/server.js` como ES Module.

**3. Crie o arquivo `.dockerignore`** na raiz. O que estiver listado nele não é enviado ao Docker durante o build:

```
# Dependências e build: são gerados dentro do container
node_modules
dist

# Git, CI e hooks: não fazem parte da aplicação
.git
.github
.husky

# Variáveis de ambiente locais (credenciais)
.env

# Logs e arquivos temporários
*.log
tmp
```

O `.env` nunca deve entrar na imagem, porque qualquer pessoa com acesso a ela leria as senhas. No container, as variáveis vêm do Docker Compose.

**4. Construa a imagem para testar o Dockerfile:**

```bash
docker build -t template-api-ts .
```

O ponto final indica que o Dockerfile está na pasta atual. O primeiro build demora alguns minutos; os seguintes são mais rápidos por causa do cache.

**Como saber se deu certo:** o build termina sem `ERROR`, e `docker images` lista a imagem `template-api-ts`. Ainda não rode o container sozinho: ele precisa do banco, que entra na Etapa 6.

**5. Formate e faça o commit:**

```bash
pnpm format
git add .
git commit -m "ci: adiciona Dockerfile e .dockerignore"
```

## Etapa 6 — Docker Compose

O `docker-compose.yml` descreve os dois serviços, a API e o PostgreSQL. Com um único comando, o Docker sobe o banco, espera ele ficar pronto, cria as tabelas e inicia a API em `http://localhost:3000`.

**1. Crie o arquivo `docker-compose.yml`** na raiz do projeto:

```yaml
services:
  # Banco de dados PostgreSQL
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: template_api
    volumes:
      # Guarda os dados do banco fora do container (persistência)
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      # Verifica se o banco já aceita conexões
      test: ['CMD-SHELL', 'pg_isready -U postgres -d template_api']
      interval: 5s
      timeout: 5s
      retries: 5

  # API (construída a partir do Dockerfile)
  api:
    build: .
    ports:
      - '3000:3000'
    environment:
      PORT: 3000
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: template_api
      DB_USER: postgres
      DB_PASSWORD: postgres
      DB_SSL: 'false'
    depends_on:
      db:
        # Só inicia a API depois que o banco estiver pronto
        condition: service_healthy

volumes:
  pgdata:
```

| Trecho | O que faz |
| --- | --- |
| `image: postgres:16-alpine` | Usa a imagem oficial do PostgreSQL 16 |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Criam o usuário, a senha e o banco na primeira vez que o container sobe; por isso o `db:create` não é necessário aqui |
| `volumes: pgdata:...` | Grava os dados em um volume do Docker, fora do container; eles continuam lá mesmo que o container seja removido |
| `healthcheck` | Testa a cada 5 segundos se o banco aceita conexões |
| `build: .` | Constrói a imagem da API com o Dockerfile da pasta atual |
| `ports: '3000:3000'` | Liga a porta 3000 do seu computador à porta 3000 do container |
| `environment` da API | Substitui o `.env`: são as variáveis que a API lê dentro do container |
| `DB_HOST: db` | Dentro do Compose, um serviço encontra o outro pelo nome. `localhost` apontaria para o próprio container da API |
| `depends_on` + `service_healthy` | Faz a API esperar o banco ficar pronto, porque ela roda as migrations ao iniciar |

Os valores de `DB_NAME`, `DB_USER` e `DB_PASSWORD` da API precisam ser iguais aos `POSTGRES_*` do banco. As aspas simples seguem o padrão do Prettier do template; com aspas duplas, o `format:check` falharia.

**2. Suba os serviços.** Antes, pare o `pnpm dev` se ele estiver rodando, porque ele também usa a porta 3000.

```bash
docker compose up --build
```

O `--build` reconstrói a imagem da API com o código atual. Os logs aparecem no terminal; para parar, use **Ctrl+C**.

**Como saber se deu certo:** nos logs, aparece a migration e depois as mensagens da API:

```
api-1  | == 20261003000000-create-usuarios: migrated (0.012s)
api-1  | Conexão com o PostgreSQL estabelecida com sucesso.
api-1  | Servidor rodando em http://localhost:3000/api
api-1  | Swagger disponível em http://localhost:3000/api-docs
```

Abra `http://localhost:3000/api-docs` e teste o CRUD de usuários pelo Swagger.

| Comando | O que faz |
| --- | --- |
| `docker compose up --build` | Constrói a API e sobe tudo, mostrando os logs |
| `docker compose up --build -d` | O mesmo, em segundo plano (libera o terminal) |
| `docker compose ps` | Lista os serviços e o status de cada um |
| `docker compose logs api` | Mostra os logs da API |
| `docker compose down` | Para e remove os containers; os dados do banco são mantidos |
| `docker compose down -v` | Também apaga o volume, ou seja, zera o banco |

O banco do Compose não expõe porta para o seu computador, então ele não conflita com o PostgreSQL que você usa no `pnpm dev`.

**3. Formate e faça o commit:**

```bash
pnpm format
git add .
git commit -m "ci: adiciona docker-compose com API e PostgreSQL"
```

## Etapa 7 — GitHub Actions

A cada `git push`, o GitHub liga uma máquina Linux, baixa o seu código e roda as mesmas verificações do Husky, mais o build. O resultado aparece no repositório com um ícone verde (passou) ou vermelho (falhou).

O Husky roda só na sua máquina e pode ser desativado. O GitHub Actions é a verificação oficial: roda num ambiente limpo e fica visível para todos.

**1. Crie as pastas `.github/workflows/`** na raiz do projeto. Os nomes precisam ser exatamente esses, com o ponto no início de `.github`.

**2. Crie o arquivo `.github/workflows/ci.yml`:**

```yaml
# Nome que aparece na aba Actions do GitHub
name: CI

# Quando rodar: a cada push, em qualquer branch
on: push

jobs:
  validar:
    name: Lint, tipos e build
    # Máquina virtual Linux fornecida pelo GitHub
    runs-on: ubuntu-latest

    steps:
      - name: Baixar o código do repositório
        uses: actions/checkout@v7

      - name: Instalar o pnpm
        uses: pnpm/action-setup@v6
        with:
          version: 11

      - name: Instalar o Node.js
        uses: actions/setup-node@v7
        with:
          node-version: 24

      - name: Instalar as dependências
        run: pnpm install --frozen-lockfile

      - name: Verificar o código (ESLint)
        run: pnpm lint

      - name: Verificar a formatação (Prettier)
        run: pnpm format:check

      - name: Verificar os tipos (tsc --noEmit)
        run: pnpm type-check

      - name: Compilar o projeto (build)
        run: pnpm build
```

| Trecho | O que significa |
| --- | --- |
| `on: push` | Dispara o workflow a cada push, em qualquer branch |
| `jobs` / `validar` | Um job é um conjunto de passos que roda numa máquina; aqui há um só |
| `runs-on: ubuntu-latest` | A máquina usada: Ubuntu Linux, fornecida de graça pelo GitHub |
| `steps` | Os passos, executados em ordem; se um falhar, os seguintes não rodam |
| `uses:` | Usa uma ação pronta, publicada por outra pessoa ou empresa |
| `run:` | Executa um comando no terminal da máquina |
| `actions/checkout` | Baixa o código do repositório para a máquina |
| `pnpm/action-setup` | Instala o pnpm na versão indicada; precisa vir antes do Node |
| `actions/setup-node` | Instala o Node.js na versão indicada |
| `--frozen-lockfile` | Instala exatamente o que está no `pnpm-lock.yaml` |

Como o Prettier do template também verifica este arquivo, ele já está escrito no formato esperado.

**3. Formate, faça o commit e envie para o GitHub:**

```bash
pnpm format
git add .
git commit -m "ci: adiciona workflow do GitHub Actions"
git push
```

**4. Acompanhe a execução.** No repositório do GitHub, abra a aba **Actions**. Clique na execução mais recente e depois no job **Lint, tipos e build** para ver cada passo. Um passo que falhou aparece com um X vermelho; clique nele para ler o erro.

**Como saber se deu certo:** todos os passos ficam com o ícone verde, e a lista de commits mostra um ✓ verde ao lado do último commit. A partir de agora, todo push dispara o workflow automaticamente.

## Adaptando para outro projeto

Quase nada do CI/CD depende do assunto da API. Quando o template virar um projeto novo (uma loja, uma agenda, um hub de eventos), em geral só mudam os valores do banco e, às vezes, a porta.

| O que mudou no projeto | O que ajustar |
| --- | --- |
| Nome do banco (`DB_NAME` no `.env.example`) | No `docker-compose.yml`: `POSTGRES_DB`, o `-d` do `pg_isready` e o `DB_NAME` da API |
| Usuário ou senha do banco | `POSTGRES_USER` e `POSTGRES_PASSWORD`, `DB_USER` e `DB_PASSWORD`, e o `-U` do `pg_isready` |
| Porta da API (`PORT`) | `PORT` e `ports` no Compose (`'PORTA:PORTA'`) e `EXPOSE` no Dockerfile |
| Nova variável de ambiente (ex.: `JWT_SECRET`) | Adicionar no `environment` da API no Compose, além do `.env.example` |
| Novas tabelas (migrations) | Nada: o Dockerfile copia a pasta `src/migrations` inteira e o container roda todas ao iniciar |
| Novos models, services, controllers e rotas | Nada: tudo é compilado para `dist/` no build |
| Nova dependência instalada com `pnpm add` | Nada no Dockerfile; só commitar o `pnpm-lock.yaml` junto |
| Versão do Node ou do pnpm | As duas linhas `FROM` e as duas `npm install -g pnpm@` do Dockerfile, e `version` e `node-version` no workflow |

**Se a API não veio do template**, confira três pontos antes de copiar os arquivos deste guia:

1. O `package.json` tem os scripts `lint`, `format:check`, `type-check`, `build` e `db:migrate` com esses nomes, porque o Husky, o workflow e o Dockerfile chamam exatamente esses comandos.
2. O build gera o ponto de entrada em `dist/server.js`, que é o arquivo que o `CMD` do Dockerfile executa.
3. As migrations ficam em `src/migrations` e a configuração do sequelize-cli em `src/config/config.cjs` e `.sequelizerc`. Se estiverem em outro lugar, ajuste os três `COPY` correspondentes no Dockerfile.

## Checklist final de entrega

Marque cada item depois de conferir. Juntos, eles cobrem todos os requisitos.

- [ ] `pnpm lint` e `pnpm format:check` passam sem erros
- [ ] `pnpm type-check` e `pnpm build` passam sem erros
- [ ] A pasta `.husky/` com o arquivo `pre-commit` está no repositório
- [ ] Um commit com erro de formatação é bloqueado pelo Husky
- [ ] `Dockerfile` e `.dockerignore` estão na raiz, e `docker build -t template-api-ts .` termina sem erros
- [ ] `docker compose up --build` sobe a API e o banco, e o Swagger abre em `http://localhost:3000/api-docs`
- [ ] Depois de `docker compose down` e de subir de novo, os usuários cadastrados continuam lá (volume funcionando)
- [ ] A aba Actions do GitHub mostra o workflow **CI** com todos os passos em verde

Estrutura esperada ao final (só os arquivos desta atividade e os principais do template):

```
template-api-ts/
├── .github/
│   └── workflows/
│       └── ci.yml
├── .husky/
│   └── pre-commit
├── src/
│   ├── config/
│   ├── controllers/
│   ├── migrations/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── app.ts
│   └── server.ts
├── .dockerignore
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── eslint.config.js
├── package.json
├── pnpm-lock.yaml
└── tsconfig.json
```

Seguindo as etapas, o histórico do Git fica com um commit por parte:

1. `chore: projeto inicial a partir do Template API TS`
2. `ci: configura husky com hook de pre-commit`
3. `ci: adiciona Dockerfile e .dockerignore`
4. `ci: adiciona docker-compose com API e PostgreSQL`
5. `ci: adiciona workflow do GitHub Actions`

## Problemas comuns

| Sintoma | Causa | Solução |
| --- | --- | --- |
| Husky bloqueia o commit acusando `docker-compose.yml` ou `ci.yml` | O Prettier do template verifica arquivos YAML, e o arquivo está fora do padrão (por exemplo, com aspas duplas) | Rode `pnpm format` e repita o commit |
| Commit falha dizendo que o script `test` não existe | O `.husky/pre-commit` ainda tem a linha `pnpm test` criada pelo `init` | Substitua o conteúdo pelo da Etapa 4, passo 3 |
| O hook não roda ao fazer commit | O Husky foi instalado antes do `git init`, então o `prepare` não encontrou o repositório | Rode `pnpm install` de novo, depois do `git init` |
| `ERR_PNPM_OUTDATED_LOCKFILE` no Actions ou no `docker build` | O `pnpm-lock.yaml` está desatualizado ou não foi commitado | Rode `pnpm install` na sua máquina e faça commit do `pnpm-lock.yaml` |
| `Cannot connect to the Docker daemon` | O Docker Desktop está fechado | Abra o Docker Desktop e espere ele indicar que está rodando |
| `port is already allocated` na porta 3000 | O `pnpm dev` ou outro container já usa a porta | Pare o outro processo, ou troque para `'3001:3000'` e acesse `localhost:3001` |
| API para com `ENOTFOUND db` ou `ECONNREFUSED` | `DB_HOST` diferente de `db`, ou falta o `depends_on` | Confira o `environment` e o `depends_on` da API no Compose |
| API para com `database "..." does not exist` | O `DB_NAME` da API é diferente do `POSTGRES_DB` do banco | Deixe os dois iguais. Se o volume já tinha sido criado com outro nome, rode `docker compose down -v` |
| `relation "usuarios" does not exist` | As migrations não rodaram no container | Confira se o `sequelize-cli` está em `dependencies` (Etapa 5, passo 1) e suba com `--build` |
| Mudei o código, mas o container roda a versão antiga | A imagem não foi reconstruída | Use `docker compose up --build` |
| O banco não inicia ao trocar a imagem para `postgres:latest` | A partir do PostgreSQL 18, a imagem grava os dados em outro caminho e não aceita o volume em `/var/lib/postgresql/data` ([detalhes](https://github.com/docker-library/postgres/issues/1370)) | Mantenha `postgres:16-alpine`, como no guia |
