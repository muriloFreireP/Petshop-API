# Patas & Cia — API REST de petshop

Stack: Node.js + Express, Postgres (Neon), front-end em HTML/CSS/JS puro, deploy na Vercel.

## Entidades
- **tutores** (donos) 1—N **pets**
- **servicos** (banho, tosa, consulta...)
- **agendamentos** ligam um pet a um serviço em uma data/hora

## Endpoints
Para `tutores`, `pets`, `servicos` e `agendamentos`:

| Método | Rota                  | Ação              |
|--------|-----------------------|-------------------|
| GET    | /api/{entidade}       | Lista             |
| GET    | /api/{entidade}/:id   | Busca um          |
| POST   | /api/{entidade}       | Cria              |
| PUT    | /api/{entidade}/:id   | Atualiza          |
| DELETE | /api/{entidade}/:id   | Remove            |

Extras: `GET /api/health` e `GET /api/tutores/:id/pets`.

## Rodar localmente
1. `npm install`
2. Copie `.env.example` para `.env` e cole a connection string do Neon
3. Rode o conteúdo de `schema.sql` no SQL Editor do Neon
4. `npm run dev` e abra http://localhost:3000
