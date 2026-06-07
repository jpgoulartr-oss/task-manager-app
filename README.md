# TaskFlow

Gerenciador de tarefas com Kanban, autenticação e sincronização em tempo real.

---

## Passo a passo para rodar

### 1. Instale as dependências
Abra o terminal dentro da pasta `taskflow` e rode:
```
npm install
```

### 2. Configure o Supabase
Copie o arquivo de variáveis de ambiente:
```
cp .env.example .env
```

Depois abra o arquivo `.env` e preencha com seus dados:
- Acesse seu projeto no Supabase
- Vá em **Settings > API**
- Copie a **Project URL** → cole em `VITE_SUPABASE_URL`
- Copie a **anon public key** → cole em `VITE_SUPABASE_ANON_KEY`

### 3. Crie a tabela no Supabase
- No painel do Supabase, clique em **SQL Editor > New query**
- Cole todo o conteúdo do arquivo `supabase_setup.sql`
- Clique em **Run**

### 4. Rode o projeto
```
npm run dev
```

Acesse http://localhost:5173 no navegador.

---

## Deploy (publicar na internet)

### Vercel (gratuito)
1. Suba o projeto para o GitHub
2. Acesse vercel.com e conecte o repositório
3. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Clique em Deploy — pronto!

---

## Estrutura do projeto
```
src/
  hooks/
    useAuth.js     → lógica de login/logout/sessão
    useTasks.js    → CRUD de tarefas com Supabase
  lib/
    supabase.js    → conexão com o Supabase
  pages/
    AuthPage.jsx   → tela de login e cadastro
    BoardPage.jsx  → board principal (kanban + lista + filtros)
  components/
    TaskCard.jsx   → card individual do kanban
    TaskModal.jsx  → modal de criar/editar tarefa
  App.jsx          → componente raiz (decide o que mostrar)
  main.jsx         → ponto de entrada do React
```
