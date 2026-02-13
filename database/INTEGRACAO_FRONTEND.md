# 🔗 Integração Frontend React + Backend PostgreSQL

## 📋 Visão Geral

Guia completo para integrar seu frontend React com o backend PostgreSQL.

---

## 🏗️ Arquitetura

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  React Frontend │ ───> │  API REST       │ ───> │  PostgreSQL     │
│  (Port 5173)    │ HTTP │  (Port 3001)    │ SQL  │  (Port 5432)    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

---

## 🚀 Setup Rápido

### 1. Backend (API)

```bash
# Criar pasta para API
mkdir api
cd api

# Inicializar projeto Node.js
npm init -y

# Instalar dependências
npm install express pg cors dotenv bcrypt jsonwebtoken

# Copiar arquivo de exemplo
cp ../database/example_api.js server.js

# Criar .env
cat > .env << EOF
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=container_flow
DATABASE_USER=postgres
DATABASE_PASSWORD=sua_senha
JWT_SECRET=seu_secret_aqui
PORT=3001
EOF

# Iniciar servidor
node server.js
```

### 2. Frontend (React)

```bash
# No diretório do projeto React
cd ..

# Instalar axios para requisições HTTP
npm install axios

# Criar serviço de API
mkdir src/services
```

---

## 📁 Estrutura de Arquivos

```
projeto/
├── api/                          # Backend
│   ├── server.js                 # Servidor Express
│   ├── .env                      # Variáveis de ambiente
│   ├── package.json
│   └── routes/
│       ├── containers.js
│       ├── processos.js
│       └── auth.js
│
├── database/                     # Scripts SQL
│   ├── schema.sql
│   ├── seed.sql
│   └── ...
│
└── src/                          # Frontend React
    ├── services/
    │   ├── api.ts                # Cliente HTTP
    │   ├── containerService.ts   # Serviço de containers
    │   └── authService.ts        # Serviço de autenticação
    ├── contexts/
    │   └── ContainerContext.tsx  # Atualizar para usar API real
    └── ...
```

---

## 🔧 Configuração do Frontend

### 1. Criar Cliente HTTP (`src/services/api.ts`)

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado, redirecionar para login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 2. Criar Serviço de Containers (`src/services/containerService.ts`)

```typescript
import api from './api';

export interface Container {
  id: number;
  codigo: string;
  numero_serie?: string;
  tipo_container_id: number;
  tipo_container?: string;
  cliente_id: number;
  cliente?: string;
  status: string;
  condicao: string;
  localizacao?: string;
  data_entrada: string;
  observacoes?: string;
}

export const containerService = {
  // Listar todos os containers
  async getAll(): Promise<Container[]> {
    const response = await api.get('/api/containers');
    return response.data.data;
  },

  // Buscar container por ID
  async getById(id: number): Promise<Container> {
    const response = await api.get(`/api/containers/${id}`);
    return response.data.data;
  },

  // Criar novo container
  async create(container: Partial<Container>): Promise<Container> {
    const response = await api.post('/api/containers', container);
    return response.data.data;
  },

  // Atualizar container
  async update(id: number, container: Partial<Container>): Promise<Container> {
    const response = await api.put(`/api/containers/${id}`, container);
    return response.data.data;
  },

  // Remover container
  async delete(id: number): Promise<void> {
    await api.delete(`/api/containers/${id}`);
  },

  // Atualizar localização no grid
  async updateLocation(id: number, location: string): Promise<Container> {
    const response = await api.put(`/api/containers/${id}`, {
      localizacao: location,
    });
    return response.data.data;
  },
};

export default containerService;
```

### 3. Atualizar Context (`src/contexts/ContainerContext.tsx`)

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import containerService, { Container } from '@/services/containerService';

interface ContainerContextType {
  containers: Container[];
  loading: boolean;
  error: string | null;
  addContainer: (container: Partial<Container>) => Promise<void>;
  updateContainer: (id: number, container: Partial<Container>) => Promise<void>;
  deleteContainer: (id: number) => Promise<void>;
  refreshContainers: () => Promise<void>;
}

const ContainerContext = createContext<ContainerContextType | undefined>(undefined);

export function ContainerProvider({ children }: { children: React.ReactNode }) {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar containers ao montar
  useEffect(() => {
    refreshContainers();
  }, []);

  const refreshContainers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await containerService.getAll();
      setContainers(data);
    } catch (err) {
      setError('Erro ao carregar containers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addContainer = async (container: Partial<Container>) => {
    try {
      const newContainer = await containerService.create(container);
      setContainers([...containers, newContainer]);
    } catch (err) {
      setError('Erro ao adicionar container');
      throw err;
    }
  };

  const updateContainer = async (id: number, container: Partial<Container>) => {
    try {
      const updated = await containerService.update(id, container);
      setContainers(containers.map(c => c.id === id ? updated : c));
    } catch (err) {
      setError('Erro ao atualizar container');
      throw err;
    }
  };

  const deleteContainer = async (id: number) => {
    try {
      await containerService.delete(id);
      setContainers(containers.filter(c => c.id !== id));
    } catch (err) {
      setError('Erro ao remover container');
      throw err;
    }
  };

  return (
    <ContainerContext.Provider
      value={{
        containers,
        loading,
        error,
        addContainer,
        updateContainer,
        deleteContainer,
        refreshContainers,
      }}
    >
      {children}
    </ContainerContext.Provider>
  );
}

