# Template API TS

Template de API RESTful em **Node.js + Express + TypeScript** (ES Modules), com persistência em **PostgreSQL** via **Sequelize** e documentação interativa com **Swagger**. Traz um CRUD completo de usuários como ponto de partida para novos projetos.

## Sumário

- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Como baixar e instalar](#como-baixar-e-instalar)
- [Como usar a API](#como-usar-a-api)
- [Referência](#referência)
- [Como expandir o projeto](#como-expandir-o-projeto)
- [Problemas comuns](#problemas-comuns)

## Tecnologias

| Pacote             | Função                                    |
| ------------------ | ----------------------------------------- |
| Express 5          | Servidor HTTP e rotas                     |
| TypeScript         | Tipagem estática (modo `strict`)          |
| Sequelize + pg     | ORM e driver do PostgreSQL                |
| sequelize-cli      | Execução das migrations                   |
| swagger-ui-express | Documentação interativa em `/api-docs`    |
| cors / dotenv      | CORS e variáveis de ambiente              |
| tsx                | Execução do TypeScript em desenvolvimento |
| ESLint + Prettier  | Análise estática e formatação padronizada |

## Arquitetura

Cada requisição percorre as camadas abaixo, e cada uma tem uma única responsabilidade:

```
Requisição HTTP
   │
   ▼
routes/       Define a URL e o método HTTP e aponta para o controller
   │
   ▼
controllers/  Lê req.params e req.body, chama o service e monta a resposta (status + JSON)
   │
   ▼
services/     Regras de negócio, validações e operações no banco
   │
   ▼
models/       Mapeamento da tabela com o Sequelize
   │
   ▼
PostgreSQL
```

Quando algo dá errado (dado inválido, registro inexistente), o **service** lança um `AppError` com o status HTTP adequado (400, 404...). O **controller** captura o erro e o transforma na resposta com a função `tratarErro`. Qualquer outro erro inesperado vira **500**.

A aplicação é dividida em dois arquivos de entrada:

- **`src/app.ts`**: cria o Express e registra middlewares, Swagger e rotas.
- **`src/server.ts`**: testa a conexão com o banco e inicia o servidor HTTP.

## Pré-requisitos

- [Node.js](https://nodejs.org/) 22 ou superior
- [pnpm](https://pnpm.io/): `npm install -g pnpm` (o `npm` também funciona; veja a [tabela de scripts](#scripts))
- [PostgreSQL](https://www.postgresql.org/download/) instalado e em execução
- [Git](https://git-scm.com/)

## Como baixar e instalar

### 1. Baixar o projeto

```bash
git clone https://github.com/<seu-usuario>/template-api-ts.git
cd template-api-ts
```

Também é possível usar o botão **Code → Download ZIP** do GitHub, extrair o arquivo e abrir o terminal dentro da pasta.

### 2. Instalar as dependências

```bash
pnpm install
```

### 3. Criar o arquivo `.env`

O `.env` guarda as credenciais e não é enviado ao GitHub. Crie-o a partir do modelo:

```bash
cp .env.example .env
```

No Windows (PowerShell): `Copy-Item .env.example .env`

Abra o `.env` e ajuste `DB_USER` e `DB_PASSWORD` com o usuário e a senha do seu PostgreSQL.

### 4. Criar o banco e a tabela

```bash
pnpm db:setup
```

Esse comando executa duas etapas, que também podem ser rodadas separadamente:

| Etapa | Comando           | O que faz                                                                      |
| ----- | ----------------- | ------------------------------------------------------------------------------ |
| 1     | `pnpm db:create`  | Cria o banco definido em `DB_NAME` (`src/scripts/createDatabase.ts`)           |
| 2     | `pnpm db:migrate` | Cria a tabela `usuarios` (`src/migrations/20261003000000-create-usuarios.cjs`) |

O `db:create` pode ser executado mais de uma vez: se o banco já existir, ele apenas avisa e não altera nada.

> **Por que a criação do banco não é uma migration?** O sequelize-cli precisa se conectar ao banco para executar qualquer migration e registra as que já rodaram em uma tabela dentro dele (`SequelizeMeta`). Por isso, uma migration não consegue criar o próprio banco. O script `createDatabase.ts` contorna isso conectando-se ao banco padrão `postgres`.

### 5. Iniciar o servidor

```bash
pnpm dev
```

Saída esperada:

```
Conexão com o PostgreSQL estabelecida com sucesso.
Servidor rodando em http://localhost:3000/api
Swagger disponível em http://localhost:3000/api-docs
```

## Como usar a API

### Pelo Swagger

1. Acesse **http://localhost:3000/api-docs**.
2. Abra um endpoint (por exemplo, **POST /usuarios**) e clique em **Try it out**.
3. Edite o JSON de exemplo, se quiser, e clique em **Execute**.
4. A resposta real da API (status e corpo) aparece logo abaixo.

Uma sequência para testar todo o CRUD: **POST** cadastra → **GET /usuarios** lista → **GET /usuarios/{id}** busca → **PUT** atualiza → **DELETE** exclui.

### Por linha de comando (curl)

```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nome": "Ana Silva", "email": "ana.silva@email.com"}'

curl http://localhost:3000/api/usuarios
```

Extensões como Thunder Client, Postman ou Insomnia também funcionam.

## Referência

### Endpoints

Base: `http://localhost:3000/api`

| Método | Rota            | Descrição                             | Sucesso |
| ------ | --------------- | ------------------------------------- | ------- |
| GET    | `/health`       | Verifica se o servidor está no ar     | 200     |
| GET    | `/usuarios`     | Lista todos os usuários               | 200     |
| GET    | `/usuarios/:id` | Busca um usuário pelo ID              | 200     |
| POST   | `/usuarios`     | Cadastra um usuário                   | 201     |
| PUT    | `/usuarios/:id` | Atualiza todos os dados de um usuário | 200     |
| DELETE | `/usuarios/:id` | Exclui um usuário                     | 200     |

Os erros seguem o formato `{ "erro": "mensagem" }`:

- **400**: dados ou ID inválidos, ou e-mail já cadastrado.
- **404**: usuário não encontrado.
- **500**: falha inesperada; a resposta traz também o campo `detalhe`.

### Corpo da requisição (POST e PUT)

```json
{
  "nome": "Ana Silva",
  "email": "ana.silva@email.com",
  "telefone": "(11) 98765-4321",
  "dataNascimento": "2000-05-15",
  "ativo": true
}
```

| Campo            | Tipo    | Obrigatório | Regra                                      |
| ---------------- | ------- | ----------- | ------------------------------------------ |
| `nome`           | string  | sim         | até 100 caracteres                         |
| `email`          | string  | sim         | e-mail válido e único, salvo em minúsculas |
| `telefone`       | string  | não         | até 20 caracteres                          |
| `dataNascimento` | string  | não         | data real no formato `AAAA-MM-DD`          |
| `ativo`          | boolean | não         | padrão `true`                              |

O **PUT** substitui o registro inteiro: campos opcionais não enviados voltam ao valor padrão.

### Variáveis de ambiente

| Variável      | Descrição                                                        | Padrão         |
| ------------- | ---------------------------------------------------------------- | -------------- |
| `PORT`        | Porta do servidor HTTP                                           | `3000`         |
| `DB_HOST`     | Endereço do PostgreSQL                                           | `localhost`    |
| `DB_PORT`     | Porta do PostgreSQL                                              | `5432`         |
| `DB_NAME`     | Nome do banco de dados                                           | `template_api` |
| `DB_USER`     | Usuário do banco                                                 | `postgres`     |
| `DB_PASSWORD` | Senha do banco                                                   | `postgres`     |
| `DB_SSL`      | `true` para bancos em nuvem que exigem SSL, `false` para o local | `false`        |

### Scripts

| pnpm                   | npm                       | Descrição                                        |
| ---------------------- | ------------------------- | ------------------------------------------------ |
| `pnpm dev`             | `npm run dev`             | Servidor em desenvolvimento (reinicia ao salvar) |
| `pnpm build`           | `npm run build`           | Compila o TypeScript para `dist/`                |
| `pnpm start`           | `npm start`               | Executa a versão compilada                       |
| `pnpm type-check`      | `npm run type-check`      | Verifica os tipos sem gerar arquivos             |
| `pnpm lint`            | `npm run lint`            | Analisa o código com o ESLint                    |
| `pnpm lint:fix`        | `npm run lint:fix`        | Corrige automaticamente o que o ESLint puder     |
| `pnpm format`          | `npm run format`          | Formata o projeto com o Prettier                 |
| `pnpm format:check`    | `npm run format:check`    | Verifica a formatação sem alterar arquivos       |
| `pnpm db:create`       | `npm run db:create`       | Cria o banco de dados                            |
| `pnpm db:migrate`      | `npm run db:migrate`      | Executa as migrations pendentes                  |
| `pnpm db:migrate:undo` | `npm run db:migrate:undo` | Desfaz todas as migrations                       |
| `pnpm db:setup`        | `npm run db:setup`        | Cria o banco e executa as migrations             |

### Estrutura de pastas

```
template-api-ts/
├── src/
│   ├── config/
│   │   ├── config.cjs           Conexão usada pelo sequelize-cli (migrations)
│   │   ├── database.ts          Conexão usada pela aplicação, com SSL condicional
│   │   └── swagger.json         Especificação OpenAPI exibida no Swagger
│   ├── controllers/
│   │   └── UsuarioController.ts Recebe req/res e chama o service
│   ├── errors/
│   │   ├── AppError.ts          Erro com status HTTP, lançado pelos services
│   │   └── tratarErro.ts        Converte erros em respostas HTTP
│   ├── migrations/
│   │   └── 20261003000000-create-usuarios.cjs
│   ├── models/
│   │   └── Usuario.ts           Interface e mapeamento da tabela usuarios
│   ├── routes/
│   │   ├── index.ts             Registra os recursos sob o prefixo /api
│   │   └── usuarioRoutes.ts
│   ├── scripts/
│   │   └── createDatabase.ts    Cria o banco de dados (pnpm db:create)
│   ├── services/
│   │   └── UsuarioService.ts    Regras de negócio e acesso ao banco
│   ├── app.ts                   Configuração do Express
│   └── server.ts                Conexão com o banco e início do servidor
├── .env.example
├── .sequelizerc                 Caminhos usados pelo sequelize-cli
├── eslint.config.js
├── .prettierrc
├── package.json
└── tsconfig.json
```

### Sobre ES Modules

O projeto usa ES Modules (`"type": "module"` no `package.json`), com `import`/`export` em todo o código. Há duas particularidades:

- **Imports de arquivos locais usam a extensão `.js`**, mesmo que o arquivo seja `.ts`. Exemplo: `import { app } from './app.js'`. Essa é a regra do Node.js para ES Modules, e o TypeScript resolve o caminho para o arquivo `.ts` automaticamente.
- **`config.cjs` e as migrations usam a extensão `.cjs`**, porque o sequelize-cli só lê arquivos CommonJS (`require`/`module.exports`).

## Como expandir o projeto

### Criar um novo recurso (exemplo: `Produto`)

Use os arquivos de usuário como modelo e siga a ordem das camadas:

1. **Migration**: copie `src/migrations/20261003000000-create-usuarios.cjs` com um timestamp maior no nome (ex.: `20261010000000-create-produtos.cjs`) e ajuste a tabela e as colunas. Se preferir gerar o arquivo com `pnpm sequelize-cli migration:generate --name create-produtos`, **renomeie a extensão gerada de `.js` para `.cjs`**; caso contrário, o `db:migrate` falha com `module is not defined in ES module scope`.
2. **Model**: crie `src/models/Produto.ts` com a interface `ProdutoAttributes`, o tipo de criação e o `Produto.init(...)`.
3. **Service**: crie `src/services/ProdutoService.ts` com as regras de negócio e as consultas ao banco, lançando `AppError` nos casos de erro.
4. **Controller**: crie `src/controllers/ProdutoController.ts`, que só chama o service e responde com `res.status(...).json(...)`.
5. **Rotas**: crie `src/routes/produtoRoutes.ts` e registre-o em `src/routes/index.ts` com `router.use('/produtos', produtoRoutes)`.
6. **Swagger**: documente os novos endpoints em `src/config/swagger.json`.
7. Execute `pnpm db:migrate` e teste pelo Swagger.

### Usar como template no GitHub

Em **Settings** do repositório, marque **Template repository**. A partir daí, o botão **Use this template** cria novos repositórios com esta estrutura. Em cada novo projeto, altere o `name` no `package.json`, o `DB_NAME` no `.env.example` e o `info.title` no `swagger.json`.

### Banco na nuvem

Para usar um PostgreSQL gerenciado (como o Supabase), preencha o `.env` com os dados fornecidos pelo serviço e defina `DB_SSL=true`. Nesse caso, o banco já vem criado: rode apenas `pnpm db:migrate`.

## Problemas comuns

| Mensagem                                             | Causa e solução                                                        |
| ---------------------------------------------------- | ---------------------------------------------------------------------- |
| `connect ECONNREFUSED 127.0.0.1:5432`                | O PostgreSQL não está em execução. Inicie o serviço e tente novamente. |
| `password authentication failed for user "postgres"` | Usuário ou senha incorretos no `.env`.                                 |
| `database "template_api" does not exist`             | O banco não foi criado. Rode `pnpm db:create`.                         |
| `relation "usuarios" does not exist`                 | A migration não foi executada. Rode `pnpm db:migrate`.                 |
| `module is not defined in ES module scope`           | Uma migration está com extensão `.js`. Renomeie para `.cjs`.           |
| `EADDRINUSE: address already in use :::3000`         | A porta já está em uso. Altere `PORT` no `.env`.                       |
