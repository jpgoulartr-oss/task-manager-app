-- Execute este SQL no Supabase > SQL Editor > New query

-- Tabela de tarefas
create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  title       text not null,
  status      text not null default 'todo' check (status in ('todo','doing','standby','done')),
  prio        text not null default 'mid'  check (prio in ('high','mid','low')),
  ctx         text not null default 'work' check (ctx in ('work','study','personal','home')),
  date        date,
  notes       text,
  done        boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Índice para buscar rápido as tarefas de um usuário
create index if not exists tasks_user_id_idx on tasks(user_id);

-- Row Level Security: cada usuário só vê e mexe nas próprias tarefas
alter table tasks enable row level security;

create policy "Usuário vê só suas tarefas"
  on tasks for select using (auth.uid() = user_id);

create policy "Usuário cria suas tarefas"
  on tasks for insert with check (auth.uid() = user_id);

create policy "Usuário edita suas tarefas"
  on tasks for update using (auth.uid() = user_id);

create policy "Usuário deleta suas tarefas"
  on tasks for delete using (auth.uid() = user_id);

-- Habilitar realtime (atualizações ao vivo)
alter publication supabase_realtime add table tasks;