export function useContainers() {
  const context = useContext(ContainerContext);
  if (!context) {
    throw new Error('useContainers must be used within ContainerProvider');
  }
  return context;
}
```

### 4. Atualizar Componente (`src/pages/ContainerList.tsx`)

```typescript
import { useContainers } from '@/contexts/ContainerContext';
import { Loader2 } from 'lucide-react';

export default function ContainerList() {
  const { containers, loading, error, deleteContainer } = useContainers();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando containers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 rounded p-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Containers ({containers.length})</h1>
      {/* Seu código de listagem aqui */}
    </div>
  );
}
```

### 5. Configurar Variáveis de Ambiente

```bash
# .env.local (na raiz do projeto React)
VITE_API_URL=http://localhost:3001
```

---

## 🔐 Autenticação JWT

### Backend (`api/routes/auth.js`)

```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Buscar usuário
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE username = $1 AND ativo = true',
      [username]
    );
    
    if (result.rowCount === 0) {
      return res.status(401).json({
        success: false,
        error: 'Usuário ou senha inválidos'
      });
    }
    
    const user = result.rows[0];
    
    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Usuário ou senha inválidos'
      });
    }
    
    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        nome_completo: user.nome_completo,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer login'
    });
  }
});

module.exports = router;
```

### Frontend (`src/services/authService.ts`)

```typescript
import api from './api';

export interface User {
  id: number;
  username: string;
  nome_completo: string;
  role: string;
}

export const authService = {
  async login(username: string, password: string): Promise<User> {
    const response = await api.post('/api/auth/login', {
      username,
      password,
    });
    
    const { token, user } = response.data;
    
    // Salvar token
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },
};
```

---

## 🧪 Testando a Integração

### 1. Iniciar PostgreSQL
```bash
# Verificar se está rodando
psql -U postgres -c "SELECT version();"
```

### 2. Iniciar Backend
```bash
cd api
node server.js
# Deve exibir: 🚀 API Container Flow iniciada!
```

### 3. Testar API
```bash
# Health check
curl http://localhost:3001/health

# Listar containers
curl http://localhost:3001/api/containers
```

### 4. Iniciar Frontend
```bash
cd ..
npm run dev
# Acessar: http://localhost:5173
```

---

## 📊 Fluxo de Dados

```
1. Usuário interage com UI (React)
   ↓
2. Componente chama função do Context
   ↓
3. Context chama serviço (containerService)
   ↓
4. Serviço faz requisição HTTP (axios)
   ↓
5. API recebe requisição (Express)
   ↓
6. API consulta banco (PostgreSQL)
   ↓
7. Banco retorna dados
   ↓
8. API retorna JSON
   ↓
9. Serviço processa resposta
   ↓
10. Context atualiza estado
    ↓
11. React re-renderiza UI
```

---

## 🔄 Migração de Mock para API Real

### Antes (Mock)
```typescript
const [containers, setContainers] = useState(mockContainers);
```

### Depois (API Real)
```typescript
const [containers, setContainers] = useState<Container[]>([]);

useEffect(() => {
  containerService.getAll().then(setContainers);
}, []);
```

---

## 🚀 Deploy

### Backend (API)

**Opções:**
- Heroku
- Railway
- Render
- DigitalOcean App Platform
- AWS Elastic Beanstalk

### Frontend (React)

**Opções:**
- Vercel (recomendado)
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

### Banco de Dados

**Opções:**
- AWS RDS PostgreSQL
- DigitalOcean Managed Database
- Heroku Postgres
- Supabase (PostgreSQL + API automática!)

---

## 💡 Dica: Usar Supabase

Supabase é PostgreSQL + API REST automática + Auth + Storage!

```bash
# 1. Criar conta: https://supabase.com
# 2. Criar projeto
# 3. Executar schema.sql no SQL Editor
# 4. Usar client Supabase no frontend

npm install @supabase/supabase-js
```

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://seu-projeto.supabase.co',
  'sua-chave-publica'
);

// Listar containers
const { data, error } = await supabase
  .from('containers')
  .select('*, tipos_container(*), clientes(*)');
```

**Vantagens:**
- ✅ API REST automática
- ✅ Autenticação pronta
- ✅ Realtime subscriptions
- ✅ Storage de arquivos
- ✅ Free tier generoso

---

## ✅ Checklist de Integração

- [ ] PostgreSQL instalado e rodando
- [ ] Schema e seed executados
- [ ] API backend criada
- [ ] Serviços frontend criados
- [ ] Context atualizado para usar API
- [ ] Variáveis de ambiente configuradas
- [ ] Testes de integração
- [ ] Tratamento de erros
- [ ] Loading states
- [ ] Autenticação implementada
- [ ] Deploy configurado

---

**Pronto para integrar!** 🎉
