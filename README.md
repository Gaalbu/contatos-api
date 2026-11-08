# API de contatos

API REST em Node.js, Express e TypeScript para gerenciar contatos em MySQL.

## Requisitos

- Node.js 22 ou superior
- MySQL 8.0.16 ou superior, ou Docker

## Configuração

```bash
npm ci
cp .env.example .env
```

### MySQL com Docker

Os valores do `.env.example` já correspondem ao contêiner:

```bash
docker compose up -d --wait
```

### MySQL instalado na máquina

Crie o banco e o usuário e ajuste o `.env` se usar outros valores:

```sql
CREATE DATABASE contatos CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'contatos'@'%' IDENTIFIED BY 'contatos_dev';
GRANT ALL PRIVILEGES ON contatos.* TO 'contatos'@'%';
```

Para rodar os testes de integração, crie também o banco de testes:

```sql
CREATE DATABASE contatos_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
GRANT ALL PRIVILEGES ON contatos_test.* TO 'contatos'@'%';
```

## Execução

```bash
npm run db:migrate
npm run dev
```

A API fica em `http://localhost:3000`. Para rodar a versão compilada:
`npm run build && npm start`.

## Testes

| Comando                    | O que verifica                         | Precisa de MySQL |
| -------------------------- | -------------------------------------- | ---------------- |
| `npm run test:unit`        | Validação e rotas com banco em memória | Não              |
| `npm run test:integration` | Repositório e migrações no MySQL       | Sim              |
| `npm run test:coverage`    | Todos os testes, com cobertura         | Sim              |
| `npm run gate`             | Tipos, lint, formatação, testes, build | Sim              |

## Rotas

| Método   | Rota            | Corpo                    | Sucesso                  |
| -------- | --------------- | ------------------------ | ------------------------ |
| `POST`   | `/contatos`     | `{ "nome", "telefone" }` | 201 e o contato criado   |
| `GET`    | `/contatos`     |                          | 200 e a lista            |
| `PATCH`  | `/contatos/:id` | um ou os dois campos     | 200 e o contato alterado |
| `DELETE` | `/contatos/:id` |                          | 204, sem corpo           |

Erros de validação devolvem 400 neste formato:

```json
{
  "mensagem": "Dados inválidos",
  "erros": [{ "campo": "nome", "mensagem": "Cada palavra deve ter ao menos 3 letras" }]
}
```

## Regras de validação

- **Nome:** ao menos duas palavras, cada uma com ao menos 3 letras. Aceita acentos, hífen e apóstrofo entre letras. Máximo de 120 caracteres.
- **Telefone:** brasileiro, com DDD existente, com ou sem máscara e `+55`. Celular com 9 na frente ou fixo iniciado de 2 a 5.

## Decisões sobre o enunciado

- `DELETE` devolve 204 sem corpo, porque uma resposta 204 não pode ter mensagem.
- `João da Silva` é rejeitado, porque a regra exige 3 letras em cada palavra e "da" tem 2.
- O telefone é armazenado e devolvido só com dígitos, para haver uma única representação do dado.
- `/contatos/id` foi lido como `/contatos/:id`, já que o enunciado descreve `id` como parâmetro.
- O `id` do `PATCH` identifica o contato a atualizar; "a ser excluído" foi tratado como erro de cópia.
- O `.env` fica fora do Git por conter credenciais; o `.env.example` traz o modelo.
