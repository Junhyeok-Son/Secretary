-- 개발용 임시 유저 생성 (auth.users에 직접 삽입)
-- Supabase SQL Editor에서 실행

insert into auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) values (
  '00000000-0000-0000-0000-000000000001',
  'dev@secretary.local',
  '',
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated',
  'authenticated'
) on conflict (id) do nothing;
