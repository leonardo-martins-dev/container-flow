# Container Flow - Backend API

API local Node.js + Express conectada ao SQL Server (Floca / BancoTAM).

## Pré-requisitos

- Node.js 18+
- SQL Server com banco BancoTAM restaurado (use `.\setup-sqlserver.ps1 start` e `restore` na raiz do projeto)
- Tabelas do schema `container_flow` criadas (use `.\setup-database.ps1` na raiz do projeto)

## Configuração

Copie `.env.example` para `.env` e ajuste se necessário:

```
DB_SERVER=localhost,1433
DB_NAME=BancoTAM
DB_USER=sa
DB_PASSWORD=YourStrong@Passw0rd
PORT=3001
```

## Instalação e execução

```bash
npm install
npm start
```

A API ficará disponível em `http://localhost:3001`.

## Endpoints

- `GET /api/health` - saúde da API
- `GET /api/propostas` - lista de pedidos (containers) do Floca
- `GET /api/patrimonios/disponiveis` - patrimônios disponíveis
- `GET /api/cronograma/macro` - cronograma macro (7 linhas, dias)
- `GET /api/cronograma/diario?date=YYYY-MM-DD` - cronograma diário por funcionário
- `POST /api/cronograma/gerar` - gera e persiste cronograma
- `GET /api/regras/validar` - valida sincronização das regras de sequenciamento
- `GET /api/regras` - lista regras
- `PUT /api/regras` - salva regras (com sincronização bidirecional)

## Frontend

Configure `VITE_API_URL=http://localhost:3001` no `.env` do frontend (ou use o padrão já definido em `src/lib/api.ts`).
