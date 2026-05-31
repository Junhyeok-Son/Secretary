-- Supabase SQL Editor에 붙여넣고 실행

create extension if not exists "uuid-ossp";

-- 일정 테이블
create table events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  location text,
  status text default 'confirmed' check (status in ('confirmed', 'tentative', 'cancelled')),
  recurrence_freq text check (recurrence_freq in ('daily', 'weekly', 'monthly', 'yearly')),
  recurrence_until timestamptz,
  google_event_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 지식 베이스 테이블
create table knowledge (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  source text default 'manual',
  tags text[] default '{}',
  created_at timestamptz default now()
);

-- 채팅 세션 테이블
create table chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- 채팅 메시지 테이블
create table chat_messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

-- updated_at 자동 갱신 트리거
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger events_updated_at
  before update on events
  for each row execute function update_updated_at();

-- RLS (Row Level Security) 활성화
alter table events enable row level security;
alter table knowledge enable row level security;
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;

-- 본인 데이터만 접근 가능 정책
create policy "users_own_events" on events for all using (auth.uid() = user_id);
create policy "users_own_knowledge" on knowledge for all using (auth.uid() = user_id);
create policy "users_own_sessions" on chat_sessions for all using (auth.uid() = user_id);
create policy "users_own_messages" on chat_messages for all
  using (session_id in (select id from chat_sessions where user_id = auth.uid()));

-- 실시간 구독 활성화
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table chat_messages;
